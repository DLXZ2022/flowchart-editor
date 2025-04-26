@echo off
echo 欢迎使用流程图编辑器!
echo 正在检查环境...

:: 检查Node.js是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 未检测到Node.js! 请先安装Node.js后再运行此脚本。
    echo 可以从 https://nodejs.org/zh-cn/download/ 下载安装。
    pause
    exit /b
)

:: 检查npm是否安装
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo 未检测到npm! 请确保Node.js安装正确。
    pause
    exit /b
)

echo 环境检查通过!

:: 检查node_modules目录是否存在
if not exist "node_modules\" (
    echo 首次运行，正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo 依赖安装失败，请检查网络连接后重试!
        pause
        exit /b
    )
    echo 依赖安装完成!
) else (
    echo 检测到已安装依赖。
)

echo 正在启动流程图编辑器...
start http://localhost:3000
npm run dev

pause 