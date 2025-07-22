@echo off
title Stop Clipboard Monitor

echo ========================================
echo    Stopping Clipboard Monitor
echo ========================================
echo.

echo Stopping all related processes...

:: Stop Vite development server
taskkill /f /im node.exe /fi "WINDOWTITLE eq Vite Server" >nul 2>&1

:: Stop Electron application
taskkill /f /im electron.exe >nul 2>&1

:: Stop any remaining node processes related to this project
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| findstr /i "clipboard"') do (
    taskkill /f /pid %%i >nul 2>&1
)

echo.
echo ========================================
echo Application stopped!
echo ========================================
echo.
echo All related processes have been terminated.
echo You can now start the application again if needed.
echo.

pause 