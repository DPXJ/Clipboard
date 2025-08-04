@echo off
cd /d "%~dp0"

:: Start Vite server silently
start /min "Vite Server" cmd /c "npm run dev"

:: Wait for server to start
timeout /t 5 /nobreak >nul

:: Start Electron application silently
start /min "Electron App" cmd /c "npm run electron"

:: Exit silently
exit 