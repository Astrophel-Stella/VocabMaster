@echo off
REM Stop all VocabMaster related services

echo Stopping VocabMaster services...

REM Stop Python backend window
tasklist /FI "WINDOWTITLE eq VocabMaster Backend*" 2>NUL | findstr "VocabMaster" >NUL
if not errorlevel 1 (
    taskkill /FI "WINDOWTITLE eq VocabMaster Backend*" /F >NUL 2>&1
    echo [OK] Backend window closed
)

REM Stop Node.js frontend window
tasklist /FI "WINDOWTITLE eq VocabMaster Frontend*" 2>NUL | findstr "VocabMaster" >NUL
if not errorlevel 1 (
    taskkill /FI "WINDOWTITLE eq VocabMaster Frontend*" /F >NUL 2>&1
    echo [OK] Frontend window closed
)

REM Stop processes on port 8000 (backend)
REM Token 5 is the PID in netstat -aon output
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000.*LISTENING" 2^>NUL') do (
    taskkill /F /PID %%a >NUL 2>&1
    echo [OK] Stopped process %%a on port 8000
)

REM Stop processes on port 5173 (frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173.*LISTENING" 2^>NUL') do (
    taskkill /F /PID %%a >NUL 2>&1
    echo [OK] Stopped process %%a on port 5173
)

echo.
echo All services stopped
pause
