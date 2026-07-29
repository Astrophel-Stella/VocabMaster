#!/usr/bin/env pwsh
# Stop all VocabMaster related services

# Set console encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Stopping VocabMaster services..." -ForegroundColor Yellow

# Stop processes on port 8000 (backend)
$backend = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($backend) {
    $killedPids = @()
    $backend | ForEach-Object {
        $procId = $_.OwningProcess
        if ($procId -notin $killedPids) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            $killedPids += $procId
            Write-Host "[OK] Stopped backend process $procId" -ForegroundColor Green
        }
    }
} else {
    Write-Host "[INFO] No services on port 8000" -ForegroundColor Yellow
}

# Stop processes on port 5173 (frontend)
$frontend = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontend) {
    $killedPids = @()
    $frontend | ForEach-Object {
        $procId = $_.OwningProcess
        if ($procId -notin $killedPids) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            $killedPids += $procId
            Write-Host "[OK] Stopped frontend process $procId" -ForegroundColor Green
        }
    }
} else {
    Write-Host "[INFO] No services on port 5173" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "All services stopped" -ForegroundColor Cyan
