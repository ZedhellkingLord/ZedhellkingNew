@echo off
rem Installs everything the bot needs on Windows 10/11. Double-click this file or run it from Command Prompt.
setlocal
cd /d "%~dp0"

echo [1/5] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
  where winget >nul 2>&1
  if errorlevel 1 (
    echo Node.js is not installed and winget is not available.
    echo Install Node.js LTS from https://nodejs.org then run this file again.
    pause
    exit /b 1
  )
  echo Installing Node.js LTS with winget...
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
  echo Node.js was installed. Close this window, open a new one, and run install-windows.bat again.
  pause
  exit /b 0
)

for /f %%v in ('node -p "process.versions.major"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 18 (
  echo Node.js 18 or newer is required. Install a newer version from https://nodejs.org then run this file again.
  pause
  exit /b 1
)

echo [2/5] Checking FFmpeg...
where ffmpeg >nul 2>&1
if errorlevel 1 (
  echo Installing FFmpeg with winget...
  winget install -e --id Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
)

echo [3/5] Checking yt-dlp...
where yt-dlp >nul 2>&1
if errorlevel 1 (
  echo Installing yt-dlp with winget...
  winget install -e --id yt-dlp.yt-dlp --accept-source-agreements --accept-package-agreements
)

echo [4/5] Checking Deno (used by the YouTube command)...
where deno >nul 2>&1
if errorlevel 1 (
  echo Installing Deno with winget...
  winget install -e --id DenoLand.Deno --accept-source-agreements --accept-package-agreements
)

echo [5/5] Installing bot dependencies...
cd /d "%~dp0bot"
call npm install --no-fund --no-audit
if errorlevel 1 (
  echo Dependency installation failed. See the messages above.
  pause
  exit /b 1
)
if not exist .env copy .env.example .env >nul
if not exist data mkdir data

echo.
echo Installation finished.
echo If FFmpeg, yt-dlp or Deno show as missing when you start the bot, close this window and open a new one first.
echo Next: put your Facebook session in bot\appstate.json, then run start-windows.bat
pause
endlocal
