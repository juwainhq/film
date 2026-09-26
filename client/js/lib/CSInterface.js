/**
 * CSInterface - v9.4.0 (with Universal Browser Fallback Mock)
 * Communication library between HTML5 CEP Panel and Adobe Premiere Pro ExtendScript.
 */

var CSInterface = function () {
    this.isCEP = (typeof window.__adobe_cep__ !== "undefined");
};

CSInterface.prototype.isAvailable = function () {
    return this.isCEP;
};

/**
 * Evaluates an ExtendScript expression in Adobe Premiere Pro.
 * @param {string} script - The ExtendScript snippet or function call.
 * @param {function} [callback] - Function called with the result string.
 */
CSInterface.prototype.evalScript = function (script, callback) {
    if (this.isCEP) {
        window.__adobe_cep__.evalScript(script, callback || function () {});
    } else {
        console.log("[CSInterface Browser Mock] evalScript:", script);
        // Provide mock responses for known ExtendScript calls when running in browser preview
        setTimeout(function () {
            var result = "{\"status\":\"ok\"}";
            if (script.indexOf("getActiveSequenceInfo") !== -1) {
                result = JSON.stringify({
                    status: "success",
                    hasActiveSequence: true,
                    sequenceName: "Cinematic Reel_01 [Preview]",
                    timecode: "00:01:24:18",
                    fps: 23.976,
                    frameWidth: 3840,
                    frameHeight: 2160,
                    selectedClipCount: 1,
                    selectedClipName: "A004_C012_0926_RAW.mov"
                });
            } else if (script.indexOf("applyFilmLookToSelectedClip") !== -1) {
                result = JSON.stringify({
                    status: "success",
                    message: "RetroFilm effect stack applied to active clip.",
                    appliedEffects: ["Lumetri Color (Halation/Tone LUT)", "ProcAmp", "Gaussian Bloom", "Procedural Film Grain"],
                    timestamp: new Date().toLocaleTimeString()
                });
            } else if (script.indexOf("createAdjustmentLayerWithEffect") !== -1) {
                result = JSON.stringify({
                    status: "success",
                    message: "Created 'RetroFilm Master Grade' Adjustment Layer on Track V2.",
                    track: "V2",
                    timestamp: new Date().toLocaleTimeString()
                });
            } else if (script.indexOf("exportFrameAndPreview") !== -1) {
                result = JSON.stringify({
                    status: "success",
                    message: "Current playhead frame exported for live grading preview."
                });
            } else if (script.indexOf("checkPremiereVersion") !== -1) {
                result = JSON.stringify({
                    status: "success",
                    appName: "Adobe Premiere Pro",
                    appVersion: "24.2.0 (Simulated)",
                    cepVersion: "11.0"
                });
            }
            if (callback) callback(result);
        }, 80);
    }
};

/**
 * Gets the host environment information.
 */
CSInterface.prototype.getHostEnvironment = function () {
    if (this.isCEP) {
        return JSON.parse(window.__adobe_cep__.getHostEnvironment());
    }
    return {
        appName: "PPRO",
        appVersion: "24.2.0",
        appLocale: "en_US",
        appUILocale: "en_US",
        appId: "PPRO",
        isAppOnline: true,
        appSkinInfo: {
            baseFontFamily: "Adobe Clean, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
            baseFontSize: 12,
            appBarBackgroundColor: { color: { red: 30, green: 30, blue: 30, alpha: 255 } },
            panelBackgroundColor: { color: { red: 34, green: 34, blue: 34, alpha: 255 } }
        }
    };
};

/**
 * Adds an event listener for CEP events.
 */
CSInterface.prototype.addEventListener = function (type, listener, obj) {
    if (this.isCEP) {
        window.__adobe_cep__.addEventListener(type, listener, obj);
    } else {
        window.addEventListener(type, listener);
    }
};

/**
 * Removes an event listener.
 */
CSInterface.prototype.removeEventListener = function (type, listener, obj) {
    if (this.isCEP) {
        window.__adobe_cep__.removeEventListener(type, listener, obj);
    } else {
        window.removeEventListener(type, listener);
    }
};

/**
 * Dispatches a CEP event.
 */
CSInterface.prototype.dispatchEvent = function (event) {
    if (this.isCEP) {
        window.__adobe_cep__.dispatchEvent(event);
    } else {
        var customEvent = new CustomEvent(event.type, { detail: event.data });
        window.dispatchEvent(customEvent);
    }
};

/**
 * Opens a URL in the user's default browser.
 */
CSInterface.prototype.openURLInDefaultBrowser = function (url) {
    if (this.isCEP) {
        window.__adobe_cep__.openURLInDefaultBrowser(url);
    } else {
        window.open(url, "_blank");
    }
};

/**
 * Gets the path to a standard directory.
 */
CSInterface.prototype.getSystemPath = function (pathType) {
    if (this.isCEP) {
        return window.__adobe_cep__.getSystemPath(pathType);
    }
    return "/home/user/film";
};

/**
 * Closes the extension.
 */
CSInterface.prototype.closeExtension = function () {
    if (this.isCEP) {
        window.__adobe_cep__.closeExtension();
    } else {
        console.log("[CSInterface Browser Mock] closeExtension called");
    }
};

// SystemPath constants
CSInterface.SystemPath = {
    USER_DATA: "userData",
    COMMON_FILES: "commonFiles",
    MY_DOCUMENTS: "myDocuments",
    APPLICATION: "application",
    EXTENSION: "extension",
    HOST_APPLICATION: "hostApplication"
};
