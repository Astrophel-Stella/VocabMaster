#!/usr/bin/env bash
# VocabMaster 开发环境启动脚本
# 同时启动后端和前端

set -e

echo "========================================"
echo "  VocabMaster 开发环境启动"
echo "========================================"
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "[错误] 未找到 Python3，请先安装 Python 3.10+"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未找到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

echo "[1/4] 检查后端虚拟环境..."
cd backend
if [ ! -d "venv" ]; then
    echo "[创建] 虚拟环境不存在，正在创建..."
    python3 -m venv venv
fi

echo "[2/4] 激活虚拟环境并安装依赖..."
source venv/bin/activate
pip install -r requirements.txt --quiet

echo "[3/4] 初始化数据库（如果需要）..."
if [ ! -f "vocabmaster.db" ]; then
    python init_db.py
fi

echo "[4/4] 启动后端服务..."
osascript -e 'tell application "Terminal" to do script "cd '$(pwd)' && source venv/bin/activate && uvicorn app.main:app --reload --port 8000"' 2>/dev/null || \
gnome-terminal -e "bash -c 'cd $(pwd) && source venv/bin/activate && uvicorn app.main:app --reload --port 8000'" 2>/dev/null || \
xterm -e "bash -c 'cd $(pwd) && source venv/bin/activate && uvicorn app.main:app --reload --port 8000'" 2>/dev/null &

echo "[✓] 后端已启动: http://localhost:8000"
echo "[✓] API 文档: http://localhost:8000/docs"

cd ..

echo ""
echo "[启动前端] 检查依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "[安装] 前端依赖..."
    npm install
fi

echo "[启动] 前端开发服务器..."
osascript -e 'tell application "Terminal" to do script "cd '$(pwd)' && npm run dev"' 2>/dev/null || \
gnome-terminal -e "bash -c 'cd $(pwd) && npm run dev'" 2>/dev/null || \
xterm -e "bash -c 'cd $(pwd) && npm run dev'" 2>/dev/null &

echo "[✓] 前端已启动: http://localhost:5173"

cd ..

echo ""
echo "========================================"
echo "  启动完成！"
echo "========================================"
echo "  后端: http://localhost:8000"
echo "  前端: http://localhost:5173"
echo "  测试账号: testuser / testpass123"
echo "========================================"
