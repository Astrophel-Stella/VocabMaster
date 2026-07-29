@echo off
REM VocabMaster Development Environment Startup Script (Windows)
REM Starts both backend and frontend

setlocal

REM Save script directory as project root
set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

echo ========================================
echo   VocabMaster Development Environment
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [Error] Python not found, please install Python 3.10+
    echo         Download: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [Error] Node.js not found, please install Node.js 18+
    echo         Download: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Checking backend virtual environment...
cd backend
if not exist "venv" (
    echo [Create] Virtual environment not found, creating...
    python -m venv venv
    if errorlevel 1 (
        echo [Error] Virtual environment creation failed
        pause
        exit /b 1
    )
)

echo [2/4] Activating virtual environment and installing dependencies...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [Error] Virtual environment activation failed
    pause
    exit /b 1
)
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [Warning] Dependency installation may have issues, continuing...
)

echo [3/4] Initializing database (if needed)...
if not exist "vocabmaster.db" (
    echo [Init] Creating database...
    python init_db.py
    if errorlevel 1 (
        echo [Error] Database initialization failed
        pause
        exit /b 1
    )
)

echo [4/4] Starting backend service...
start "VocabMaster Backend" cmd /k "cd /d %PROJECT_ROOT%\backend && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
if errorlevel 1 (
    echo [Error] Backend startup failed
    pause
    exit /b 1
)
echo [OK] Backend started: http://localhost:8000
echo [OK] API Docs: http://localhost:8000/docs

cd /d "%PROJECT_ROOT%"

echo.
echo [Frontend] Checking dependencies...
cd frontend
if not exist "node_modules" (
    echo [Install] Frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo [Error] Frontend dependency installation failed
        pause
        exit /b 1
    )
)

echo [Start] Frontend development server...
start "VocabMaster Frontend" cmd /k "cd /d %PROJECT_ROOT%\frontend && npm run dev"
if errorlevel 1 (
    echo [Error] Frontend startup failed
    pause
    exit /b 1
)
echo [OK] Frontend started: http://localhost:5173

cd /d "%PROJECT_ROOT%"

echo.
echo ========================================
echo   Startup Complete!
echo ========================================
echo   Backend: http://localhost:8000
echo   Frontend: http://localhost:5173
echo   Test Account: testuser / testpass123
echo ========================================
echo.
echo Press any key to open browser...
pause >nul
start http://localhost:5173

endlocal