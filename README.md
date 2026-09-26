# RetroFilm — Adobe Premiere Pro Color Grading & Cinematic Effects CEP Panel

A lightweight, hardware-accelerated **Adobe Premiere Pro CEP extension panel** for real-time cinematic look grading, procedural 35mm/16mm film grain, optical halation, highlight bloom, and 3D LUT generation.

---

## ✨ Features & Effect Engine

### 1. 🎞️ Procedural Film Grain
- **Photochemical Distribution**: Grain is naturally concentrated in shadows and midtones, softly tapering in bright highlights rather than acting like flat digital noise.
- **Controls**:
  - `Amount` (0.00 – 1.00): Grain opacity and particle strength.
  - `Size` (0.5x – 3.0x): Particle scaling (fine 35mm grain vs coarse 16mm/8mm grain).
  - `Roughness` (0% – 100%): Multi-frequency noise clumping and organic density.
  - `Grain Mode`: Monochromatic silver halide crystals or 3-channel RGB dye clouds (Kodak Vision).
- **Temporal Motion**: Animates smoothly at 24fps film cadence with play/pause controls.

### 2. 🔴 Optical Halation (Film Base Reflection)
- Simulates the red/orange glow caused by bright light penetrating photographic film emulsion and scattering off the anti-halation backing layer back into the red-sensitive photochemical layers.
- **Controls**:
  - `Threshold` (0.00 – 1.00): Luminance cutoff targeting specular highlights and neon lights.
  - `Radius` (1px – 40px): Glow spread distance across high-contrast edges.
  - `Intensity` (0.00 – 1.00): Optical glow strength.
  - `Color Tint`: Swatch presets (Kodak Red-Orange, Warm Amber, Deep Ruby, Neon Magenta, Golden Flare) + custom RGB color picker.

### 3. ✨ Highlight Bloom (Pro-Mist Lens Diffusion)
- Recreates vintage optical lens diffusion filters (Black Pro-Mist, Glimmerglass) with dreamy highlight scatter and preserved blacks.
- **Controls**:
  - `Threshold` (0.00 – 1.00): Highlights trigger point.
  - `Radius` (5px – 70px): Soft gaussian diffusion radius.
  - `Intensity` (0.00 – 1.00): Diffusion glow density.

### 4. 🎨 Tone & Film Finishing
- Filmic S-curve Contrast, Saturation, Color Temperature (Warmth), Tint, and Lens Vignette.

### 5. 📦 Presets & 3D LUT Export (.cube)
- **Built-in Presets**: *Subtly Cinematic (35mm)*, *16mm Vintage Indie*, *35mm Dreamy Diffusion*, *8mm Retro Home Movie*, *Kodak Vision3 500T*, *Cyberpunk Neon Glow*, *Golden Hour 70s Cinema*, and *B&W Silver Halide Noir*.
- **Custom Preset Manager**: Save custom looks to local storage, import/export preset JSONs.
- **3D LUT Generator**: Real-time generation of standard 33×33×33 `.cube` LUT files compatible with Lumetri Color, DaVinci Resolve, and Final Cut Pro.

---

## 📁 Complete Folder Structure

```
film/
├── CSXS/
│   └── manifest.xml            # CEP Manifest targeting Premiere Pro (PPRO 14.0+)
├── .debug                      # Chrome remote debugging config (Port 8088)
├── client/
│   ├── index.html              # Modern dark-themed CEP UI panel
│   ├── css/
│   │   └── style.css           # Adobe Spectrum-inspired dark theme stylesheet
│   ├── js/
│   │   ├── lib/
│   │   │   └── CSInterface.js  # Adobe CEP communication interface (+ browser mock)
│   │   ├── engine/
│   │   │   ├── shaders.js      # Optimized GLSL vertex & fragment shaders
│   │   │   ├── webgl-renderer.js # Multi-pass WebGL FBO pipeline
│   │   │   ├── canvas-fallback-renderer.js # CPU 2D canvas fallback
│   │   │   ├── sample-generator.js # Built-in HDR cinematic test scenes
│   │   │   └── lut-generator.js # 3D LUT (.cube) exporter
│   │   ├── presets.js          # Built-in cinematic presets & custom preset storage
│   │   └── app.js              # Panel controller & event orchestration
├── host/
│   ├── index.jsx               # Premiere Pro ExtendScript host controller
│   └── json2.js                # ES3 JSON polyfill for ExtendScript
├── scripts/
│   ├── install-windows.bat     # Windows 1-click installer & registry configurator
│   └── install-macos.sh        # macOS 1-click installer & defaults configurator
├── server.js                   # Local preview server for standalone browser testing
├── test-suite.js               # Verification and integrity test suite
├── package.json
└── README.md
```

---

## 🚀 How to Install and Test in Adobe Premiere Pro

### Option A: Automatic 1-Click Installation

