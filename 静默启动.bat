@echo off
cd /d "%~dp0"

:: Start Vite server silently
start /min /b "Vite Server" cmd /c "npm run dev >nul 2>&1"

:: Wait for server to start
ping -n 6 127.0.0.1 >nul

:: Start Electron application silently
start /min /b "Electron App" cmd /c "npm run electron >nul 2>&1"

:: Exit silently by killing this window
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Clipboard Monitor*" >nul 2>&1 