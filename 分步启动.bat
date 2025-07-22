@echo off
title Clipboard Monitor - Step by Step

echo ========================================
echo    Clipboard Monitor - Step by Step
echo ========================================
echo.

cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo Step 1: Starting Vite development server...
echo This will start the web server first
echo.

start "Vite Server" cmd /k "npm run dev"

echo.
echo Step 2: Waiting for server to start...
echo.

timeout /t 5 /nobreak >nul

echo.
echo Step 3: Starting Electron application...
echo.

npm run electron

echo.
echo Application closed.
pause 