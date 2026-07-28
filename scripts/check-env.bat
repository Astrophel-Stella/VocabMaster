@echo off
REM VocabMaster Environment Check Script

setlocal

REM Save script directory as project root
set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

echo ========================================
echo   VocabMaster Environment Check
echo ========================================
echo.

set ERROR=0

REM Check Python
echo [Check] Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [X] Python not installed
    echo     Download: https://www.python.org/downloads/
    set ERROR=1
) else (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo [OK] Python %%i installed
)

REM Check Node.js
echo [Check] Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js not installed
    echo     Download: https://nodejs.org/
    set ERROR=1
) else (
    for /f %%i in ('node --version') do echo [OK] Node.js %%i installed
)

REM Check npm
echo [Check] npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [X] npm not installed
    set ERROR=1
) else (
    for /f %%i in ('npm --version') do echo [OK] npm %%i installed
)

REM Check Rust (optional, only for desktop version)
echo.
echo [Check] Rust (optional, only for desktop version)...
rustc --version >nul 2>&1
if errorlevel 1 (
    echo [!] Rust not installed - only affects desktop packaging
    echo     Install: https://www.rust-lang.org/tools/install
) else (
    for /f "tokens=2" %%i in ('rustc --version 2^>^&1') do echo [OK] Rust %%i installed
)

REM Check backend dependencies
echo.
echo [Check] Backend dependencies...
cd backend
if exist "venv" (
    echo [OK] Python virtual environment created
) else (
    echo [!] Python virtual environment not created - run scripts\dev.bat to create
)
cd ..

REM Check frontend dependencies
echo [Check] Frontend dependencies...
cd frontend
if exist "node_modules" (
    echo [OK] Frontend dependencies installed
) else (
    echo [!] Frontend dependencies not installed - run scripts\dev.bat to install
)
cd ..

echo.
echo ========================================
if "%ERROR%"=="1" (
    echo [Result] Environment check failed, please install missing dependencies
) else (
    echo [Result] Environment check passed! Run scripts\dev.bat to start
)
echo ========================================

echo.
pause

endlocal