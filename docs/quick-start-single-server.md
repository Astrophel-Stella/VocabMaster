# 单服务器环境 - 快速开始指南

## 架构概览

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
 │ 本机开发环境 │  push   │   GitHub    │  merge  │ GitHub Actions│
 │ (localhost)  ├────────►│  (代码仓库)  ├────────►│  (自动测试)   │
 └─────────────┘         └─────────────┘         └──────┬──────┘
                                                        │
                                                        │ SSH deploy
                                                 ┌──────▼──────┐
                                                 │ 生产服务器   │
                                                 │111.229.214.179│
                                                 └─────────────┘
```

## 第一次使用 - 服务器初始化

### 1. 配置SSH密钥认证

在**本机**执行：

```bash
# 生成SSH密钥（如果还没有）
ssh-keygen -t rsa -b 4096

# 复制公钥到服务器
ssh-copy-id root@111.229.214.179

# 测试SSH连接
ssh root@111.229.214.179
```

### 2. 初始化生产服务器

在**本机**执行：

```bash
# 方式1: 使用自动化脚本
ssh root@111.229.214.179 'bash -s' < scripts/init-server.sh

# 方式2: 手动初始化
# SSH到服务器
ssh root@111.229.214.179

# 安装Docker
curl -fsSL https://get.docker.com | bash

# 安装Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 创建项目目录
mkdir -p /opt/vocabmaster
cd /opt/vocabmaster

# 克隆仓库
git clone https://github.com/Astrophel-Stella/VocabMaster.git .

# 配置防火墙
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp
ufw --force enable

# 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

### 3. 配置GitHub Secrets

在GitHub仓库 **Settings → Secrets and variables → Actions** 添加：

| Secret名称 | 值 | 获取方式 |
|-----------|-----|----------|
| `SSH_PRIVATE_KEY` | SSH私钥内容 | `cat ~/.ssh/id_rsa` |
| `PROD_HOST` | `111.229.214.179` | 服务器IP |
| `PROD_USER` | `root` | 服务器用户名 |

## 日常使用 - 自动化流程

### 完整流程

```
1. 软件工程师开发(含测试) → 2. 创建PR → 3. CI确定性门禁 → 4. AI预审 + 人类审核Approve
                                                              ↓
5. 自动合并 → 6. 创建部署确认Issue → 7. 用户确认上线 → 8. 自动部署(冒烟+回滚)
```

### 步骤详解

#### 步骤1-2: 本机开发 & 创建PR

```bash
# 切换到master
git checkout master

# 创建特性分支
git checkout -b feature/xxx

# 开发 & 测试
npm run dev
npm run test

# 提交代码
git add .
git commit -m "feat: 新功能描述"
git push origin feature/xxx

# 创建PR
gh pr create --title "feat: 新功能" --body "功能描述"
```

#### 步骤3: 自动测试 (GitHub Actions自动执行)

PR创建后，GitHub Actions自动运行：
- ✅ Lint检查
- ✅ 单元测试
- ✅ 集成测试
- ✅ E2E测试

#### 步骤4: AI 预审 + 人类审核

CI 全绿后，AI 代码审查助手自动留预审评论（advisory）。**人类审核者**在PR页面：
- Review 后点击 "Approve" → `pull_request_review` 事件触发自动合并
- 或评论问题 → 退回软件工程师修改

> ⚠️ AI 不自行合并，合并批准权在人类。

#### 步骤5-6: 自动合并 & 创建部署确认

人类审核者 Approve 后：
- 自动合并PR到master
- 自动创建部署确认Issue
- 自动@用户(您)

#### 步骤7: 用户确认

在部署确认Issue中：
- 回复 "确认上线" → 开始部署
- 回复 "拒绝" → 取消部署

#### 步骤8: 自动部署

确认后，GitHub Actions自动：
1. SSH到生产服务器
2. 拉取最新代码
3. 构建Docker镜像
4. 滚动更新部署
5. 冒烟测试验证

### 手动部署 (可选)

如果需要手动部署：

```bash
# 方式1: 使用部署脚本
./scripts/deploy.sh  # Linux/Mac
scripts\deploy.bat   # Windows

# 方式2: 直接SSH部署
ssh root@111.229.214.179 << 'EOF'
    cd /opt/vocabmaster
    git pull origin master
    docker-compose -f docker-compose.prod.yml up -d --build
EOF
```

## 回滚操作

### 自动回滚

冒烟测试失败时，自动回滚到上一版本。

### 手动回滚

```bash
ssh root@111.229.214.179 << 'EOF'
    cd /opt/vocabmaster
    git reset --hard HEAD~1
    docker-compose -f docker-compose.prod.yml up -d --build
EOF
```

## 常见问题

### Q1: 如何查看服务状态？

```bash
ssh root@111.229.214.179 << 'EOF'
    cd /opt/vocabmaster
    docker-compose -f docker-compose.prod.yml ps
    docker-compose -f docker-compose.prod.yml logs -f
EOF
```

### Q2: 如何重启服务？

```bash
ssh root@111.229.214.179 << 'EOF'
    cd /opt/vocabmaster
    docker-compose -f docker-compose.prod.yml restart
EOF
```

### Q3: 如何查看部署日志？

在GitHub PR页面，点击 "Checks" 标签查看详细日志。

### Q4: 测试失败怎么办？

在本地修复后重新push，GitHub Actions会自动重新运行测试。

### Q5: 如何访问生产环境？

- 前端: http://111.229.214.179
- API: http://111.229.214.179:8000
- API文档: http://111.229.214.179:8000/docs
- 测试账号: test / 123456

## 安全注意事项

1. **SSH密钥**: 定期轮换SSH密钥
2. **数据库备份**: 定期备份SQLite数据库
3. **监控日志**: 定期查看服务日志
4. **最小权限**: 不要在生产服务器上运行不必要的服务

## 性能优化建议

1. **Docker镜像缓存**: 使用缓存加速构建
2. **CDN加速**: 为静态资源配置CDN
3. **数据库优化**: 考虑迁移到PostgreSQL/MySQL
4. **监控告警**: 配置Prometheus + Grafana

## 下一步

- [ ] 配置GitHub Secrets
- [ ] 初始化生产服务器
- [ ] 创建测试PR验证流程
- [ ] 团队培训新流程
