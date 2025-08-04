@echo off
title Clean Files

echo ========================================
echo    Cleaning Unnecessary Files
echo ========================================
echo.

echo Deleting test and temporary files...

:: Delete test files
if exist "测试.bat" (
    del "测试.bat"
    echo [OK] Deleted: 测试.bat
)

if exist "启动.ps1" (
    del "启动.ps1"
    echo [OK] Deleted: 启动.ps1
)

if exist "简单启动.bat" (
    del "简单启动.bat"
    echo [OK] Deleted: 简单启动.bat
)

if exist "启动器.bat" (
    del "启动器.bat"
    echo [OK] Deleted: 启动器.bat
)

if exist "start-electron.bat" (
    del "start-electron.bat"
    echo [OK] Deleted: start-electron.bat
)

echo.
echo ========================================
echo Cleanup completed!
echo ========================================
echo.
echo Remaining files:
echo - 启动应用.bat (Normal startup with progress)
echo - 静默启动.bat (Silent startup)
echo - 停止应用.bat (Stop application)
echo - 创建桌面快捷方式.bat (Create desktop shortcuts)
echo - 设置开机自启动.bat (Enable auto startup)
echo - 禁用开机自启动.bat (Disable auto startup)
echo - 清理文件.bat (This file - can be deleted after use)
echo.

echo Press any key to exit...
pause >nul 