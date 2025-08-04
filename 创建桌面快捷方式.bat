@echo off
title Create Desktop Shortcuts

echo ========================================
echo    Creating Desktop Shortcuts
echo ========================================
echo.

set "PROJECT_DIR=%~dp0"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"

echo Project directory: %PROJECT_DIR%
echo Desktop directory: %DESKTOP_DIR%
echo.

echo Creating desktop shortcuts...

:: Create normal startup shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut1.vbs"
echo sLinkFile = "%DESKTOP_DIR%\Clipboard Monitor.lnk" >> "%TEMP%\CreateShortcut1.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut1.vbs"
echo oLink.TargetPath = "%PROJECT_DIR%启动应用.bat" >> "%TEMP%\CreateShortcut1.vbs"
echo oLink.WorkingDirectory = "%PROJECT_DIR%" >> "%TEMP%\CreateShortcut1.vbs"
echo oLink.Description = "Clipboard Monitor - Start Application (with progress)" >> "%TEMP%\CreateShortcut1.vbs"
echo oLink.IconLocation = "%PROJECT_DIR%electron\icon.png,0" >> "%TEMP%\CreateShortcut1.vbs"
echo oLink.WindowStyle = 7 >> "%TEMP%\CreateShortcut1.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut1.vbs"

:: Create silent startup shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut2.vbs"
echo sLinkFile = "%DESKTOP_DIR%\Clipboard Monitor (Silent).lnk" >> "%TEMP%\CreateShortcut2.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.TargetPath = "%PROJECT_DIR%静默启动.bat" >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.WorkingDirectory = "%PROJECT_DIR%" >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.Description = "Clipboard Monitor - Start Application (silent)" >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.IconLocation = "%PROJECT_DIR%electron\icon.png,0" >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.WindowStyle = 7 >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut2.vbs"

:: Execute VBS scripts
cscript //nologo "%TEMP%\CreateShortcut1.vbs"
cscript //nologo "%TEMP%\CreateShortcut2.vbs"

:: Clean up
del "%TEMP%\CreateShortcut1.vbs"
del "%TEMP%\CreateShortcut2.vbs"

if exist "%DESKTOP_DIR%\Clipboard Monitor.lnk" (
    echo [OK] Desktop shortcuts created successfully!
    echo.
    echo Created shortcuts:
    echo 1. "Clipboard Monitor" - Shows startup progress
    echo 2. "Clipboard Monitor (Silent)" - Silent startup
    echo.
    echo Location: %DESKTOP_DIR%
) else (
    echo [ERROR] Failed to create shortcuts
)

echo.
echo Press any key to exit...
pause >nul 