/**
 * RetroFilm Presets Library & Preset Management Engine
 */

const DefaultPresets = {
    "subtly-cinematic": {
        id: "subtly-cinematic",
        name: "Subtly Cinematic (35mm)",
        description: "Gentle organic 35mm grain, delicate highlight bloom, subtle warm edge halation.",
        masterEnabled: true,
        grain: {
            enabled: true,
            amount: 0.22,
            size: 1.0,
            roughness: 0.25,
            colored: false
        },
        halation: {
            enabled: true,
            threshold: 0.72,
            radius: 8.0,
            intensity: 0.30,
            color: [1.0, 0.27, 0.05] // #ff4500
        },
        bloom: {
            enabled: true,
            threshold: 0.75,
            radius: 20.0,
            intensity: 0.25
        },
        tone: {
            contrast: 1.06,
            saturation: 1.04,
            temperature: 0.04,
            tint: 0.0,
            vignette: 0.10
        }
    },

    "16mm-vintage": {
        id: "16mm-vintage",
        name: "16mm Vintage Indie",
        description: "Coarser film grain, pronounced amber halation on bright edges, warm nostalgic tone.",
        masterEnabled: true,
        grain: {
            enabled: true,
            amount: 0.52,
            size: 1.6,
            roughness: 0.50,
            colored: false
        },
        halation: {
            enabled: true,
            threshold: 0.58,
            radius: 16.0,
            intensity: 0.65,
            color: [1.0, 0.35, 0.05] // #ff590d
        },
        bloom: {
            enabled: true,
            threshold: 0.62,
            radius: 30.0,
            intensity: 0.45
        },
        tone: {
            contrast: 1.15,
            saturation: 0.95,
            temperature: 0.14,
            tint: -0.02,
            vignette: 0.25
        }
    },

    "35mm-dreamy": {
        id: "35mm-dreamy",
        name: "35mm Dreamy Diffusion",
        description: "Ultra-soft highlight bloom (Pro-Mist style), fine organic grain, golden halation.",
        masterEnabled: true,
        grain: {
            enabled: true,
            amount: 0.28,
            size: 1.1,
            roughness: 0.30,
            colored: false
        },
        halation: {
            enabled: true,
            threshold: 0.64,
            radius: 14.0,
            intensity: 0.42,
            color: [1.0, 0.42, 0.08] // #ff6b14
        },
        bloom: {
            enabled: true,
            threshold: 0.52,
            radius: 48.0,
            intensity: 0.72
        },
        tone: {
            contrast: 0.98,
            saturation: 1.06,
            temperature: 0.08,
            tint: 0.01,
            vignette: 0.15
        }
    },

    "8mm-retro-grunge": {
        id: "8mm-retro-grunge",
        name: "8mm Retro Home Movie",
        description: "Heavy coarse grain with color variance, strong halation bleed, vintage warmth.",
        masterEnabled: true,
        grain: {
            enabled: true,
            amount: 0.75,
            size: 2.2,
            roughness: 0.75,
            colored: true
        },
        halation: {
            enabled: true,
            threshold: 0.50,
            radius: 22.0,
            intensity: 0.85,
            color: [1.0, 0.20, 0.02] // #ff3305
        },
        bloom: {
            enabled: true,
            threshold: 0.55,
            radius: 36.0,
            intensity: 0.58
        },
        tone: {
            contrast: 1.25,
            saturation: 0.90,
            temperature: 0.22,
            tint: -0.04,
            vignette: 0.40
        }
    },

    "kodak-vision3": {
        id: "kodak-vision3",
        name: "Kodak Vision3 500T",
        description: "Modern cinematic tungsten stock with ruby red halation on practical lights.",
        masterEnabled: true,
        grain: {
            enabled: true,
            amount: 0.34,
            size: 1.15,
            roughness: 0.35,
            colored: false
        },
        halation: {
            enabled: true,
            threshold: 0.68,
            radius: 12.0,
            intensity: 0.55,
            color: [1.0, 0.15, 0.08] // #ff2614
        },
        bloom: {
            enabled: true,
            threshold: 0.68,
            radius: 24.0,
            intensity: 0.35
        },
        tone: {
            contrast: 1.12,
            saturation: 1.08,
            temperature: -0.04,
            tint: 0.02,
            vignette: 0.12
        }
    },

    "cyberpunk-neon": {
        id: "cyberpunk-neon",
        name: "Cyberpunk Neon Glow",
        description: "Intense neon bloom, vivid chromatic red-orange halation, crisp modern texture.",
        masterEnabled: true,
        grain: {
            enabled: true,
            amount: 0.24,
            size: 0.9,
            roughness: 0.15,
            colored: false
        },
        halation: {
            enabled: true,
            threshold: 0.48,
            radius: 18.0,
            intensity: 0.82,
            color: [1.0, 0.08, 0.32] // #ff1452
        },
        bloom: {
            enabled: true,
            threshold: 0.42,
            radius: 52.0,
            intensity: 0.88
        },
        tone: {
            contrast: 1.30,
            saturation: 1.25,
            temperature: -0.06,
            tint: 0.05,
            vignette: 0.20
        }
    },

    "golden-hour-70s": {
        id: "golden-hour-70s",
        name: "Golden Hour 70s Cinema",
        description: "Lush amber highlights, soft glowing diffusion, warm photochemical skin tones.",
        masterEnabled: true,
        grain: {
            enabled: true,
            amount: 0.38,
            size: 1.3,
            roughness: 0.40,
            colored: false
        },
        halation: {
            enabled: true,
            threshold: 0.60,
            radius: 15.0,
            intensity: 0.58,
            color: [1.0, 0.48, 0.10] // #ff7a1a
        },
        bloom: {
            enabled: true,
            threshold: 0.58,
            radius: 32.0,
            intensity: 0.52
        },
        tone: {
            contrast: 1.08,
            saturation: 1.12,
            temperature: 0.26,
            tint: 0.02,
            vignette: 0.18
        }
    },

    "bw-noir-35mm": {
        id: "bw-noir-35mm",
        name: "B&W Silver Halide Noir",
        description: "High-contrast monochrome, rich silver grain structure, radiant specular glow.",
        masterEnabled: true,
        grain: {
            enabled: true,
            amount: 0.62,
            size: 1.45,
            roughness: 0.60,
            colored: false
        },
        halation: {
            enabled: true,
            threshold: 0.68,
            radius: 20.0,
            intensity: 0.50,
            color: [1.0, 0.95, 0.90] // monochrome specular halo
        },
        bloom: {
            enabled: true,
            threshold: 0.60,
            radius: 35.0,
            intensity: 0.65
        },
        tone: {
            contrast: 1.42,
            saturation: 0.0, // Monochromatic
            temperature: 0.0,
            tint: 0.0,
            vignette: 0.30
        }
    }
};

