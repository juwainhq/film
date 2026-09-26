@echo off
REM ==============================================================================
REM RetroFilm Adobe Premiere Pro Extension Installer for Windows
REM ==============================================================================

echo [RetroFilm] Installing Premiere Pro CEP Extension...

REM 1. Enable CEP PlayerDebugMode in Windows Registry for unsigned development extensions
echo [1/3] Enabling CEP PlayerDebugMode in Registry...
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.9" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.13" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.14" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1

REM 2. Create target CEP directory
set "TARGET_DIR=%APPDATA%\Adobe\CEP\extensions\com.cinematic.retrofilm"
echo [2/3] Preparing extension destination: %TARGET_DIR%

if not exist "%APPDATA%\Adobe\CEP\extensions" (
    mkdir "%APPDATA%\Adobe\CEP\extensions"
)

if exist "%TARGET_DIR%" (
    echo Removing previous installation...
    rmdir /S /Q "%TARGET_DIR%"
)

mkdir "%TARGET_DIR%"

REM 3. Copy files to destination
set "SOURCE_DIR=%~dp0.."
echo [3/3] Copying files from %SOURCE_DIR% to %TARGET_DIR%...

xcopy /E /I /Y "%SOURCE_DIR%\CSXS" "%TARGET_DIR%\CSXS" >nul
xcopy /E /I /Y "%SOURCE_DIR%\client" "%TARGET_DIR%\client" >nul
xcopy /E /I /Y "%SOURCE_DIR%\host" "%TARGET_DIR%\host" >nul
if exist "%SOURCE_DIR%\.debug" (
    copy /Y "%SOURCE_DIR%\.debug" "%TARGET_DIR%\.debug" >nul
)

echo.
echo ==============================================================================
echo [SUCCESS] RetroFilm Extension installed successfully!
echo.
echo Next steps in Adobe Premiere Pro:
echo 1. Start or Restart Adobe Premiere Pro.
echo 2. Open any project with a timeline sequence.
echo 3. In the top menu bar, click: Window -> Extensions -> RetroFilm Color & Effects
echo ==============================================================================
pause
