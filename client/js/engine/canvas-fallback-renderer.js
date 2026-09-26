/**
 * Canvas 2D Fallback Engine for RetroFilm
 * Provides software-rendered Halation, Bloom, and Grain for low-end devices without WebGL.
 */

class CanvasFallbackRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.offscreenCanvas = document.createElement("canvas");
        this.offscreenCtx = this.offscreenCanvas.getContext("2d");
        this.glowCanvas = document.createElement("canvas");
        this.glowCtx = this.glowCanvas.getContext("2d");
        this.grainPattern = null;
        this.time = 0;
        this.isSupported = true;
    }

    uploadSource(imageOrVideo) {
        this.source = imageOrVideo;
    }

    render(state) {
        if (!this.source || !this.ctx) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.time += 0.04;

        if (!state.masterEnabled) {
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(this.source, 0, 0, w, h);
            return;
        }

        // Draw Base Image
        ctx.save();
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(this.source, 0, 0, w, h);

        // Halation & Bloom pass using offscreen composite
        if ((state.halation.enabled && state.halation.intensity > 0) || (state.bloom.enabled && state.bloom.intensity > 0)) {
            this.glowCanvas.width = Math.floor(w * 0.5);
            this.glowCanvas.height = Math.floor(h * 0.5);

            // Draw high-pass thresholded glow
            this.glowCtx.clearRect(0, 0, this.glowCanvas.width, this.glowCanvas.height);
            this.glowCtx.filter = `blur(${Math.max(2, state.halation.radius * 0.3)}px)`;
            this.glowCtx.drawImage(this.source, 0, 0, this.glowCanvas.width, this.glowCanvas.height);

            if (state.halation.enabled && state.halation.intensity > 0) {
                ctx.save();
                ctx.globalCompositeOperation = "screen";
                ctx.globalAlpha = state.halation.intensity * 0.7;
                ctx.fillStyle = `rgb(${Math.round(state.halation.color[0]*255)}, ${Math.round(state.halation.color[1]*255)}, ${Math.round(state.halation.color[2]*255)})`;
                ctx.fillRect(0, 0, w, h);
                ctx.globalCompositeOperation = "source-in";
                ctx.drawImage(this.glowCanvas, 0, 0, w, h);
                ctx.restore();
            }

            if (state.bloom.enabled && state.bloom.intensity > 0) {
                ctx.save();
                ctx.globalCompositeOperation = "screen";
                ctx.globalAlpha = state.bloom.intensity * 0.5;
                ctx.drawImage(this.glowCanvas, 0, 0, w, h);
                ctx.restore();
            }
        }

        // Film Grain Procedural Pass
        if (state.grain.enabled && state.grain.amount > 0) {
            const grainSize = Math.max(1, Math.round(state.grain.size));
            const gw = Math.floor(w / grainSize);
            const gh = Math.floor(h / grainSize);

            this.offscreenCanvas.width = gw;
            this.offscreenCanvas.height = gh;
            const imgData = this.offscreenCtx.createImageData(gw, gh);
            const data = imgData.data;
            const amt = state.grain.amount * 45;

            for (let i = 0; i < data.length; i += 4) {
                const noise = (Math.random() - 0.5) * amt;
                data[i] = 128 + noise;
                data[i + 1] = 128 + noise;
                data[i + 2] = 128 + noise;
                data[i + 3] = Math.min(255, state.grain.amount * 180);
            }

            this.offscreenCtx.putImageData(imgData, 0, 0);
            ctx.save();
            ctx.globalCompositeOperation = "overlay";
            ctx.drawImage(this.offscreenCanvas, 0, 0, w, h);
            ctx.restore();
        }

        // Split screen divider if active
        if (state.splitMode) {
            const splitX = Math.round(w * (state.splitPosition || 0.5));
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, splitX, h);
            ctx.clip();
            ctx.drawImage(this.source, 0, 0, w, h);
            ctx.restore();

            // Line
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(splitX, 0);
            ctx.lineTo(splitX, h);
            ctx.stroke();
        }

        ctx.restore();
    }
}
