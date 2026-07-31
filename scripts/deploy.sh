#!/bin/bash
# 一键部署脚本 - 适用于单服务器环境
# 使用方法: ./scripts/deploy.sh

set -e

echo "🚀 VocabMaster 一键部署脚本"
echo "================================"

# 配置
PROD_HOST="111.229.214.179"
PROD_USER="root"
PROJECT_DIR="/opt/vocabmaster"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查SSH连接
echo -e "${YELLOW}检查SSH连接...${NC}"
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes $PROD_USER@$PROD_HOST exit 2>/dev/null; then
    echo -e "${RED}❌ SSH连接失败${NC}"
    echo "请确保已配置SSH密钥认证："
    echo "  1. 生成SSH密钥: ssh-keygen -t rsa"
    echo "  2. 复制公钥到服务器: ssh-copy-id $PROD_USER@$PROD_HOST"
    exit 1
fi
echo -e "${GREEN}✅ SSH连接成功${NC}"

# 检查本地测试
echo -e "${YELLOW}运行本地测试...${NC}"
cd frontend
npm run test || { echo -e "${RED}❌ 测试失败，部署已取消${NC}"; exit 1; }
cd ../backend
pytest -v || { echo -e "${RED}❌ 测试失败，部署已取消${NC}"; exit 1; }
echo -e "${GREEN}✅ 测试通过${NC}"

# 部署到生产
echo -e "${YELLOW}开始部署到生产服务器...${NC}"
ssh $PROD_USER@$PROD_HOST << 'EOF'
    set -e

    cd /opt/vocabmaster

    echo "📥 拉取最新代码..."
    git fetch origin
    git reset --hard origin/master

    echo "🔨 构建Docker镜像..."
    docker-compose -f docker-compose.prod.yml build --no-cache

    echo "🚀 滚动更新部署..."
    docker-compose -f docker-compose.prod.yml up -d

    echo "⏳ 等待服务启动..."
    sleep 30

    echo "🏥 健康检查..."
    curl -f http://localhost:8000/health || exit 1

    echo "✅ 部署成功!"
EOF

echo -e "${GREEN}✅ 部署完成${NC}"
echo ""
echo "访问地址:"
echo "  前端: http://$PROD_HOST"
echo "  API:  http://$PROD_HOST:8000"
echo ""
echo "测试账号: test / 123456"
