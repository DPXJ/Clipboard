@echo off
title Clipboard Monitor Launcher

echo ========================================
echo    Clipboard Monitor - Starting...
echo ========================================
echo.

cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo Starting Vite server in background...
start /min /b "Vite Server" cmd /c "npm run dev >nul 2>&1"

echo.
echo Waiting for server to start...
ping -n 6 127.0.0.1 >nul

echo.
echo Starting Electron application in background...
start /min /b "Electron App" cmd /c "npm run electron >nul 2>&1"

echo.
echo ========================================
echo Application started in background!
echo ========================================
echo.
echo The application is now running in the background.
echo This window will close automatically in 3 seconds...
echo.
echo To stop the application, run: 停止应用.bat
echo.

ping -n 4 127.0.0.1 >nul
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Clipboard Monitor Launcher*" >nul 2>&1 