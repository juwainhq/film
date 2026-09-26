/**
 * High-Performance WebGL Real-Time Renderer for RetroFilm CEP Panel
 * Utilizes multi-pass FBO pipeline for fast halation/bloom extraction,
 * separable Gaussian blur, and procedural grain compositing.
 */

class WebGLFilmRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, alpha: false, antialias: false }) ||
                  canvas.getContext("experimental-webgl", { preserveDrawingBuffer: true, alpha: false, antialias: false });

        this.isSupported = !!this.gl;
        if (!this.isSupported) {
            console.warn("WebGL not supported. Falling back to Canvas 2D engine.");
            return;
        }

        this.sourceTexture = null;
        this.fboExtract = null;
        this.fboBlurH = null;
        this.fboBlurV = null;
        this.glowScale = 0.5; // Downscale glow pass for maximum speed on low-spec GPUs

        this.imageWidth = 1920;
        this.imageHeight = 1080;
        this.time = 0;
        this.isAnimating = true;

        this.initGL();
    }

    initGL() {
        const gl = this.gl;

        // Quad geometry
        const quadVertices = new Float32Array([
            -1.0, -1.0,  0.0, 0.0,
             1.0, -1.0,  1.0, 0.0,
            -1.0,  1.0,  0.0, 1.0,
            -1.0,  1.0,  0.0, 1.0,
             1.0, -1.0,  1.0, 0.0,
             1.0,  1.0,  1.0, 1.0
        ]);

        this.quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

        // Compile shaders
        this.extractProgram = this.createProgram(Shaders.vertexShader, Shaders.extractionFragmentShader);
        this.blurProgram = this.createProgram(Shaders.vertexShader, Shaders.blurFragmentShader);
        this.compositeProgram = this.createProgram(Shaders.vertexShader, Shaders.compositeFragmentShader);

        this.sourceTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    createShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader compile error:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createProgram(vsSource, fsSource) {
        const gl = this.gl;
        const vs = this.createShader(gl.VERTEX_SHADER, vsSource);
        const fs = this.createShader(gl.FRAGMENT_SHADER, fsSource);
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program link error:", gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    createFBO(width, height) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return { fbo: fbo, texture: texture, width: width, height: height };
    }

    resizeFBOs(width, height) {
        const gl = this.gl;
        const glowW = Math.max(64, Math.floor(width * this.glowScale));
        const glowH = Math.max(64, Math.floor(height * this.glowScale));

        if (this.fboExtract) {
            gl.deleteFramebuffer(this.fboExtract.fbo);
            gl.deleteTexture(this.fboExtract.texture);
        }
        if (this.fboBlurH) {
            gl.deleteFramebuffer(this.fboBlurH.fbo);
            gl.deleteTexture(this.fboBlurH.texture);
        }
        if (this.fboBlurV) {
            gl.deleteFramebuffer(this.fboBlurV.fbo);
            gl.deleteTexture(this.fboBlurV.texture);
        }

        this.fboExtract = this.createFBO(glowW, glowH);
        this.fboBlurH = this.createFBO(glowW, glowH);
        this.fboBlurV = this.createFBO(glowW, glowH);
    }

    uploadSource(imageOrVideo) {
        if (!this.isSupported || !imageOrVideo) return;
        const gl = this.gl;

        const w = imageOrVideo.videoWidth || imageOrVideo.naturalWidth || imageOrVideo.width || 1280;
        const h = imageOrVideo.videoHeight || imageOrVideo.naturalHeight || imageOrVideo.height || 720;

        if (w !== this.imageWidth || h !== this.imageHeight || !this.fboExtract) {
            this.imageWidth = w;
            this.imageHeight = h;
            this.resizeFBOs(w, h);
        }

        gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageOrVideo);
    }

    setupAttributes(program) {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        const aPos = gl.getAttribLocation(program, "a_position");
        const aTex = gl.getAttribLocation(program, "a_texCoord");

        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);

        gl.enableVertexAttribArray(aTex);
        gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 16, 8);
    }

    render(state) {
        if (!this.isSupported || !this.sourceTexture) return;
        const gl = this.gl;

        if (this.isAnimating) {
            this.time += 0.0416; // ~24 fps temporal advance
        }

        const glowW = this.fboExtract.width;
        const glowH = this.fboExtract.height;

        // --- Pass 1: Extract Halation & Bloom Highlights ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboExtract.fbo);
        gl.viewport(0, 0, glowW, glowH);
        gl.useProgram(this.extractProgram);
        this.setupAttributes(this.extractProgram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
        gl.uniform1i(gl.getUniformLocation(this.extractProgram, "u_image"), 0);

        gl.uniform1f(gl.getUniformLocation(this.extractProgram, "u_halationThreshold"), state.halation.threshold);
        gl.uniform1f(gl.getUniformLocation(this.extractProgram, "u_bloomThreshold"), state.bloom.threshold);
        
        const hColor = state.halation.color || [1.0, 0.27, 0.05];
        gl.uniform3f(gl.getUniformLocation(this.extractProgram, "u_halationColor"), hColor[0], hColor[1], hColor[2]);
        gl.uniform1f(gl.getUniformLocation(this.extractProgram, "u_halationIntensity"), state.masterEnabled && state.halation.enabled ? state.halation.intensity : 0.0);
        gl.uniform1f(gl.getUniformLocation(this.extractProgram, "u_bloomIntensity"), state.masterEnabled && state.bloom.enabled ? state.bloom.intensity : 0.0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // --- Pass 2: Horizontal Gaussian Blur ---
        const blurRadius = Math.max(state.halation.radius, state.bloom.radius);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboBlurH.fbo);
        gl.viewport(0, 0, glowW, glowH);
        gl.useProgram(this.blurProgram);
        this.setupAttributes(this.blurProgram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.fboExtract.texture);
        gl.uniform1i(gl.getUniformLocation(this.blurProgram, "u_image"), 0);
        gl.uniform2f(gl.getUniformLocation(this.blurProgram, "u_direction"), 1.0 / glowW, 0.0);
        gl.uniform1f(gl.getUniformLocation(this.blurProgram, "u_radius"), blurRadius * 0.4);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // --- Pass 3: Vertical Gaussian Blur ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboBlurV.fbo);
        gl.viewport(0, 0, glowW, glowH);
        this.setupAttributes(this.blurProgram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.fboBlurH.texture);
        gl.uniform1i(gl.getUniformLocation(this.blurProgram, "u_image"), 0);
        gl.uniform2f(gl.getUniformLocation(this.blurProgram, "u_direction"), 0.0, 1.0 / glowH);
        gl.uniform1f(gl.getUniformLocation(this.blurProgram, "u_radius"), blurRadius * 0.4);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // --- Pass 4: Master Composite to Screen Canvas ---
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.compositeProgram);
        this.setupAttributes(this.compositeProgram);

        // Bind raw texture & blurred glow texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
        gl.uniform1i(gl.getUniformLocation(this.compositeProgram, "u_originalImage"), 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.fboBlurV.texture);
        gl.uniform1i(gl.getUniformLocation(this.compositeProgram, "u_glowMap"), 1);

        // Pass Uniforms
        gl.uniform2f(gl.getUniformLocation(this.compositeProgram, "u_resolution"), this.canvas.width, this.canvas.height);
        gl.uniform1f(gl.getUniformLocation(this.compositeProgram, "u_time"), this.time);
        gl.uniform1i(gl.getUniformLocation(this.compositeProgram, "u_masterEnabled"), state.masterEnabled ? 1 : 0);

        // Grain
        gl.uniform1i(gl.getUniformLocation(this.compositeProgram, "u_grainEnabled"), state.grain.enabled ? 1 : 0);
        gl.uniform1f(gl.getUniformLocation(this.compositeProgram, "u_grainAmount"), state.grain.amount);
        gl.uniform1f(gl.getUniformLocation(this.compositeProgram, "u_grainSize"), state.grain.size);
        gl.uniform1f(gl.getUniformLocation(this.compositeProgram, "u_grainRoughness"), state.grain.roughness);
        gl.uniform1i(gl.getUniformLocation(this.compositeProgram, "u_grainColored"), state.grain.colored ? 1 : 0);

        // Halation
        gl.uniform1i(gl.getUniformLocation(this.compositeProgram, "u_halationEnabled"), state.halation.enabled ? 1 : 0);
        gl.uniform1f(gl.getUniformLocation(this.compositeProgram, "u_halationIntensity"), state.halation.intensity);
        gl.uniform3f(gl.getUniformLocation(this.compositeProgram, "u_halationColor"), hColor[0], hColor[1], hColor[2]);

        // Bloom
        gl.uniform1i(gl.getUniformLocation(this.compositeProgram, "u_bloomEnabled"), state.bloom.enabled ? 1 : 0);
        gl.uniform1f(gl.getUniformLocation(this.compositeProgram, "u_bloomIntensity"), state.bloom.intensity);

        // Tone & Vignette
        gl.uniform1f(gl.getUniformLocation(this.compositeProgram, "u_contrast"), state.tone ? state.tone.contrast : 1.0);
        gl.uniform1f(gl.getUniformLocation(this.compositeProgram, "u_saturation"), state.tone ? state.tone.saturation : 1.0);
        gl.uniform1f(gl.getUniformLocation(this.compositeProgram, "u_temperature"), state.tone ? state.tone.temperature : 0.0);
        gl.uniform1f(gl.getUniformLocation(this.compositeProgram, "u_tint"), state.tone ? state.tone.tint : 0.0);
        gl.uniform1f(gl.getUniformLocation(this.compositeProgram, "u_vignette"), state.tone ? state.tone.vignette : 0.0);

        // Split A/B mode
        gl.uniform1i(gl.getUniformLocation(this.compositeProgram, "u_splitMode"), state.splitMode ? 1 : 0);
        gl.uniform1f(gl.getUniformLocation(this.compositeProgram, "u_splitPosition"), state.splitPosition !== undefined ? state.splitPosition : 0.5);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}
