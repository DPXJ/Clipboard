@echo off
title Stop Clipboard Monitor

echo ========================================
echo    Stopping Clipboard Monitor
echo ========================================
echo.

echo Stopping all related processes...

:: Stop Electron application
taskkill /f /im electron.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Electron application stopped
) else (
    echo [INFO] No Electron process found
)

:: Stop Vite development server
taskkill /f /im node.exe /fi "WINDOWTITLE eq Vite Server" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Vite server stopped
) else (
    echo [INFO] No Vite server process found
)

:: Stop npm processes
taskkill /f /im node.exe /fi "WINDOWTITLE eq npm*" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] npm processes stopped
) else (
    echo [INFO] No npm processes found
)

echo.
echo ========================================
echo Application stopped successfully!
echo ========================================
echo.
echo All related processes have been terminated.
echo You can now start the application again if needed.
echo.

pause 