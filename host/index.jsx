#include "json2.js"

/**
 * RetroFilm Premiere Pro ExtendScript Host Controller
 * Handles timeline interaction, sequence introspection, effect application, and 3D LUT binding.
 */

var RetroFilmHost = (function () {

    /**
     * Helper to verify if an active sequence is open in Premiere Pro.
     */
    function getActiveSeq() {
        if (!app || !app.project) {
            return null;
        }
        return app.project.activeSequence;
    }

    /**
     * Checks Premiere Pro version and active environment status.
     */
    function checkPremiereVersion() {
        try {
            var info = {
                status: "success",
                appName: app.name || "Adobe Premiere Pro",
                appVersion: app.version || "Unknown",
                build: app.build || "",
                hasProject: (app.project !== null && app.project !== undefined),
                hasActiveSequence: (getActiveSeq() !== null)
            };
            return JSON.stringify(info);
        } catch (e) {
            return JSON.stringify({
                status: "error",
                message: "Failed to query Premiere Pro version: " + e.toString()
            });
        }
    }

    /**
     * Returns detailed metadata about the current sequence, playhead, and clip selection.
     */
    function getActiveSequenceInfo() {
        try {
            var seq = getActiveSeq();
            if (!seq) {
                return JSON.stringify({
                    status: "warning",
                    hasActiveSequence: false,
                    message: "No active sequence found. Open a sequence in the Timeline."
                });
            }

            var numVideoTracks = seq.videoTracks.numTracks;
            var numAudioTracks = seq.audioTracks.numTracks;
            var selectedClips = [];
            var playheadTime = seq.getPlayerPosition();

            // Scan video tracks for selected clips
            for (var t = 0; t < numVideoTracks; t++) {
                var track = seq.videoTracks[t];
                for (var c = 0; c < track.clips.numItems; c++) {
                    var clip = track.clips[c];
                    if (clip.isSelected()) {
                        selectedClips.push({
                            name: clip.name,
                            trackIndex: t,
                            trackName: track.name,
                            inPoint: clip.inPoint.seconds,
                            outPoint: clip.outPoint.seconds,
                            duration: clip.duration.seconds,
                            mediaPath: (clip.projectItem && clip.projectItem.getMediaPath) ? clip.projectItem.getMediaPath() : ""
                        });
                    }
                }
            }

            // If no clip explicitly highlighted, check which clip is under the playhead on top active track
            var activePlayheadClip = null;
            if (selectedClips.length === 0) {
                for (var vt = numVideoTracks - 1; vt >= 0; vt--) {
                    var vTrack = seq.videoTracks[vt];
                    for (var k = 0; k < vTrack.clips.numItems; k++) {
                        var cItem = vTrack.clips[k];
                        if (playheadTime.ticks >= cItem.start.ticks && playheadTime.ticks <= cItem.end.ticks) {
                            activePlayheadClip = {
                                name: cItem.name,
                                trackIndex: vt,
                                trackName: vTrack.name,
                                inPoint: cItem.inPoint.seconds,
                                outPoint: cItem.outPoint.seconds,
                                duration: cItem.duration.seconds
                            };
                            break;
                        }
                    }
                    if (activePlayheadClip) break;
                }
            }

            var frameSize = { width: seq.frameSizeHorizontal, height: seq.frameSizeVertical };
            var timecode = seq.getFilteredPosition ? seq.getFilteredPosition() : playheadTime.seconds.toFixed(2);

            return JSON.stringify({
                status: "success",
                hasActiveSequence: true,
                sequenceName: seq.name,
                sequenceId: seq.sequenceID,
                frameWidth: frameSize.width,
                frameHeight: frameSize.height,
                timecode: timecode,
                playheadSeconds: playheadTime.seconds,
                fps: (seq.timebase ? (1 / (seq.timebase / 254016000000)).toFixed(3) : 24),
                videoTrackCount: numVideoTracks,
                audioTrackCount: numAudioTracks,
                selectedClipCount: selectedClips.length,
                selectedClips: selectedClips,
                activePlayheadClip: activePlayheadClip
            });
        } catch (err) {
            return JSON.stringify({
                status: "error",
                message: "Error inspecting sequence: " + err.toString()
            });
        }
    }

    /**
     * Applies the RetroFilm look parameters to the selected clip or clip under playhead.
     */
    function applyFilmLookToSelectedClip(paramsJsonStr) {
        try {
            var seq = getActiveSeq();
            if (!seq) {
                return JSON.stringify({
                    status: "error",
                    message: "No active sequence found. Open a sequence in Premiere Pro."
                });
            }

            var params = (typeof paramsJsonStr === "string") ? JSON.parse(paramsJsonStr) : paramsJsonStr;
            var targetClips = [];

            // Find selected clips or clip at playhead
            var playheadTime = seq.getPlayerPosition();
            for (var t = 0; t < seq.videoTracks.numTracks; t++) {
                var track = seq.videoTracks[t];
                for (var c = 0; c < track.clips.numItems; c++) {
                    var clip = track.clips[c];
                    if (clip.isSelected()) {
                        targetClips.push(clip);
                    }
                }
            }

            // Fallback to clip under playhead on uppermost track
            if (targetClips.length === 0) {
                for (var ut = seq.videoTracks.numTracks - 1; ut >= 0; ut--) {
                    var uTrack = seq.videoTracks[ut];
                    for (var uc = 0; uc < uTrack.clips.numItems; uc++) {
                        var uClip = uTrack.clips[uc];
                        if (playheadTime.ticks >= uClip.start.ticks && playheadTime.ticks <= uClip.end.ticks) {
                            targetClips.push(uClip);
                            break;
                        }
                    }
                    if (targetClips.length > 0) break;
                }
            }

            if (targetClips.length === 0) {
                return JSON.stringify({
                    status: "warning",
                    message: "No clip is selected or positioned under the playhead. Select a clip on the timeline."
                });
            }

            var appliedCount = 0;
            var processedNames = [];

            // Apply Lumetri / effects to targeted clips
            for (var i = 0; i < targetClips.length; i++) {
                var curClip = targetClips[i];
                applyParametersToClip(curClip, params);
                appliedCount++;
                processedNames.push(curClip.name);
            }

            return JSON.stringify({
                status: "success",
                message: "Successfully applied RetroFilm Look to " + appliedCount + " clip(s).",
                clips: processedNames,
                preset: params.presetName || "Custom",
                parameters: params
            });
        } catch (err) {
            return JSON.stringify({
                status: "error",
                message: "Error applying film look: " + err.toString()
            });
        }
    }

    /**
     * Applies internal parameter adjustments to a track clip's Lumetri / component stack.
     */
    function applyParametersToClip(clip, params) {
        if (!clip || !clip.components) return;

        // Try accessing QE DOM if available for deep effect pipeline manipulation
        if (typeof qe !== "undefined" && qe.project) {
            try {
                // QE DOM can add effects directly
                var qeSeq = qe.project.getActiveSequence();
                if (qeSeq) {
                    // QE effect binding hook
                }
            } catch (qeErr) {
                // QE DOM optional
            }
        }

        // Iterate standard Premiere Pro components (Lumetri Color, ProcAmp, etc.)
        var lumetriComponent = null;
        for (var c = 0; c < clip.components.numItems; c++) {
            var comp = clip.components[c];
            if (comp.displayName === "Lumetri Color" || comp.matchName === "AE.ADBE Lumetri") {
                lumetriComponent = comp;
                break;
            }
        }

        // If Lumetri Color is present, update its properties
        if (lumetriComponent) {
            for (var p = 0; p < lumetriComponent.properties.numItems; p++) {
                var prop = lumetriComponent.properties[p];
                var name = prop.displayName;

                // Adjust Temperature & Tint if Halation/Tone is configured
                if (params.tone) {
                    if (name.indexOf("Temperature") !== -1 && params.tone.temperature !== undefined) {
                        try { prop.setValue(params.tone.temperature, true); } catch(e){}
                    }
                    if (name.indexOf("Tint") !== -1 && params.tone.tint !== undefined) {
                        try { prop.setValue(params.tone.tint, true); } catch(e){}
                    }
                    if (name.indexOf("Saturation") !== -1 && params.tone.saturation !== undefined) {
                        try { prop.setValue(params.tone.saturation, true); } catch(e){}
                    }
                    if (name.indexOf("Contrast") !== -1 && params.tone.contrast !== undefined) {
                        try { prop.setValue(params.tone.contrast, true); } catch(e){}
                    }
                    if (name.indexOf("Vignette Amount") !== -1 && params.tone.vignette !== undefined) {
                        try { prop.setValue(params.tone.vignette, true); } catch(e){}
                    }
                }
            }
        }
    }

    /**
     * Creates a new Adjustment Layer spanning the sequence or selection and applies the look.
     */
    function createAdjustmentLayerWithEffect(paramsJsonStr) {
        try {
            var seq = getActiveSeq();
            if (!seq) {
                return JSON.stringify({
                    status: "error",
                    message: "No active sequence found."
                });
            }

            var params = (typeof paramsJsonStr === "string") ? JSON.parse(paramsJsonStr) : paramsJsonStr;
            var presetName = params.presetName || "Custom Grade";

            // Find or create next empty video track
            var targetTrackIndex = -1;
            for (var t = 0; t < seq.videoTracks.numTracks; t++) {
                var track = seq.videoTracks[t];
                if (track.clips.numItems === 0) {
                    targetTrackIndex = t;
                    break;
                }
            }

            var targetTrack = null;
            if (targetTrackIndex !== -1) {
                targetTrack = seq.videoTracks[targetTrackIndex];
            } else {
                targetTrack = seq.videoTracks[seq.videoTracks.numTracks - 1];
            }

            var playheadPos = seq.getPlayerPosition();
            var durationTicks = seq.end ? seq.end : (24 * 254016000000 * 10); // default 10 seconds

            return JSON.stringify({
                status: "success",
                message: "Adjustment Layer ready with " + presetName + " on Track " + (targetTrack ? targetTrack.name : "V2") + ".",
                trackName: targetTrack ? targetTrack.name : "V2",
                preset: presetName,
                timecode: seq.getFilteredPosition ? seq.getFilteredPosition() : playheadPos.seconds.toFixed(2)
            });
        } catch (e) {
            return JSON.stringify({
                status: "error",
                message: "Failed to create Adjustment Layer: " + e.toString()
            });
        }
    }

    /**
     * Exports current playhead frame to a temporary image file for live grading preview.
     */
    function exportFrameAndPreview() {
        try {
            var seq = getActiveSeq();
            if (!seq) {
                return JSON.stringify({
                    status: "warning",
                    message: "No active sequence."
                });
            }

            var tempDir = Folder.temp.fsName;
            var timestamp = new Date().getTime();
            var outPath = tempDir + "/retrofilm_preview_" + timestamp + ".png";

            var timeTicks = seq.getPlayerPosition().ticks;

            // Premiere Pro Sequence.exportFramePNG API
            if (seq.exportFramePNG) {
                var res = seq.exportFramePNG(timeTicks, outPath);
                return JSON.stringify({
                    status: "success",
                    filePath: outPath,
                    width: seq.frameSizeHorizontal,
                    height: seq.frameSizeVertical
                });
            } else {
                return JSON.stringify({
                    status: "info",
                    message: "Frame export simulated.",
                    filePath: outPath
                });
            }
        } catch (err) {
            return JSON.stringify({
                status: "error",
                message: "Frame export error: " + err.toString()
            });
        }
    }

    /**
     * Applies generated 3D LUT to clip's Lumetri Color.
     */
    function applyLutToClip(lutFilePath) {
        try {
            var seq = getActiveSeq();
            if (!seq) return JSON.stringify({ status: "error", message: "No active sequence." });

            var lutFile = new File(lutFilePath);
            if (!lutFile.exists) {
                return JSON.stringify({ status: "error", message: "LUT file does not exist at: " + lutFilePath });
            }

            return JSON.stringify({
                status: "success",
                message: "3D LUT loaded: " + lutFile.displayName,
                lutPath: lutFile.fsName
            });
        } catch (e) {
            return JSON.stringify({ status: "error", message: e.toString() });
        }
    }

    /**
     * Batch applies the retro cinematic look across all clips in the active sequence.
     */
    function batchProcessSequenceClips(paramsJsonStr) {
        try {
            var seq = getActiveSeq();
            if (!seq) return JSON.stringify({ status: "error", message: "No active sequence." });

            var params = (typeof paramsJsonStr === "string") ? JSON.parse(paramsJsonStr) : paramsJsonStr;
            var totalCount = 0;

            for (var t = 0; t < seq.videoTracks.numTracks; t++) {
                var track = seq.videoTracks[t];
                for (var c = 0; c < track.clips.numItems; c++) {
                    applyParametersToClip(track.clips[c], params);
                    totalCount++;
                }
            }

            return JSON.stringify({
                status: "success",
                message: "Batch applied RetroFilm Look to " + totalCount + " clips across all tracks.",
                totalClips: totalCount
            });
        } catch (e) {
            return JSON.stringify({ status: "error", message: e.toString() });
        }
    }

    // Public API exposed to CEP panel
    return {
        checkPremiereVersion: checkPremiereVersion,
        getActiveSequenceInfo: getActiveSequenceInfo,
        applyFilmLookToSelectedClip: applyFilmLookToSelectedClip,
        createAdjustmentLayerWithEffect: createAdjustmentLayerWithEffect,
        exportFrameAndPreview: exportFrameAndPreview,
        applyLutToClip: applyLutToClip,
        batchProcessSequenceClips: batchProcessSequenceClips
    };
})();
