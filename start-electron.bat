@echo off
chcp 65001 >nul
echo ========================================
echo 剪切板监控器 - 启动脚本
echo ========================================
echo.
echo 当前目录: %CD%
echo 当前时间: %DATE% %TIME%
echo.

echo 检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    echo.
    echo 按任意键退出...
    pause >nul
    exit /b 1
)
echo [✓] Node.js 已安装

echo.
echo 检查 npm 环境...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 npm，请检查 Node.js 安装
    echo.
    echo 按任意键退出...
    pause >nul
    exit /b 1
)
echo [✓] npm 已安装

echo.
echo 检查项目依赖...
if not exist "node_modules" (
    echo [警告] 未找到 node_modules 目录，正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        echo.
        echo 按任意键退出...
        pause >nul
        exit /b 1
    )
    echo [✓] 依赖安装完成
) else (
    echo [✓] 项目依赖已存在
)

echo.
echo 检查端口占用...
netstat -an | findstr ":5173" >nul
if %errorlevel% equ 0 (
    echo [警告] 端口 5173 可能被占用，尝试启动...
) else (
    echo [✓] 端口 5173 可用
)

echo.
echo ========================================
echo 正在启动剪切板监控器桌面应用...
echo ========================================
echo.
echo 如果启动失败，请检查：
echo 1. 防火墙是否阻止了应用
echo 2. 杀毒软件是否拦截了程序
echo 3. 是否有其他程序占用了端口
echo.
echo 启动中，请稍候...
echo.

npm run electron-dev

echo.
echo 应用已退出
echo 按任意键关闭窗口...
pause >nul 