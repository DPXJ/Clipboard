@echo off
title Create Desktop Shortcut

echo ========================================
echo    Creating Desktop Shortcut
echo ========================================
echo.

set "PROJECT_DIR=%~dp0"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"

echo Project directory: %PROJECT_DIR%
echo Desktop directory: %DESKTOP_DIR%
echo.

echo Creating desktop shortcut...

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%DESKTOP_DIR%\Clipboard Monitor.lnk" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%PROJECT_DIR%后台启动.bat" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%PROJECT_DIR%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "Clipboard Monitor - Start Application" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.IconLocation = "%PROJECT_DIR%electron\icon.png,0" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WindowStyle = 7 >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"

cscript //nologo "%TEMP%\CreateShortcut.vbs"
del "%TEMP%\CreateShortcut.vbs"

if exist "%DESKTOP_DIR%\Clipboard Monitor.lnk" (
    echo [OK] Desktop shortcut created successfully!
    echo Location: %DESKTOP_DIR%\Clipboard Monitor.lnk
    echo.
    echo Now you can:
    echo 1. Double-click the desktop shortcut to start the app
    echo 2. The app will run in background
    echo 3. You can close the command window safely
) else (
    echo [ERROR] Failed to create shortcut
)

echo.
echo Press any key to exit...
pause >nul 