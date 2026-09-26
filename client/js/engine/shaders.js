/**
 * RetroFilm GLSL Shader Source Definitions
 * Optimized for low-end GPUs and high fidelity real-time playback.
 */

const Shaders = {
    // Vertex Shader (Full-screen quad)
    vertexShader: `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
        }
    `,

    // Multi-pass Halation & Bloom Extraction Shader
    extractionFragmentShader: `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_image;
        uniform float u_halationThreshold;
        uniform float u_bloomThreshold;
        uniform vec3 u_halationColor;
        uniform float u_halationIntensity;
        uniform float u_bloomIntensity;

        // Standard Rec.709 Luminance
        float getLuminance(vec3 c) {
            return dot(c, vec3(0.2126, 0.7152, 0.0722));
        }

        void main() {
            vec4 color = texture2D(u_image, v_texCoord);
            float lum = getLuminance(color.rgb);

            // Halation Extraction: smooth knee above threshold
            float halFactor = smoothstep(u_halationThreshold, 1.0, lum) * u_halationIntensity;
            vec3 halationOutput = u_halationColor * halFactor * max(color.rgb, vec3(0.2));

            // Bloom Extraction: highlight diffusion above bloom threshold
            float bloomFactor = smoothstep(u_bloomThreshold, 1.0, lum) * u_bloomIntensity;
            vec3 bloomOutput = color.rgb * bloomFactor;

            // Pack Halation into RGB and Bloom into Alpha
            gl_FragColor = vec4(halationOutput, bloomFactor * u_bloomIntensity);
        }
    `,

    // Separable 9-tap Gaussian Blur Shader for fast GPU glow
    blurFragmentShader: `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_image;
        uniform vec2 u_direction; // e.g. vec2(1.0/width, 0.0) or vec2(0.0, 1.0/height)
        uniform float u_radius;

        void main() {
            vec4 sum = vec4(0.0);
            vec2 dir = u_direction * max(u_radius, 0.1);

            // 9-tap Gaussian weights
            sum += texture2D(u_image, v_texCoord - dir * 4.0) * 0.0162162162;
            sum += texture2D(u_image, v_texCoord - dir * 3.0) * 0.0540540541;
            sum += texture2D(u_image, v_texCoord - dir * 2.0) * 0.1216216216;
            sum += texture2D(u_image, v_texCoord - dir * 1.0) * 0.1945945946;
            sum += texture2D(u_image, v_texCoord)              * 0.2270270270;
            sum += texture2D(u_image, v_texCoord + dir * 1.0) * 0.1945945946;
            sum += texture2D(u_image, v_texCoord + dir * 2.0) * 0.1216216216;
            sum += texture2D(u_image, v_texCoord + dir * 3.0) * 0.0540540541;
            sum += texture2D(u_image, v_texCoord + dir * 4.0) * 0.0162162162;

            gl_FragColor = sum;
        }
    `,

    // Master Composite Fragment Shader (Halation + Bloom + Grain + Tone + Split Screen)
    compositeFragmentShader: `
        precision mediump float;
        varying vec2 v_texCoord;

        uniform sampler2D u_originalImage;
        uniform sampler2D u_glowMap; // Blurred halation & bloom map
        uniform vec2 u_resolution;
        uniform float u_time;

        // Master switch
        uniform int u_masterEnabled;

        // Film Grain controls
        uniform int u_grainEnabled;
        uniform float u_grainAmount;
        uniform float u_grainSize;
        uniform float u_grainRoughness;
        uniform int u_grainColored;
        uniform float u_grainShadowsBias;

        // Halation controls
        uniform int u_halationEnabled;
        uniform float u_halationIntensity;
        uniform vec3 u_halationColor;

        // Bloom controls
        uniform int u_bloomEnabled;
        uniform float u_bloomIntensity;

        // Color & Tone controls
        uniform float u_contrast;
        uniform float u_saturation;
        uniform float u_temperature;
        uniform float u_tint;
        uniform float u_vignette;

        // Split-screen A/B comparison
        uniform int u_splitMode; // 0 = normal, 1 = split A/B
        uniform float u_splitPosition; // 0.0 to 1.0

        // High quality pseudo-random procedural noise
        float hash(vec2 p) {
            vec3 p3  = fract(vec3(p.xyx) * 0.1031);
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.x + p3.y) * p3.z);
        }

        float noise2D(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        // Multi-frequency procedural film grain generator
        float generateGrain(vec2 uv, float t, float roughness) {
            vec2 seed = uv + vec2(t * 17.13, t * 29.71);
            float n1 = hash(seed);
            
            // Roughness adds octave of larger grain clumps
            if (roughness > 0.05) {
                float n2 = noise2D(seed * 0.5);
                float n3 = noise2D(seed * 0.25);
                return mix(n1, (n1 * 0.5 + n2 * 0.35 + n3 * 0.15), roughness);
            }
            return n1;
        }

        float getLuminance(vec3 c) {
            return dot(c, vec3(0.2126, 0.7152, 0.0722));
        }

        vec3 adjustTone(vec3 color) {
            // Temperature & Tint
            color.r += u_temperature * 0.1;
            color.b -= u_temperature * 0.1;
            color.g += u_tint * 0.08;

            // Saturation
            float lum = getLuminance(color);
            color = mix(vec3(lum), color, u_saturation);

            // Contrast (S-Curve)
            color = (color - 0.5) * u_contrast + 0.5;

            // Vignette
            if (u_vignette > 0.01) {
                vec2 center = v_texCoord - vec2(0.5);
                float dist = length(center * vec2(u_resolution.x / u_resolution.y, 1.0));
                float vig = smoothstep(0.85, 0.25, dist * (u_vignette * 1.5 + 0.5));
                color *= clamp(vig, 0.0, 1.0);
            }

            return clamp(color, 0.0, 1.0);
        }

        void main() {
            vec4 rawColor = texture2D(u_originalImage, v_texCoord);

            // Split screen comparison check
            if (u_splitMode == 1) {
                if (v_texCoord.x < u_splitPosition) {
                    // Left side: original unmodified image
                    gl_FragColor = rawColor;
                    return;
                } else if (abs(v_texCoord.x - u_splitPosition) < (1.5 / u_resolution.x)) {
                    // Thin split divider line (clean white/gray)
                    gl_FragColor = vec4(0.9, 0.9, 0.9, 1.0);
                    return;
                }
            }

            // If master effect is turned OFF, return original footage
            if (u_masterEnabled == 0) {
                gl_FragColor = rawColor;
                return;
            }

            vec3 base = rawColor.rgb;
            vec4 glowData = texture2D(u_glowMap, v_texCoord);

            // 1. Apply Halation (Red/Orange glow around high-contrast areas)
            if (u_halationEnabled == 1 && u_halationIntensity > 0.0) {
                vec3 halationGlow = glowData.rgb * u_halationIntensity;
                // Photochemical film halation screen/soft-add blend
                base = 1.0 - (1.0 - base) * (1.0 - halationGlow * 1.2);
            }

            // 2. Apply Bloom (Dreamy soft highlight diffusion)
            if (u_bloomEnabled == 1 && u_bloomIntensity > 0.0) {
                float bloomGlow = glowData.a * u_bloomIntensity;
                vec3 bloomColor = mix(rawColor.rgb, vec3(1.0, 0.96, 0.92), 0.25);
                // Soft additive bloom blending
                base += bloomColor * bloomGlow * 0.75;
            }

            // 3. Apply Tone, Contrast, Saturation, Vignette
            base = adjustTone(base);

            // 4. Procedural Film Grain
            if (u_grainEnabled == 1 && u_grainAmount > 0.0) {
                // Scale coordinates by grain size
                float sizeScale = max(u_grainSize, 0.5);
                vec2 grainCoords = (v_texCoord * u_resolution) / sizeScale;

                float grainNoise = 0.0;
                vec3 grainColor = vec3(0.0);

                if (u_grainColored == 1) {
                    // Color grain: independent noise on R, G, B channels (like color dye clouds)
                    float gR = generateGrain(grainCoords, u_time, u_grainRoughness);
                    float gG = generateGrain(grainCoords + vec2(43.1, 19.3), u_time, u_grainRoughness);
                    float gB = generateGrain(grainCoords + vec2(87.4, 71.9), u_time, u_grainRoughness);
                    grainColor = (vec3(gR, gG, gB) - 0.5) * 2.0;
                } else {
                    // Monochromatic silver halide grain
                    grainNoise = (generateGrain(grainCoords, u_time, u_grainRoughness) - 0.5) * 2.0;
                    grainColor = vec3(grainNoise);
                }

                // Photochemical grain distribution:
                // Grain is strongest in midtones and shadows, falling off smoothly in bright highlights
                float lum = getLuminance(base);
                float grainMask = 1.0 - pow(lum, 1.8);
                // Bias midtone grain clumping
                grainMask *= (1.0 - abs(lum - 0.45) * 0.7);

                vec3 grainOffset = grainColor * u_grainAmount * grainMask * 0.35;
                
                // Overlay/Add blending
                base = clamp(base + grainOffset, 0.0, 1.0);
            }

            gl_FragColor = vec4(clamp(base, 0.0, 1.0), rawColor.a);
        }
    `
};
