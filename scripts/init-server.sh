#!/bin/bash
# 服务器初始化脚本 - 在生产服务器上运行一次
# 使用方法: ssh root@111.229.214.179 'bash -s' < scripts/init-server.sh

set -e

echo "🔧 初始化生产服务器..."
echo "========================"

# 更新系统
echo "📦 更新系统包..."
apt-get update && apt-get upgrade -y

# 安装Docker
echo "🐳 安装Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | bash
fi

# 安装Docker Compose
echo "🔧 安装Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 安装Git
echo "📥 安装Git..."
if ! command -v git &> /dev/null; then
    apt-get install -y git
fi

# 创建项目目录
echo "📁 创建项目目录..."
mkdir -p /opt/vocabmaster
cd /opt/vocabmaster

# 克隆仓库
if [ ! -d ".git" ]; then
    echo "📥 克隆仓库..."
    git clone https://github.com/Astrophel-Stella/VocabMaster.git .
else
    echo "✅ 仓库已存在"
fi

# 配置防火墙
echo "🔥 配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw allow 8000/tcp  # API
    ufw --force enable
fi

# 创建环境配置
echo "⚙️ 创建环境配置..."
cat > backend/.env << 'EOF'
DATABASE_URL=sqlite:///./vocabmaster.db
SECRET_KEY=change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF

cat > frontend/.env << 'EOF'
VITE_API_URL=
EOF

# 初始化数据库
echo "🗄️ 初始化数据库..."
cd backend
pip3 install -r requirements.txt
python3 init_db.py
cd ..

# 启动服务
echo "🚀 启动服务..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "✅ 服务器初始化完成!"
echo ""
echo "访问地址:"
echo "  前端: http://111.229.214.179"
echo "  API:  http://111.229.214.179:8000"
echo "  API文档: http://111.229.214.179:8000/docs"
echo ""
echo "测试账号: test / 123456"