class PresetManager {
    constructor() {
        this.storageKey = "retrofilm_custom_presets";
    }

    getAllPresets() {
        const custom = this.getCustomPresets();
        return { ...DefaultPresets, ...custom };
    }

    getCustomPresets() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error("Failed to load custom presets:", e);
            return {};
        }
    }

    saveCustomPreset(id, name, state) {
        try {
            const custom = this.getCustomPresets();
            custom[id] = {
                ...JSON.parse(JSON.stringify(state)),
                id: id,
                name: name,
                isCustom: true,
                createdAt: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(custom));
            return true;
        } catch (e) {
            console.error("Failed to save custom preset:", e);
            return false;
        }
    }

    deleteCustomPreset(id) {
        try {
            const custom = this.getCustomPresets();
            if (custom[id]) {
                delete custom[id];
                localStorage.setItem(this.storageKey, JSON.stringify(custom));
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    exportPresetsJSON() {
        const all = this.getAllPresets();
        return JSON.stringify(all, null, 2);
    }

    importPresetsJSON(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            const custom = this.getCustomPresets();
            Object.keys(parsed).forEach(k => {
                if (!DefaultPresets[k]) {
                    custom[k] = parsed[k];
                }
            });
            localStorage.setItem(this.storageKey, JSON.stringify(custom));
            return true;
        } catch (e) {
            return false;
        }
    }
}
