@echo off
REM 环境检查脚本

echo ========================================
echo   VocabMaster 环境检查
echo ========================================
echo.

set ERROR=0

REM 检查 Python
echo [检查] Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [✗] Python 未安装
    set ERROR=1
) else (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo [✓] Python %%i 已安装
)

REM 检查 Node.js
echo [检查] Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [✗] Node.js 未安装
    set ERROR=1
) else (
    for /f %%i in ('node --version') do echo [✓] Node.js %%i 已安装
)

REM 检查 npm
echo [检查] npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [✗] npm 未安装
    set ERROR=1
) else (
    for /f %%i in ('npm --version') do echo [✓] npm %%i 已安装
)

REM 检查 Rust（可选，仅桌面版需要）
echo.
echo [检查] Rust（可选，仅桌面版需要）...
rustc --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Rust 未安装 - 仅影响桌面版打包
    echo     安装: https://www.rust-lang.org/tools/install
) else (
    for /f "tokens=2" %%i in ('rustc --version 2^>^&1') do echo [✓] Rust %%i 已安装
)

REM 检查后端依赖
echo.
echo [检查] 后端依赖...
cd backend
if exist "venv" (
    echo [✓] Python 虚拟环境已创建
) else (
    echo [!] Python 虚拟环境未创建 - 运行 scripts\dev.bat 会自动创建
)
cd ..

REM 检查前端依赖
echo [检查] 前端依赖...
cd frontend
if exist "node_modules" (
    echo [✓] 前端依赖已安装
) else (
    echo [!] 前端依赖未安装 - 运行 scripts\dev.bat 会自动安装
)
cd ..

echo.
echo ========================================
if %ERROR%==1 (
    echo [结果] 环境检查失败，请安装缺失的依赖
) else (
    echo [结果] 环境检查通过！可以运行 scripts\dev.bat 启动
)
echo ========================================
pause
