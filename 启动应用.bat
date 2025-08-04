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
start /min "Vite Server" cmd /c "npm run dev"

echo.
echo Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting Electron application in background...
start /min "Electron App" cmd /c "npm run electron"

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

timeout /t 3 /nobreak >nul
exit 