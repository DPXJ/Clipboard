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

:: Create VBS silent startup shortcut (recommended)
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut1.vbs"
echo sLinkFile = "%DESKTOP_DIR%\Clipboard Monitor.lnk" >> "%TEMP%\CreateShortcut1.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut1.vbs"
echo oLink.TargetPath = "wscript.exe" >> "%TEMP%\CreateShortcut1.vbs"
echo oLink.Arguments = ""%PROJECT_DIR%后台启动.vbs"" >> "%TEMP%\CreateShortcut1.vbs"
echo oLink.WorkingDirectory = "%PROJECT_DIR%" >> "%TEMP%\CreateShortcut1.vbs"
echo oLink.Description = "Clipboard Monitor - Silent Startup (Recommended)" >> "%TEMP%\CreateShortcut1.vbs"
echo oLink.IconLocation = "%PROJECT_DIR%electron\icon.png,0" >> "%TEMP%\CreateShortcut1.vbs"
echo oLink.WindowStyle = 7 >> "%TEMP%\CreateShortcut1.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut1.vbs"

:: Create BAT silent startup shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut2.vbs"
echo sLinkFile = "%DESKTOP_DIR%\Clipboard Monitor (BAT).lnk" >> "%TEMP%\CreateShortcut2.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.TargetPath = "%PROJECT_DIR%静默启动.bat" >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.WorkingDirectory = "%PROJECT_DIR%" >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.Description = "Clipboard Monitor - BAT Silent Startup" >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.IconLocation = "%PROJECT_DIR%electron\icon.png,0" >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.WindowStyle = 7 >> "%TEMP%\CreateShortcut2.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut2.vbs"

:: Create verbose startup shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut3.vbs"
echo sLinkFile = "%DESKTOP_DIR%\Clipboard Monitor (Verbose).lnk" >> "%TEMP%\CreateShortcut3.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut3.vbs"
echo oLink.TargetPath = "%PROJECT_DIR%启动应用.bat" >> "%TEMP%\CreateShortcut3.vbs"
echo oLink.WorkingDirectory = "%PROJECT_DIR%" >> "%TEMP%\CreateShortcut3.vbs"
echo oLink.Description = "Clipboard Monitor - Verbose Startup" >> "%TEMP%\CreateShortcut3.vbs"
echo oLink.IconLocation = "%PROJECT_DIR%electron\icon.png,0" >> "%TEMP%\CreateShortcut3.vbs"
echo oLink.WindowStyle = 7 >> "%TEMP%\CreateShortcut3.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut3.vbs"

:: Execute VBS scripts
cscript //nologo "%TEMP%\CreateShortcut1.vbs"
cscript //nologo "%TEMP%\CreateShortcut2.vbs"
cscript //nologo "%TEMP%\CreateShortcut3.vbs"

:: Clean up
del "%TEMP%\CreateShortcut1.vbs"
del "%TEMP%\CreateShortcut2.vbs"
del "%TEMP%\CreateShortcut3.vbs"

if exist "%DESKTOP_DIR%\Clipboard Monitor.lnk" (
    echo [OK] Desktop shortcuts created successfully!
    echo.
    echo Created shortcuts:
    echo 1. "Clipboard Monitor" - VBS Silent Startup (Recommended)
    echo 2. "Clipboard Monitor (BAT)" - BAT Silent Startup
    echo 3. "Clipboard Monitor (Verbose)" - Verbose Startup with Progress
    echo.
    echo Location: %DESKTOP_DIR%
) else (
    echo [ERROR] Failed to create shortcuts
)

echo.
echo Press any key to exit...
pause >nul 