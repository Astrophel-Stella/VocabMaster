#!/usr/bin/env pwsh
# 停止所有 VocabMaster 相关服务

Write-Host "正在停止 VocabMaster 服务..." -ForegroundColor Yellow

# 停止占用 8000 端口的进程（后端）
$backend = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($backend) {
    $backend | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Write-Host "[✓] 后端已停止" -ForegroundColor Green
}

# 停止占用 5173 端口的进程（前端）
$frontend = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontend) {
    $frontend | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Write-Host "[✓] 前端已停止" -ForegroundColor Green
}

Write-Host ""
Write-Host "所有服务已停止" -ForegroundColor Cyan
