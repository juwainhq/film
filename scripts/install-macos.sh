#!/usr/bin/env bash
# ==============================================================================
# RetroFilm Adobe Premiere Pro Extension Installer for macOS
# ==============================================================================

set -e

echo "[RetroFilm] Installing Premiere Pro CEP Extension on macOS..."

# 1. Enable CEP PlayerDebugMode for all modern CSXS versions
echo "[1/3] Enabling CEP PlayerDebugMode in macOS defaults..."
for v in 9 10 11 12 13 14 15 16; do
    defaults write "com.adobe.CSXS.${v}" PlayerDebugMode 1 2>/dev/null || true
done

# 2. Target CEP directory
TARGET_DIR="${HOME}/Library/Application Support/Adobe/CEP/extensions/com.cinematic.retrofilm"
echo "[2/3] Preparing extension destination: ${TARGET_DIR}"

mkdir -p "${HOME}/Library/Application Support/Adobe/CEP/extensions"

if [ -d "${TARGET_DIR}" ]; then
    echo "Removing previous installation..."
    rm -rf "${TARGET_DIR}"
fi

mkdir -p "${TARGET_DIR}"

# 3. Copy files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "[3/3] Copying extension files..."
cp -R "${SOURCE_DIR}/CSXS" "${TARGET_DIR}/"
cp -R "${SOURCE_DIR}/client" "${TARGET_DIR}/"
cp -R "${SOURCE_DIR}/host" "${TARGET_DIR}/"
if [ -f "${SOURCE_DIR}/.debug" ]; then
    cp "${SOURCE_DIR}/.debug" "${TARGET_DIR}/"
fi

echo ""
echo "=============================================================================="
echo "[SUCCESS] RetroFilm Extension installed successfully!"
echo ""
echo "Next steps in Adobe Premiere Pro:"
echo "1. Start or Restart Adobe Premiere Pro."
echo "2. Open any project with a timeline sequence."
echo "3. In the top menu bar, click: Window -> Extensions -> RetroFilm Color & Effects"
echo "=============================================================================="
