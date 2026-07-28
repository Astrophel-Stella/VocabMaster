@echo off
REM 停止所有 VocabMaster 相关服务

echo 正在停止 VocabMaster 服务...

REM 停止 Python 后端
tasklist /FI "WINDOWTITLE eq VocabMaster Backend*" 2>NUL | find "^VocabMaster Backend" >NUL
if "%ERRORLEVEL%"=="0" (
    taskkill /FI "WINDOWTITLE eq VocabMaster Backend*" /F
    echo [✓] 后端已停止
)

REM 停止 Node.js 前端
tasklist /FI "WINDOWTITLE eq VocabMaster Frontend*" 2>NUL | find "^VocabMaster Frontend" >NUL
if "%ERRORLEVEL%"=="0" (
    taskkill /FI "WINDOWTITLE eq VocabMaster Frontend*" /F
    echo [✓] 前端已停止
)

REM 停止占用 8000 端口的进程（后端）
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >NUL 2>&1
    echo [✓] 已停止端口 8000 上的服务
)

REM 停止占用 5173 端口的进程（前端）
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >NUL 2>&1
    echo [✓] 已停止端口 5173 上的服务
)

echo.
echo 所有服务已停止
pause
