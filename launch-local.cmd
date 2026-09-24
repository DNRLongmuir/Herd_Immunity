@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or is not available on PATH.
  echo Install Node.js 18 or newer, then run this launcher again.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing the app dependencies for the first launch...
  call npm ci
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

echo Starting Herd Immunity in your browser...
echo Keep this window open while using the app. Press Ctrl+C to stop it.
call npm run dev:open

if errorlevel 1 pause
endlocal
