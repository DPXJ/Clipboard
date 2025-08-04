@echo off
title Disable Auto Startup

echo ========================================
echo    Disable Auto Startup
echo ========================================
echo.

set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "STARTUP_FILE=%STARTUP_DIR%\Clipboard Monitor.lnk"

echo Startup directory: %STARTUP_DIR%
echo Startup file: %STARTUP_FILE%
echo.

if exist "%STARTUP_FILE%" (
    echo Found startup shortcut, removing...
    del "%STARTUP_FILE%"
    
    if not exist "%STARTUP_FILE%" (
        echo [OK] Auto startup disabled successfully!
        echo.
        echo The application will no longer start automatically when you log in.
        echo.
        echo To re-enable auto startup, run: 设置开机自启动.bat
    ) else (
        echo [ERROR] Failed to remove startup shortcut
        echo.
        echo Manual removal:
        echo 1. Press Win + R, type: shell:startup
        echo 2. Delete "Clipboard Monitor.lnk" from the startup folder
    )
) else (
    echo [INFO] No startup shortcut found
    echo Auto startup is already disabled.
    echo.
    echo To enable auto startup, run: 设置开机自启动.bat
)

echo.
echo Press any key to exit...
pause >nul 