/**
 * Built-in Cinematic Test Footage Generator
 * Synthesizes photorealistic high-dynamic-range test scenes for testing Halation, Bloom, and Grain.
 */

class CinematicSampleGenerator {
    /**
     * Generates a high-contrast cinematic scene onto an offscreen canvas.
     * @param {string} sceneType - "neon-city" | "golden-hour" | "studio-portrait" | "high-contrast"
     * @param {number} width - 1280
     * @param {number} height - 720
     */
    static generateScene(sceneType, width = 1280, height = 720) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (sceneType === "neon-city") {
            this.drawNeonCityScene(ctx, width, height);
        } else if (sceneType === "golden-hour") {
            this.drawGoldenHourScene(ctx, width, height);
        } else if (sceneType === "studio-portrait") {
            this.drawStudioPortraitScene(ctx, width, height);
        } else {
            this.drawHighContrastScene(ctx, width, height);
        }

        return canvas;
    }

    static drawNeonCityScene(ctx, w, h) {
        // Deep midnight gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, "#05050f");
        bgGrad.addColorStop(0.5, "#0b0b1a");
        bgGrad.addColorStop(1, "#120a16");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Distant city buildings silhouettes
        ctx.fillStyle = "#070710";
        for (let i = 0; i < 18; i++) {
            const bx = (w / 18) * i;
            const bw = w / 18 + 5;
            const bh = h * (0.3 + Math.sin(i * 1.5) * 0.2);
            ctx.fillRect(bx, h - bh, bw, bh);

            // Lit windows
            ctx.fillStyle = "#fef08a";
            for (let wy = h - bh + 20; wy < h - 40; wy += 28) {
                if ((i + wy) % 3 === 0) {
                    ctx.fillRect(bx + 12, wy, 8, 14);
                }
            }
            ctx.fillStyle = "#070710";
        }

        // Wet asphalt road reflection
        const roadGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
        roadGrad.addColorStop(0, "#101018");
        roadGrad.addColorStop(1, "#08080c");
        ctx.fillStyle = roadGrad;
        ctx.fillRect(0, h * 0.7, w, h * 0.3);

        // Bright Neon Sign 1: Intense Magenta "CINEMA 35MM"
        ctx.font = "bold 64px sans-serif";
        ctx.textAlign = "center";
        
        // Specular core (Pure White)
        ctx.fillStyle = "#ffffff";
        ctx.fillText("CINEMA 35MM", w * 0.5, h * 0.32);
        
        // Neon Glow Ring (Vivid Cyan/Magenta)
        ctx.strokeStyle = "#ff007f";
        ctx.lineWidth = 6;
        ctx.strokeText("CINEMA 35MM", w * 0.5, h * 0.32);

        // Neon Sign 2: Amber "KODAK 500T"
        ctx.font = "bold 38px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("★ HALATION & BLOOM LAB ★", w * 0.5, h * 0.45);
        ctx.strokeStyle = "#ffaa00";
        ctx.lineWidth = 4;
        ctx.strokeText("★ HALATION & BLOOM LAB ★", w * 0.5, h * 0.45);

        // Specular Street Lamps (Extreme contrast test for Halation)
        const lamps = [
            { x: w * 0.18, y: h * 0.65, r: 16 },
            { x: w * 0.82, y: h * 0.65, r: 16 },
            { x: w * 0.35, y: h * 0.58, r: 10 },
            { x: w * 0.65, y: h * 0.58, r: 10 }
        ];

        lamps.forEach(lamp => {
            // Bright white tungsten filament
            const lampGrad = ctx.createRadialGradient(lamp.x, lamp.y, 2, lamp.x, lamp.y, lamp.r * 2);
            lampGrad.addColorStop(0, "#ffffff");
            lampGrad.addColorStop(0.3, "#fffbeb");
            lampGrad.addColorStop(0.7, "#f59e0b");
            lampGrad.addColorStop(1, "rgba(245, 158, 11, 0)");

            ctx.fillStyle = lampGrad;
            ctx.beginPath();
            ctx.arc(lamp.x, lamp.y, lamp.r * 2, 0, Math.PI * 2);
            ctx.fill();

            // Core bulb
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(lamp.x, lamp.y, lamp.r * 0.6, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    static drawGoldenHourScene(ctx, w, h) {
        // Sunset sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, "#1e1b4b");
        skyGrad.addColorStop(0.35, "#be185d");
        skyGrad.addColorStop(0.65, "#f97316");
        skyGrad.addColorStop(0.85, "#fde047");
        skyGrad.addColorStop(1, "#451a03");
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Blazing Golden Sun (Specular Highlight)
        const sunX = w * 0.72;
        const sunY = h * 0.48;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 180);
        sunGrad.addColorStop(0, "#ffffff");
        sunGrad.addColorStop(0.2, "#fef08a");
        sunGrad.addColorStop(0.6, "#f97316");
        sunGrad.addColorStop(1, "rgba(249, 115, 22, 0)");

        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 180, 0, Math.PI * 2);
        ctx.fill();

        // Mountain silhouettes in foreground (High-contrast edge against the sunset)
        ctx.fillStyle = "#180c10";
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, h * 0.75);
        ctx.lineTo(w * 0.25, h * 0.58);
        ctx.lineTo(w * 0.5, h * 0.68);
        ctx.lineTo(w * 0.75, h * 0.52);
        ctx.lineTo(w, h * 0.7);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();

        // Pine trees silhouette along ridge
        ctx.fillStyle = "#0d060a";
        for (let x = 0; x < w; x += 18) {
            const ty = h * 0.65 + Math.sin(x * 0.01) * 40;
            ctx.beginPath();
            ctx.moveTo(x, ty);
            ctx.lineTo(x + 8, ty - 35);
            ctx.lineTo(x + 16, ty);
            ctx.fill();
        }
    }

    static drawStudioPortraitScene(ctx, w, h) {
        // Dark studio background
        const bg = ctx.createRadialGradient(w * 0.5, h * 0.45, 50, w * 0.5, h * 0.5, w * 0.6);
        bg.addColorStop(0, "#2c2d30");
        bg.addColorStop(1, "#0a0a0c");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Silhouette / Portrait Model
        ctx.fillStyle = "#1e1b18";
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h * 0.55, w * 0.16, h * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shoulders
        ctx.beginPath();
        ctx.moveTo(w * 0.25, h);
        ctx.quadraticCurveTo(w * 0.5, h * 0.72, w * 0.75, h);
        ctx.fill();

        // Rim Light / Kicker (Pure white highlight along right rim for Halation bleed)
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.55, w * 0.16, -Math.PI * 0.35, Math.PI * 0.35);
        ctx.stroke();

        // Practical studio bulb hanging behind
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(w * 0.78, h * 0.30, 18, 0, Math.PI * 2);
        ctx.fill();
    }

    static drawHighContrastScene(ctx, w, h) {
        // Monochrome / Chiaroscuro test pattern
        ctx.fillStyle = "#080808";
        ctx.fillRect(0, 0, w, h);

        // High dynamic range step wedge
        const steps = 11;
        const sw = (w * 0.8) / steps;
        const sh = 70;
        const sx = w * 0.1;
        const sy = h * 0.18;

        for (let i = 0; i < steps; i++) {
            const val = Math.pow(i / (steps - 1), 2.2);
            ctx.fillStyle = `rgb(${Math.round(val * 255)}, ${Math.round(val * 255)}, ${Math.round(val * 255)})`;
            ctx.fillRect(sx + i * sw, sy, sw - 2, sh);
        }

        // Circular highlight blooms & edge halation targets
        const targets = [
            { x: w * 0.25, y: h * 0.65, r: 50, c: "#ffffff" },
            { x: w * 0.50, y: h * 0.65, r: 35, c: "#ffeedd" },
            { x: w * 0.75, y: h * 0.65, r: 20, c: "#ffffff" }
        ];

        targets.forEach(t => {
            ctx.fillStyle = t.c;
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#333333";
            ctx.lineWidth = 4;
            ctx.strokeRect(t.x - t.r - 10, t.y - t.r - 10, (t.r + 10) * 2, (t.r + 10) * 2);
        });

        // Test label
        ctx.fillStyle = "#999999";
        ctx.font = "14px monospace";
        ctx.textAlign = "center";
        ctx.fillText("RETROFILM OPTICAL CALIBRATION CHART", w * 0.5, h * 0.92);
    }
}
