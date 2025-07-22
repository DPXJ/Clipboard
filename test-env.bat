@echo off
chcp 65001 >nul
echo ========================================
echo 环境测试脚本
echo ========================================
echo.
echo 当前目录: %CD%
echo 当前时间: %DATE% %TIME%
echo.

echo 测试 1: 检查 Node.js
node --version
if %errorlevel% neq 0 (
    echo [失败] Node.js 未安装或未添加到 PATH
) else (
    echo [成功] Node.js 已安装
)

echo.
echo 测试 2: 检查 npm
npm --version
if %errorlevel% neq 0 (
    echo [失败] npm 未安装或未添加到 PATH
) else (
    echo [成功] npm 已安装
)

echo.
echo 测试 3: 检查项目文件
if exist "package.json" (
    echo [成功] package.json 存在
) else (
    echo [失败] package.json 不存在
)

if exist "node_modules" (
    echo [成功] node_modules 目录存在
) else (
    echo [失败] node_modules 目录不存在
)

echo.
echo 测试 4: 检查端口 5173
netstat -an | findstr ":5173"
if %errorlevel% equ 0 (
    echo [警告] 端口 5173 被占用
) else (
    echo [成功] 端口 5173 可用
)

echo.
echo ========================================
echo 测试完成
echo ========================================
echo.
echo 按任意键退出...
pause >nul 