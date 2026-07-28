@echo off
REM VocabMaster 开发环境启动脚本 (Windows)
REM 同时启动后端和前端

echo ========================================
echo   VocabMaster 开发环境启动
echo ========================================
echo.

REM 检查 Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Python，请先安装 Python 3.10+
    pause
    exit /b 1
)

REM 检查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

echo [1/4] 检查后端虚拟环境...
cd backend
if not exist "venv" (
    echo [创建] 虚拟环境不存在，正在创建...
    python -m venv venv
)

echo [2/4] 激活虚拟环境并安装依赖...
call venv\Scripts\activate
pip install -r requirements.txt --quiet

echo [3/4] 初始化数据库（如果需要）...
if not exist "vocabmaster.db" (
    python init_db.py
)

echo [4/4] 启动后端服务...
start "VocabMaster Backend" cmd /k "venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"
echo [✓] 后端已启动: http://localhost:8000
echo [✓] API 文档: http://localhost:8000/docs

cd ..

echo.
echo [启动前端] 检查依赖...
cd frontend
if not exist "node_modules" (
    echo [安装] 前端依赖...
    call npm install
)

echo [启动] 前端开发服务器...
start "VocabMaster Frontend" cmd /k "npm run dev"
echo [✓] 前端已启动: http://localhost:5173

cd ..

echo.
echo ========================================
echo   启动完成！
echo ========================================
echo   后端: http://localhost:8000
echo   前端: http://localhost:5173
echo   测试账号: testuser / testpass123
echo ========================================
echo.
echo 按任意键打开浏览器...
pause >nul
start http://localhost:5173
