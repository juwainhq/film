/**
 * RetroFilm Verification & Integrity Test Suite
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("==================================================");
console.log("  Running RetroFilm Plugin Verification Suite     ");
console.log("==================================================");

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
    try {
        fn();
        console.log(`  ✓ [PASS] ${name}`);
        testsPassed++;
    } catch (err) {
        console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
        testsFailed++;
    }
}

// 1. File Structure Verification
runTest("CEP Directory & Required Files Verification", () => {
    const requiredFiles = [
        "CSXS/manifest.xml",
        ".debug",
        "client/index.html",
        "client/css/style.css",
        "client/js/lib/CSInterface.js",
        "client/js/engine/shaders.js",
        "client/js/engine/webgl-renderer.js",
        "client/js/engine/canvas-fallback-renderer.js",
        "client/js/engine/sample-generator.js",
        "client/js/engine/lut-generator.js",
        "client/js/presets.js",
        "client/js/app.js",
        "host/index.jsx",
        "host/json2.js",
        "scripts/install-windows.bat",
        "scripts/install-macos.sh"
    ];

    requiredFiles.forEach(relPath => {
        const fullPath = path.join(__dirname, relPath);
        assert(fs.existsSync(fullPath), `Missing required file: ${relPath}`);
        const stat = fs.statSync(fullPath);
        assert(stat.size > 0, `File is empty: ${relPath}`);
    });
});

// 2. CSXS Manifest XML Inspection
runTest("CSXS Manifest XML Validation", () => {
    const manifestPath = path.join(__dirname, "CSXS/manifest.xml");
    const manifestContent = fs.readFileSync(manifestPath, "utf8");

    assert(manifestContent.includes('ExtensionBundleId="com.cinematic.retrofilm"'), "Bundle ID missing");
    assert(manifestContent.includes('Extension Id="com.cinematic.retrofilm.panel"'), "Extension ID missing");
    assert(manifestContent.includes('<Host Name="PPRO"'), "Premiere Pro host tag missing");
    assert(manifestContent.includes('<MainPath>./client/index.html</MainPath>'), "MainPath incorrect");
    assert(manifestContent.includes('<ScriptPath>./host/index.jsx</ScriptPath>'), "ScriptPath incorrect");
    assert(manifestContent.includes('<Menu>RetroFilm Color &amp; Effects</Menu>'), "Menu title incorrect");
});

// 3. ExtendScript Host Interface Check
runTest("ExtendScript Host API Methods Check", () => {
    const jsxPath = path.join(__dirname, "host/index.jsx");
    const jsxContent = fs.readFileSync(jsxPath, "utf8");

    const requiredMethods = [
        "checkPremiereVersion",
        "getActiveSequenceInfo",
        "applyFilmLookToSelectedClip",
        "createAdjustmentLayerWithEffect",
        "exportFrameAndPreview",
        "applyLutToClip",
        "batchProcessSequenceClips"
    ];

    requiredMethods.forEach(method => {
        assert(jsxContent.includes(method), `ExtendScript missing method: ${method}`);
    });
});

// 4. Shaders & GLSL Integrity Check
runTest("GLSL Shader Source Integrity Check", () => {
    const shadersPath = path.join(__dirname, "client/js/engine/shaders.js");
    const shadersContent = fs.readFileSync(shadersPath, "utf8");

    const vm = require("vm");
    const sandbox = {};
    vm.createContext(sandbox);
    const result = vm.runInContext(shadersContent + "; Shaders;", sandbox);

    assert(result, "Shaders object not found");
    assert(result.vertexShader.includes("a_position"), "Vertex shader missing a_position");
    assert(result.extractionFragmentShader.includes("u_halationThreshold"), "Extraction shader missing u_halationThreshold");
    assert(result.extractionFragmentShader.includes("u_bloomThreshold"), "Extraction shader missing u_bloomThreshold");
    assert(result.compositeFragmentShader.includes("generateGrain"), "Composite shader missing generateGrain function");
    assert(result.compositeFragmentShader.includes("u_grainAmount"), "Composite shader missing u_grainAmount");
    assert(result.compositeFragmentShader.includes("u_halationIntensity"), "Composite shader missing u_halationIntensity");
    assert(result.compositeFragmentShader.includes("u_bloomIntensity"), "Composite shader missing u_bloomIntensity");
});

// 5. Presets Library Check
runTest("Presets Definitions & Completeness Check", () => {
    const presetsPath = path.join(__dirname, "client/js/presets.js");
    const presetsContent = fs.readFileSync(presetsPath, "utf8");

    const vm = require("vm");
    const sandbox = { localStorage: { getItem: () => null, setItem: () => {} } };
    vm.createContext(sandbox);
    const presetsObj = vm.runInContext(presetsContent + "; DefaultPresets;", sandbox);

    assert(presetsObj, "DefaultPresets object not found");
    const requiredPresets = ["subtly-cinematic", "16mm-vintage", "35mm-dreamy", "8mm-retro-grunge", "kodak-vision3", "cyberpunk-neon", "golden-hour-70s", "bw-noir-35mm"];

    requiredPresets.forEach(presetKey => {
        const p = presetsObj[presetKey];
        assert(p, `Preset ${presetKey} missing`);
        assert(p.grain && typeof p.grain.amount === "number", `Grain amount missing in ${presetKey}`);
        assert(p.grain && typeof p.grain.size === "number", `Grain size missing in ${presetKey}`);
        assert(p.grain && typeof p.grain.roughness === "number", `Grain roughness missing in ${presetKey}`);
        assert(p.halation && typeof p.halation.threshold === "number", `Halation threshold missing in ${presetKey}`);
        assert(p.halation && typeof p.halation.radius === "number", `Halation radius missing in ${presetKey}`);
        assert(p.halation && typeof p.halation.intensity === "number", `Halation intensity missing in ${presetKey}`);
        assert(Array.isArray(p.halation.color), `Halation color missing in ${presetKey}`);
        assert(p.bloom && typeof p.bloom.threshold === "number", `Bloom threshold missing in ${presetKey}`);
        assert(p.bloom && typeof p.bloom.radius === "number", `Bloom radius missing in ${presetKey}`);
        assert(p.bloom && typeof p.bloom.intensity === "number", `Bloom intensity missing in ${presetKey}`);
    });
});

// 6. 3D LUT Generator Check
runTest("3D LUT (.cube) Generator Functional Test", () => {
    const lutPath = path.join(__dirname, "client/js/engine/lut-generator.js");
    const lutContent = fs.readFileSync(lutPath, "utf8");

    const vm = require("vm");
    const sandbox = { Blob: class {}, URL: { createObjectURL: () => "", revokeObjectURL: () => {} }, document: { createElement: () => ({ click: () => {} }), body: { appendChild: () => {}, removeChild: () => {} } } };
    vm.createContext(sandbox);
    const LutClass = vm.runInContext(lutContent + "; FilmLUTGenerator;", sandbox);

    assert(LutClass, "FilmLUTGenerator class not defined");

    const testState = {
        presetName: "Test 35mm",
        halation: { enabled: true, threshold: 0.7, intensity: 0.5, color: [1.0, 0.3, 0.05] },
        tone: { contrast: 1.1, saturation: 1.05, temperature: 0.1, tint: 0.0 }
    };

    const cubeLUT = LutClass.generateCubeLUT(testState, 17);
    assert(cubeLUT.includes("LUT_3D_SIZE 17"), "LUT header missing size");
    const lines = cubeLUT.trim().split("\n");
    // 17^3 = 4913 data points + 3 header lines
    assert(lines.length >= 4913, `LUT line count unexpected: ${lines.length}`);
});

console.log("--------------------------------------------------");
console.log(`Results: ${testsPassed} passed, ${testsFailed} failed.`);
console.log("==================================================");

if (testsFailed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
