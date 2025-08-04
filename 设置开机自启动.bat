@echo off
title Set Auto Startup

echo ========================================
echo    Setting Auto Startup
echo ========================================
echo.

set "PROJECT_DIR=%~dp0"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

echo Project directory: %PROJECT_DIR%
echo Startup directory: %STARTUP_DIR%
echo.

echo Creating startup shortcut...

:: Create VBS script to create startup shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateStartupShortcut.vbs"
echo sLinkFile = "%STARTUP_DIR%\Clipboard Monitor.lnk" >> "%TEMP%\CreateStartupShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateStartupShortcut.vbs"
echo oLink.TargetPath = "%PROJECT_DIR%静默启动.bat" >> "%TEMP%\CreateStartupShortcut.vbs"
echo oLink.WorkingDirectory = "%PROJECT_DIR%" >> "%TEMP%\CreateStartupShortcut.vbs"
echo oLink.Description = "Clipboard Monitor - Auto Startup" >> "%TEMP%\CreateStartupShortcut.vbs"
echo oLink.IconLocation = "%PROJECT_DIR%electron\icon.png,0" >> "%TEMP%\CreateStartupShortcut.vbs"
echo oLink.WindowStyle = 7 >> "%TEMP%\CreateStartupShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateStartupShortcut.vbs"

:: Execute VBS script
cscript //nologo "%TEMP%\CreateStartupShortcut.vbs"
del "%TEMP%\CreateStartupShortcut.vbs"

if exist "%STARTUP_DIR%\Clipboard Monitor.lnk" (
    echo [OK] Auto startup enabled successfully!
    echo.
    echo The application will now start automatically when you log in.
    echo.
    echo To disable auto startup:
    echo 1. Press Win + R, type: shell:startup
    echo 2. Delete "Clipboard Monitor.lnk" from the startup folder
    echo.
    echo To test auto startup, restart your computer.
) else (
    echo [ERROR] Failed to create startup shortcut
    echo.
    echo Manual setup:
    echo 1. Press Win + R, type: shell:startup
    echo 2. Create a shortcut to: %PROJECT_DIR%静默启动.bat
)

echo.
echo Press any key to exit...
pause >nul 