#### On Windows:
1. Double-click or run `scripts\install-windows.bat` in Command Prompt (Administrator recommended).
2. The script will automatically enable CEP `PlayerDebugMode` in the Windows Registry and copy the extension into `%APPDATA%\Adobe\CEP\extensions\com.cinematic.retrofilm`.

#### On macOS:
1. Open Terminal, navigate to the project directory, and run:
   ```bash
   bash scripts/install-macos.sh
   ```
2. The script will set `PlayerDebugMode 1` in macOS defaults and copy the extension into `~/Library/Application Support/Adobe/CEP/extensions/com.cinematic.retrofilm`.

---

### Option B: Manual Installation

#### Step 1: Enable Unsigned CEP Extensions (`PlayerDebugMode`)
Adobe Premiere Pro requires `PlayerDebugMode` to load development extensions without cryptographic signing.

- **Windows**:
  1. Press `Win + R`, type `regedit`, and hit Enter.
  2. Navigate to `HKEY_CURRENT_USER\Software\Adobe\`.
  3. Under each CSXS key (`CSXS.9`, `CSXS.10`, `CSXS.11`, `CSXS.12`, `CSXS.13`, `CSXS.14`), create a **String Value** named `PlayerDebugMode` and set its value to `1`.
  *(Or execute in PowerShell: `reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f`)*

- **macOS**:
  Open Terminal and run:
  ```bash
  defaults write com.adobe.CSXS.9 PlayerDebugMode 1
  defaults write com.adobe.CSXS.10 PlayerDebugMode 1
  defaults write com.adobe.CSXS.11 PlayerDebugMode 1
  defaults write com.adobe.CSXS.12 PlayerDebugMode 1
  defaults write com.adobe.CSXS.13 PlayerDebugMode 1
  defaults write com.adobe.CSXS.14 PlayerDebugMode 1
  ```

#### Step 2: Copy Extension Folder to Adobe CEP Directory
Copy this entire `film` folder to your operating system's CEP extensions folder and rename the folder to `com.cinematic.retrofilm`:

- **Windows User Path**:
  `C:\Users\<YourUsername>\AppData\Roaming\Adobe\CEP\extensions\com.cinematic.retrofilm`
  *(or system-wide: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\com.cinematic.retrofilm`)*

- **macOS User Path**:
  `~/Library/Application Support/Adobe/CEP/extensions/com.cinematic.retrofilm`
  *(or system-wide: `/Library/Application Support/Adobe/CEP/extensions/com.cinematic.retrofilm`)*

#### Step 3: Launch in Premiere Pro
1. Launch or restart **Adobe Premiere Pro** (CC 2020, 2021, 2022, 2023, 2024, or 2025+).
2. Open any video project with an active timeline sequence.
3. In the top menu bar, click:
   **`Window` ➔ `Extensions` ➔ `RetroFilm Color & Effects`**.
4. The dark-themed RetroFilm grading panel will dock seamlessly into your workspace!

---

## 🎬 How to Use the Extension

1. **Live Previewing & Grading**:
   - Use the **Footage Dropdown** to test with built-in scenes (*Neon City*, *Golden Sunset*, *Studio Rim Light*, *Calibration Chart*), or click **Upload Custom Media** to test your own clips.
   - Click **`📸 From Timeline`** to grab the active playhead frame directly from Premiere Pro.
   - Click **`🌓 Split A/B`** and drag the divider line on the preview canvas to compare before vs. after.
   - Click **`▶ Grain Motion`** to toggle animated 24fps film grain.

2. **Applying to Premiere Pro Timeline**:
   - **★ Apply to Active Clip**: Applies the color grading, tone parameters, and Lumetri effect stack to the currently highlighted clip (or the clip directly beneath the playhead).
   - **➕ New Adjustment Layer**: Automatically creates a dedicated Adjustment Layer above your sequence with the film look applied across the entire timeline.
   - **⬇ Export .CUBE LUT**: Exports your current grade as a standard 33×33×33 3D LUT for Lumetri Color.

3. **Remote Debugging**:
   - When Premiere Pro is running, open Google Chrome and navigate to `http://localhost:8088` to inspect the panel using Chrome DevTools.

---

## ⚡ Performance & Low-Spec PC Optimization

- **Downscaled Glow FBOs**: Halation and Bloom extraction passes run on a 50% downscaled Framebuffer Object (FBO) with separable 1D Gaussian blurs, drastically reducing GPU fill-rate cost.
- **Single-Pass Compositor**: Grain, tone, halation, bloom, and split-screen comparison are combined into a single fragment shader pass.
- **CPU Canvas Fallback**: Systems with unsupported or disabled WebGL automatically fallback to a lightweight Canvas 2D engine.

---

## 🧪 Testing Locally in Browser

You can also run and interact with the panel in any modern web browser:
```bash
npm start
# Opens dev preview on http://localhost:3000
```
Run the automated test suite:
```bash
npm test
# Verifies manifest XML, shader sources, ExtendScript methods, presets, and 3D LUT generation
```
