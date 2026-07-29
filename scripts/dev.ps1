#!/usr/bin/env pwsh
# VocabMaster 开发环境启动脚本 (PowerShell)
# 同时启动后端和前端

# 设置控制台编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# 保存脚本所在目录作为项目根目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VocabMaster 开发环境启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[错误] 未找到 Python，请先安装 Python 3.10+" -ForegroundColor Red
    Write-Host "       下载地址: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# 检查 Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[错误] 未找到 Node.js，请先安装 Node.js 18+" -ForegroundColor Red
    Write-Host "       下载地址: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/4] 检查后端虚拟环境..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\backend"
if (-not (Test-Path "venv")) {
    Write-Host "[创建] 虚拟环境不存在，正在创建..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 虚拟环境创建失败" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[2/4] 激活虚拟环境并安装依赖..." -ForegroundColor Yellow
& "$ProjectRoot\backend\venv\Scripts\Activate.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] 虚拟环境激活失败" -ForegroundColor Red
    exit 1
}
pip install -r requirements.txt --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "[警告] 依赖安装可能存在问题，继续尝试启动..." -ForegroundColor Yellow
}

Write-Host "[3/4] 初始化数据库（如果需要）..." -ForegroundColor Yellow
if (-not (Test-Path "vocabmaster.db")) {
    Write-Host "[初始化] 创建数据库..." -ForegroundColor Yellow
    python init_db.py
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 数据库初始化失败" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[4/4] 启动后端服务..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command", "cd '$ProjectRoot\backend'; & '.\venv\Scripts\Activate.ps1'; uvicorn app.main:app --reload --port 8000"
)
Write-Host "[OK] 后端已启动: http://localhost:8000" -ForegroundColor Green
Write-Host "[OK] API 文档: http://localhost:8000/docs" -ForegroundColor Green

Set-Location $ProjectRoot

Write-Host ""
Write-Host "[启动前端] 检查依赖..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "[安装] 前端依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 前端依赖安装失败" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[启动] 前端开发服务器..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command", "cd '$ProjectRoot\frontend'; npm run dev"
)
Write-Host "[OK] 前端已启动: http://localhost:5173" -ForegroundColor Green

Set-Location $ProjectRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  启动完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  后端: http://localhost:8000" -ForegroundColor White
Write-Host "  前端: http://localhost:5173" -ForegroundColor White
Write-Host "  测试账号: testuser / testpass123" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "3 秒后自动打开浏览器..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"