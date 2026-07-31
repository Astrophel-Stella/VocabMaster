@echo off
REM 一键部署脚本 - Windows版本
REM 使用方法: scripts\deploy.bat

echo 🚀 VocabMaster 一键部署脚本
echo ================================

REM 配置
set PROD_HOST=111.229.214.179
set PROD_USER=root
set PROJECT_DIR=/opt/vocabmaster

REM 检查Git Bash
where bash >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到Git Bash，请先安装Git for Windows
    exit /b 1
)

REM 运行部署脚本
bash scripts\deploy.sh

pause
