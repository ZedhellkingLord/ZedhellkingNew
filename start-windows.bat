@echo off
rem Starts the Messenger bot on Windows 10/11. Double-click this file or run it from Command Prompt.
setlocal
cd /d "%~dp0bot"

if not exist node_modules (
  echo Dependencies are missing. Run install-windows.bat first.
  pause
  exit /b 1
)

if not exist appstate.json (
  echo Warning: bot\appstate.json is missing. The bot cannot log in to Messenger without it.
)

node index.js
pause
endlocal
