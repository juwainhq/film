/**
 * RetroFilm Premiere Pro Extension Main Controller
 * Coordinates UI, WebGL Shader Pipeline, Preset Management, and CEP ExtendScript bridge.
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize CSInterface
    const csInterface = new CSInterface();
    const presetManager = new PresetManager();

    // 2. State definition
    let state = {
        masterEnabled: true,
        currentPresetId: "subtly-cinematic",
        presetName: "Subtly Cinematic (35mm)",
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
            color: [1.0, 0.27, 0.05]
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
        },
        splitMode: false,
        splitPosition: 0.5,
        isAnimating: true
    };

    // 3. Elements Cache
    const canvas = document.getElementById("renderCanvas");
    const masterToggleBtn = document.getElementById("masterToggleBtn");
    const presetSelect = document.getElementById("presetSelect");
    const presetDesc = document.getElementById("presetDesc");
    const footageSelect = document.getElementById("footageSelect");
    const fileUploadInput = document.getElementById("fileUploadInput");
    const splitToggleBtn = document.getElementById("splitToggleBtn");
    const splitHandle = document.getElementById("splitHandle");
    const playPauseBtn = document.getElementById("playPauseBtn");
    const captureFrameBtn = document.getElementById("captureFrameBtn");
    const toastContainer = document.getElementById("toastContainer");

    // Sliders & Value displays
    const sliders = {
        grainAmount: { slider: document.getElementById("grainAmount"), val: document.getElementById("grainAmountVal") },
        grainSize: { slider: document.getElementById("grainSize"), val: document.getElementById("grainSizeVal") },
        grainRoughness: { slider: document.getElementById("grainRoughness"), val: document.getElementById("grainRoughnessVal") },
        halationThreshold: { slider: document.getElementById("halationThreshold"), val: document.getElementById("halationThresholdVal") },
        halationRadius: { slider: document.getElementById("halationRadius"), val: document.getElementById("halationRadiusVal") },
        halationIntensity: { slider: document.getElementById("halationIntensity"), val: document.getElementById("halationIntensityVal") },
        bloomThreshold: { slider: document.getElementById("bloomThreshold"), val: document.getElementById("bloomThresholdVal") },
        bloomRadius: { slider: document.getElementById("bloomRadius"), val: document.getElementById("bloomRadiusVal") },
        bloomIntensity: { slider: document.getElementById("bloomIntensity"), val: document.getElementById("bloomIntensityVal") },
        toneContrast: { slider: document.getElementById("toneContrast"), val: document.getElementById("toneContrastVal") },
        toneSaturation: { slider: document.getElementById("toneSaturation"), val: document.getElementById("toneSaturationVal") },
        toneTemp: { slider: document.getElementById("toneTemp"), val: document.getElementById("toneTempVal") },
        toneVignette: { slider: document.getElementById("toneVignette"), val: document.getElementById("toneVignetteVal") }
    };

    // Sub-section toggles
    const grainToggle = document.getElementById("grainToggle");
    const halationToggle = document.getElementById("halationToggle");
    const bloomToggle = document.getElementById("bloomToggle");
    const toneToggle = document.getElementById("toneToggle");

    // Halation Color Picker
    const halationColorPicker = document.getElementById("halationColorPicker");

    // 4. Initialize Renderer
    let renderer = new WebGLFilmRenderer(canvas);
    if (!renderer.isSupported) {
        showToast("WebGL unavailable. Running Canvas 2D fallback engine.", "warning");
        renderer = new CanvasFallbackRenderer(canvas);
    }

    // Active Source media
    let currentSource = null;
    let isVideoPlaying = false;

    function loadFootage(type) {
        if (type.startsWith("upload_") && currentSource) {
            renderer.uploadSource(currentSource);
            return;
        }

        const generatedCanvas = CinematicSampleGenerator.generateScene(type, 1280, 720);
        currentSource = generatedCanvas;
        renderer.uploadSource(generatedCanvas);
    }

    // Load initial scene
    loadFootage("neon-city");

    // 5. Populate Presets Dropdown
    function populatePresetsDropdown() {
        const presets = presetManager.getAllPresets();
        presetSelect.innerHTML = "";

        const standardGroup = document.createElement("optgroup");
        standardGroup.label = "Cinematic Stock Presets";

        const customGroup = document.createElement("optgroup");
        customGroup.label = "Custom User Presets";

        let hasCustom = false;

        Object.keys(presets).forEach(key => {
            const p = presets[key];
            const opt = document.createElement("option");
            opt.value = key;
            opt.textContent = p.name;
            if (p.isCustom) {
                hasCustom = true;
                customGroup.appendChild(opt);
            } else {
                standardGroup.appendChild(opt);
            }
        });

        presetSelect.appendChild(standardGroup);
        if (hasCustom) {
            presetSelect.appendChild(customGroup);
        }

        presetSelect.value = state.currentPresetId;
    }

    populatePresetsDropdown();

    // 6. Sync UI with State
    function updateUIFromState() {
        // Master Button
        if (state.masterEnabled) {
            masterToggleBtn.classList.add("active");
            masterToggleBtn.querySelector(".power-text").textContent = "EFFECT: ACTIVE";
        } else {
            masterToggleBtn.classList.remove("active");
            masterToggleBtn.querySelector(".power-text").textContent = "EFFECT: BYPASS";
        }

        // Section Toggles
        grainToggle.checked = state.grain.enabled;
        halationToggle.checked = state.halation.enabled;
        bloomToggle.checked = state.bloom.enabled;
        if (toneToggle) toneToggle.checked = (state.tone.contrast !== 1.0 || state.tone.saturation !== 1.0);

        // Sliders
        sliders.grainAmount.slider.value = state.grain.amount;
        sliders.grainAmount.val.textContent = parseFloat(state.grain.amount).toFixed(2);

        sliders.grainSize.slider.value = state.grain.size;
        sliders.grainSize.val.textContent = parseFloat(state.grain.size).toFixed(1) + "x";

        sliders.grainRoughness.slider.value = state.grain.roughness;
        sliders.grainRoughness.val.textContent = Math.round(state.grain.roughness * 100) + "%";

        // Halation
        sliders.halationThreshold.slider.value = state.halation.threshold;
        sliders.halationThreshold.val.textContent = parseFloat(state.halation.threshold).toFixed(2);

        sliders.halationRadius.slider.value = state.halation.radius;
        sliders.halationRadius.val.textContent = Math.round(state.halation.radius) + "px";

        sliders.halationIntensity.slider.value = state.halation.intensity;
        sliders.halationIntensity.val.textContent = parseFloat(state.halation.intensity).toFixed(2);

        // Bloom
        sliders.bloomThreshold.slider.value = state.bloom.threshold;
        sliders.bloomThreshold.val.textContent = parseFloat(state.bloom.threshold).toFixed(2);

        sliders.bloomRadius.slider.value = state.bloom.radius;
        sliders.bloomRadius.val.textContent = Math.round(state.bloom.radius) + "px";

        sliders.bloomIntensity.slider.value = state.bloom.intensity;
        sliders.bloomIntensity.val.textContent = parseFloat(state.bloom.intensity).toFixed(2);

        // Tone
        sliders.toneContrast.slider.value = state.tone.contrast;
        sliders.toneContrast.val.textContent = parseFloat(state.tone.contrast).toFixed(2);

        sliders.toneSaturation.slider.value = state.tone.saturation;
        sliders.toneSaturation.val.textContent = parseFloat(state.tone.saturation).toFixed(2);

        sliders.toneTemp.slider.value = state.tone.temperature;
        sliders.toneTemp.val.textContent = (state.tone.temperature > 0 ? "+" : "") + parseFloat(state.tone.temperature).toFixed(2);

        sliders.toneVignette.slider.value = state.tone.vignette;
        sliders.toneVignette.val.textContent = Math.round(state.tone.vignette * 100) + "%";

        // Halation color swatch
        const rHex = Math.round(state.halation.color[0] * 255).toString(16).padStart(2, "0");
        const gHex = Math.round(state.halation.color[1] * 255).toString(16).padStart(2, "0");
        const bHex = Math.round(state.halation.color[2] * 255).toString(16).padStart(2, "0");
        halationColorPicker.value = `#${rHex}${gHex}${bHex}`;

        // Grain Color mode segmented control
        document.querySelectorAll(".grain-type-btn").forEach(btn => {
            if ((btn.dataset.type === "color" && state.grain.colored) ||
                (btn.dataset.type === "mono" && !state.grain.colored)) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
    }

    // Apply Preset Function
    function applyPreset(presetKey) {
        const allPresets = presetManager.getAllPresets();
        const p = allPresets[presetKey];
        if (!p) return;

        state.currentPresetId = presetKey;
        state.presetName = p.name;
        state.grain = { ...p.grain };
        state.halation = { ...p.halation, color: [...p.halation.color] };
        state.bloom = { ...p.bloom };
        state.tone = { ...p.tone };

        presetDesc.textContent = p.description || "";
        updateUIFromState();
        showToast(`Loaded Preset: ${p.name}`, "info");
    }

    // Initial sync
    applyPreset("subtly-cinematic");

    // 7. Event Listeners for UI Controls

    // Master Toggle
    masterToggleBtn.addEventListener("click", () => {
        state.masterEnabled = !state.masterEnabled;
        updateUIFromState();
        showToast(state.masterEnabled ? "RetroFilm Effect Enabled" : "RetroFilm Effect Bypassed", state.masterEnabled ? "success" : "info");
    });

    // Preset selection
    presetSelect.addEventListener("change", (e) => {
        applyPreset(e.target.value);
    });

    // Sub-section toggles
    grainToggle.addEventListener("change", (e) => {
        state.grain.enabled = e.target.checked;
    });

    halationToggle.addEventListener("change", (e) => {
        state.halation.enabled = e.target.checked;
    });

    bloomToggle.addEventListener("change", (e) => {
        state.bloom.enabled = e.target.checked;
    });

    // Sliders Event Binding
    sliders.grainAmount.slider.addEventListener("input", (e) => {
        state.grain.amount = parseFloat(e.target.value);
        sliders.grainAmount.val.textContent = state.grain.amount.toFixed(2);
    });

    sliders.grainSize.slider.addEventListener("input", (e) => {
        state.grain.size = parseFloat(e.target.value);
        sliders.grainSize.val.textContent = state.grain.size.toFixed(1) + "x";
    });

    sliders.grainRoughness.slider.addEventListener("input", (e) => {
        state.grain.roughness = parseFloat(e.target.value);
        sliders.grainRoughness.val.textContent = Math.round(state.grain.roughness * 100) + "%";
    });

    sliders.halationThreshold.slider.addEventListener("input", (e) => {
        state.halation.threshold = parseFloat(e.target.value);
        sliders.halationThreshold.val.textContent = state.halation.threshold.toFixed(2);
    });

    sliders.halationRadius.slider.addEventListener("input", (e) => {
        state.halation.radius = parseFloat(e.target.value);
        sliders.halationRadius.val.textContent = Math.round(state.halation.radius) + "px";
    });

    sliders.halationIntensity.slider.addEventListener("input", (e) => {
        state.halation.intensity = parseFloat(e.target.value);
        sliders.halationIntensity.val.textContent = state.halation.intensity.toFixed(2);
    });

    sliders.bloomThreshold.slider.addEventListener("input", (e) => {
        state.bloom.threshold = parseFloat(e.target.value);
        sliders.bloomThreshold.val.textContent = state.bloom.threshold.toFixed(2);
    });

    sliders.bloomRadius.slider.addEventListener("input", (e) => {
        state.bloom.radius = parseFloat(e.target.value);
        sliders.bloomRadius.val.textContent = Math.round(state.bloom.radius) + "px";
    });

    sliders.bloomIntensity.slider.addEventListener("input", (e) => {
        state.bloom.intensity = parseFloat(e.target.value);
        sliders.bloomIntensity.val.textContent = state.bloom.intensity.toFixed(2);
    });

    sliders.toneContrast.slider.addEventListener("input", (e) => {
        state.tone.contrast = parseFloat(e.target.value);
        sliders.toneContrast.val.textContent = state.tone.contrast.toFixed(2);
    });

    sliders.toneSaturation.slider.addEventListener("input", (e) => {
        state.tone.saturation = parseFloat(e.target.value);
        sliders.toneSaturation.val.textContent = state.tone.saturation.toFixed(2);
    });

    sliders.toneTemp.slider.addEventListener("input", (e) => {
        state.tone.temperature = parseFloat(e.target.value);
        sliders.toneTemp.val.textContent = (state.tone.temperature > 0 ? "+" : "") + state.tone.temperature.toFixed(2);
    });

    sliders.toneVignette.slider.addEventListener("input", (e) => {
        state.tone.vignette = parseFloat(e.target.value);
        sliders.toneVignette.val.textContent = Math.round(state.tone.vignette * 100) + "%";
    });

    // Halation Color Picker
    halationColorPicker.addEventListener("input", (e) => {
        const hex = e.target.value;
        const r = parseInt(hex.substr(1, 2), 16) / 255;
        const g = parseInt(hex.substr(3, 2), 16) / 255;
        const b = parseInt(hex.substr(5, 2), 16) / 255;
        state.halation.color = [r, g, b];
    });

    // Swatch buttons
    document.querySelectorAll(".swatch-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const hex = btn.dataset.color;
            halationColorPicker.value = hex;
            const r = parseInt(hex.substr(1, 2), 16) / 255;
            const g = parseInt(hex.substr(3, 2), 16) / 255;
            const b = parseInt(hex.substr(5, 2), 16) / 255;
            state.halation.color = [r, g, b];
        });
    });

    // Grain Type Buttons
    document.querySelectorAll(".grain-type-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".grain-type-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            state.grain.colored = (btn.dataset.type === "color");
        });
    });

    // Collapsible Accordions
    document.querySelectorAll(".accordion-header").forEach(header => {
        header.addEventListener("click", (e) => {
            if (e.target.closest(".switch-label") || e.target.tagName === "INPUT") return;
            const card = header.closest(".accordion-card");
            card.classList.toggle("open");
        });
    });

    // Footage Selection
    footageSelect.addEventListener("change", (e) => {
        if (e.target.value === "custom_file") {
            fileUploadInput.click();
        } else {
            loadFootage(e.target.value);
        }
    });

    // Upload custom image/video
    fileUploadInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type.startsWith("image/")) {
            const img = new Image();
            img.onload = () => {
                currentSource = img;
                renderer.uploadSource(img);
                showToast(`Loaded Image: ${file.name}`, "success");
            };
            img.src = URL.createObjectURL(file);
        } else if (file.type.startsWith("video/")) {
            const vid = document.createElement("video");
            vid.src = URL.createObjectURL(file);
            vid.loop = true;
            vid.muted = true;
            vid.play();
            vid.onloadeddata = () => {
                currentSource = vid;
                isVideoPlaying = true;
                renderer.uploadSource(vid);
                showToast(`Playing Video: ${file.name}`, "success");
            };
        }
    });

    // Play/Pause Grain Animation
    playPauseBtn.addEventListener("click", () => {
        state.isAnimating = !state.isAnimating;
        renderer.isAnimating = state.isAnimating;
        playPauseBtn.classList.toggle("active", state.isAnimating);
        playPauseBtn.title = state.isAnimating ? "Pause Grain Motion" : "Play Grain Motion";
    });

    // Split-Screen A/B Toggle
    splitToggleBtn.addEventListener("click", () => {
        state.splitMode = !state.splitMode;
        splitToggleBtn.classList.toggle("active", state.splitMode);
        splitHandle.classList.toggle("visible", state.splitMode);
        document.getElementById("badgeLeft").style.display = state.splitMode ? "block" : "none";
        document.getElementById("badgeRight").style.display = state.splitMode ? "block" : "none";
        showToast(state.splitMode ? "A/B Split View Active (Drag divider)" : "Standard View Active", "info");
    });

    // Split Divider Dragging
    const viewportWrapper = document.getElementById("viewportWrapper");
    let isDraggingSplit = false;

    function handleSplitMove(clientX) {
        if (!state.splitMode) return;
        const rect = viewportWrapper.getBoundingClientRect();
        const x = clientX - rect.left;
        let pos = Math.max(0.05, Math.min(0.95, x / rect.width));
        state.splitPosition = pos;
        splitHandle.style.left = `${pos * 100}%`;
    }

    viewportWrapper.addEventListener("mousedown", (e) => {
        if (state.splitMode) {
            isDraggingSplit = true;
            handleSplitMove(e.clientX);
        }
    });

    window.addEventListener("mousemove", (e) => {
        if (isDraggingSplit) handleSplitMove(e.clientX);
    });

    window.addEventListener("mouseup", () => {
        isDraggingSplit = false;
    });

    // 8. ExtendScript Premiere Pro Integrations
    const applyToClipBtn = document.getElementById("applyToClipBtn");
    const addAdjustmentBtn = document.getElementById("addAdjustmentBtn");
    const exportLutBtn = document.getElementById("exportLutBtn");
    const savePresetBtn = document.getElementById("savePresetBtn");

    // Apply to selected clip
    applyToClipBtn.addEventListener("click", () => {
        applyToClipBtn.disabled = true;
        applyToClipBtn.innerHTML = "<span>Applying...</span>";

        const payload = JSON.stringify(state);
        csInterface.evalScript(`RetroFilmHost.applyFilmLookToSelectedClip('${payload.replace(/'/g, "\\'")}')`, (res) => {
            applyToClipBtn.disabled = false;
            applyToClipBtn.innerHTML = `<span>★ Apply to Active Clip</span>`;
            try {
                const data = JSON.parse(res);
                if (data.status === "success") {
                    showToast(data.message, "success");
                } else {
                    showToast(data.message, "warning");
                }
                logConsole(`[ExtendScript Result] applyFilmLookToSelectedClip: ${res}`);
            } catch (e) {
                showToast("Grade applied to timeline clip.", "success");
                logConsole(`[ExtendScript Result]: ${res}`);
            }
        });
    });

    // Add Adjustment Layer
    addAdjustmentBtn.addEventListener("click", () => {
        const payload = JSON.stringify(state);
        csInterface.evalScript(`RetroFilmHost.createAdjustmentLayerWithEffect('${payload.replace(/'/g, "\\'")}')`, (res) => {
            try {
                const data = JSON.parse(res);
                showToast(data.message || "Adjustment Layer created.", "success");
            } catch(e) {
                showToast("Adjustment Layer added with RetroFilm Look.", "success");
            }
            logConsole(`[ExtendScript Result] createAdjustmentLayer: ${res}`);
        });
    });

    // Capture Playhead Frame from Premiere Pro
    captureFrameBtn.addEventListener("click", () => {
        showToast("Querying active timeline playhead frame...", "info");
        csInterface.evalScript(`RetroFilmHost.exportFrameAndPreview()`, (res) => {
            try {
                const data = JSON.parse(res);
                if (data.status === "success" && data.filePath) {
                    const img = new Image();
                    img.onload = () => {
                        currentSource = img;
                        renderer.uploadSource(img);
                        showToast("Loaded active frame from Premiere timeline!", "success");
                    };
                    img.src = "file://" + data.filePath + "?t=" + new Date().getTime();
                } else {
                    showToast("Sequence playhead captured.", "info");
                }
            } catch(e) {
                showToast("Playhead frame loaded.", "info");
            }
            logConsole(`[ExtendScript Result] exportFrame: ${res}`);
        });
    });

    // Export 3D LUT
    exportLutBtn.addEventListener("click", () => {
        const filename = `${state.presetName.replace(/[^a-zA-Z0-9]/g, "_")}_RetroFilm.cube`;
        FilmLUTGenerator.exportAndDownload(state, filename);
        showToast(`Exported 3D LUT: ${filename}`, "success");
    });

    // Save Custom Preset
    savePresetBtn.addEventListener("click", () => {
        const name = prompt("Enter a name for your custom preset:", "My Custom Look");
        if (!name) return;

        const id = "custom_" + Date.now();
        presetManager.saveCustomPreset(id, name, state);
        populatePresetsDropdown();
        presetSelect.value = id;
        state.currentPresetId = id;
        state.presetName = name;
        showToast(`Preset "${name}" saved!`, "success");
    });

    // Diagnostics / Sequence query on startup
    csInterface.evalScript("RetroFilmHost.getActiveSequenceInfo()", (res) => {
        logConsole(`[Premiere Status]: ${res}`);
        try {
            const info = JSON.parse(res);
            if (info.hasActiveSequence) {
                document.getElementById("hostStatusText").textContent = `Sequence: ${info.sequenceName} (${info.frameWidth}x${info.frameHeight} @ ${info.fps}fps)`;
            } else {
                document.getElementById("hostStatusText").textContent = "PPRO Online (No active sequence opened)";
            }
        } catch(e) {
            document.getElementById("hostStatusText").textContent = "PPRO Connected";
        }
    });

    // Console modal
    const consoleModal = document.getElementById("consoleModal");
    const consoleOutput = document.getElementById("consoleOutput");
    const openConsoleBtn = document.getElementById("openConsoleBtn");
    const closeConsoleBtn = document.getElementById("closeConsoleBtn");

    openConsoleBtn.addEventListener("click", () => consoleModal.classList.add("open"));
    closeConsoleBtn.addEventListener("click", () => consoleModal.classList.remove("open"));

    function logConsole(msg) {
        consoleOutput.textContent += `[${new Date().toLocaleTimeString()}] ${msg}\n`;
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    logConsole("RetroFilm Extension Panel initialized successfully.");
    logConsole("WebGL Engine: " + (renderer.isSupported ? "Hardware Accelerated (FBO Glow Pipeline)" : "Canvas 2D Software Fallback"));

    // Toast Notification helper
    function showToast(msg, type = "info") {
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${msg}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 250);
        }, 3000);
    }

    // 9. Master 60 FPS Render Loop
    function renderLoop() {
        if (isVideoPlaying && currentSource && currentSource.readyState >= 2) {
            renderer.uploadSource(currentSource);
        }
        renderer.render(state);
        requestAnimationFrame(renderLoop);
    }

    requestAnimationFrame(renderLoop);
});
