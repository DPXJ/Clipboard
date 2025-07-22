@echo off
title Clipboard Monitor - Background Start

echo ========================================
echo    Clipboard Monitor - Background Start
echo ========================================
echo.

cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo Starting Vite server in background...
start /min "Vite Server" cmd /c "npm run dev"

echo.
echo Waiting for server to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting Electron application in background...
start /min "Electron App" cmd /c "npm run electron"

echo.
echo ========================================
echo Application started in background!
echo ========================================
echo.
echo The application is now running in the background.
echo You can close this window safely.
echo.
echo To stop the application:
echo 1. Open Task Manager (Ctrl+Shift+Esc)
echo 2. Find and end "node.exe" processes
echo 3. Or restart your computer
echo.

pause 