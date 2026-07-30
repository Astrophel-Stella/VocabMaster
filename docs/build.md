# 构建与部署指南

本项目的开发 / 测试 / 构建 / 上线全流程说明，以及「人类闸口」确认机制。

---

## 📋 目录

1. [环境要求](#环境要求)
2. [开发环境](#开发环境)
3. [生产部署](#生产部署)
4. [Docker 部署](#docker-部署)
5. [自动化流程](#自动化流程)
6. [人类闸口](#人类闸口)
7. [故障排查](#故障排查)

---

## 环境要求

### 必需

| 工具 | 版本 | 说明 |
|------|------|------|
| Python | 3.10+ | 后端运行环境 |
| Node.js | 18+ | 前端构建工具 |
| npm | 9+ | 包管理器 |

### 可选

| 工具 | 用途 |
|------|------|
| Rust | 桌面版打包（Tauri） |
| Docker | 容器化部署 |
| PostgreSQL | 生产环境数据库 |

---

## 开发环境

### 方式一：一键启动（推荐）

```bash
# Windows
scripts\dev.bat

# PowerShell
.\scripts\dev.ps1

# Linux/Mac
./scripts/dev.sh
```

脚本会自动：
1. ✅ 检查 Python / Node.js 是否安装
2. ✅ 创建 Python 虚拟环境（如果不存在）
3. ✅ 安装所有依赖
4. ✅ 初始化数据库和示例数据
5. ✅ 启动后端（http://localhost:8000）
6. ✅ 启动前端（http://localhost:5173）
7. ✅ 自动打开浏览器

### 方式二：手动启动

```bash
# 终端 1：后端
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python init_db.py      # 首次运行，初始化数据库
uvicorn app.main:app --reload --port 8000

# 终端 2：前端
cd frontend
npm install
npm run dev
```

### 环境检查

```bash
# Windows
scripts\check-env.bat

# 检查结果会显示哪些工具已安装
```

### 停止服务

```bash
# Windows
scripts\stop.bat

# PowerShell
.\scripts\stop.ps1
```

---

## 生产部署

### 架构选择

```
┌─────────────────┐
│  方案一：本地部署  │
│  适合：个人学习    │
│  成本：0 元       │
└─────────────────┘

┌─────────────────┐
│  方案二：云端部署  │
│  适合：正式产品    │
│  成本：0~50 元/月  │
└─────────────────┘
```

### 方案一：本地部署

**适用场景**：个人学习、单机使用

**步骤**：
1. 按上述「开发环境」启动
2. 保持服务运行即可
3. 数据存储在本地 SQLite 数据库

**优点**：
- ✅ 零成本
- ✅ 数据隐私

**缺点**：
- ❌ 需要电脑一直开机
- ❌ 不适合多用户

---

### 方案二：云端部署（推荐）

**适用场景**：正式产品、多人使用

#### 步骤 1：部署后端

##### 选项 A：Railway（推荐新手）

1. 访问 https://railway.app
2. 使用 GitHub 登录
3. 创建新项目 → 部署 GitHub 仓库
4. 选择 `backend` 目录
5. 配置环境变量：
   ```
   SECRET_KEY=<随机密钥>
   DATABASE_URL=<Railway 提供的 PostgreSQL URL>
   ```
6. 自动部署完成
7. 获得访问地址：`https://xxx.railway.app`

**费用**：免费额度 + $5/月 Hobby 计划

##### 选项 B：Render

1. 访问 https://render.com
2. 创建 Web Service
3. 连接 GitHub 仓库
4. 配置：
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. 配置环境变量（同上）
6. 自动部署

**费用**：免费

##### 选项 C：自建服务器（Docker）

见下方 [Docker 部署](#docker-部署) 章节

---

#### 步骤 2：配置前端生产环境

1. 修改 `frontend/.env.production`：
   ```env
   VITE_API_URL=https://your-backend.railway.app
   ```

2. 构建前端：
   ```bash
   cd frontend
   npm run build
   ```

3. 部署前端：
   - **Vercel**：连接 GitHub，自动部署
   - **Cloudflare Pages**：免费，快速
   - **GitHub Pages**：免费

---

#### 步骤 3：配置 CORS

修改后端环境变量，添加前端域名：

```env
# Railway / Render 环境变量
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-domain.com
```

---

## Docker 部署

### 一键部署（推荐）

```bash
# 克隆仓库
git clone https://github.com/your-username/vocabmaster.git
cd vocabmaster

# 配置环境变量
export SECRET_KEY=$(openssl rand -hex 32)

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 访问
# 后端: http://localhost:8000
# 前端: http://localhost:80
```

### 仅部署后端

```bash
# 使用生产配置
docker-compose -f docker-compose.prod.yml up -d

# 仅后端服务
# 前端使用桌面版或单独部署
```

### Docker 常用命令

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs backend
docker-compose logs frontend

# 进入容器
docker-compose exec backend bash

# 清理数据（谨慎！）
docker-compose down -v
```

---

## 交付流水线（北极星蓝图）

> 所有需求交付的强制基线。详见 ADR-0015 与 `CLAUDE.md` §8。顺序不可打乱。

```
① 从 origin/master 切特性分支 → 改代码
② 全部测试通过：单测(Vitest/pytest) + 集成 + E2E(Playwright，模拟浏览器操作)
③ 架构师审核 PR（对照验收标准 + ADR + 接口定义）
④ 合并 master（架构师执行 `gh pr merge`）
⑤ 等待人工(QA/陈豪)确认部署
⑥ 基于 master 构建 → 部署 → 回归测试
```

**四条硬规则：**

1. **master 起步**：修改从 `origin/master` 切分支，PR 目标恒为 `master`，不在特性分支上叠特性。
2. **测试全过含 E2E**：面向用户的功能必须同时有代码级单测**和**浏览器级 E2E（Playwright）。E2E **不可跳过，不可用接口测试或组件单测替代**。无 E2E 覆盖的需求不得升到「✅ 已验收」，不得进入部署。
3. **测试与文档跟随工程**：测试用例、`specs/requirements.md` 锚点、ADR（`docs/decisions/`）随代码同 PR 提交、同 PR 合并 master；不单次使用、不留特性分支。回归直接拉 master 复用全部历史用例。
4. **合并前置部署**：部署必须在 PR 合并 master **之后**、基于 master 构建；**特性分支不直接上线**。架构师审核通过后**由架构师执行 `gh pr merge` 合并 master**（合并是架构师职责，非人工闸口）；人工(QA/陈豪)确认后再部署。

> Bug 验证路由（既有规则）：Bug 由谁发现，修复后就由谁验证，不交叉指派——代码级→单元&集成测试工程师；功能级→UI&功能自动化测试工程师。

---

## 自动化流程

### CI（持续集成）

**触发条件**：push / PR 到 main 分支

**自动执行**：
1. ✅ 前端类型检查
2. ✅ 前端 Lint
3. ✅ 前端单元测试
4. ✅ 后端单元测试

**查看结果**：
- GitHub → Actions → CI workflow

### CD（持续部署）

**触发条件**：push 到 main 分支 或 手动触发

**自动执行**：
1. ✅ 构建后端 Docker 镜像
2. ✅ 部署到配置的平台
3. ⚠️ **人类闸口**：检查部署日志

### Release（版本发布）

**触发条件**：打 tag（如 `v1.0.0`）

```bash
git tag v1.0.0
git push origin v1.0.0
```

**自动执行**：
1. ✅ 构建 Windows 安装包
2. ✅ 创建 GitHub Release **草稿**
3. ⚠️ **人类闸口**：确认后发布

---

## 人类闸口

> 关键操作需要人工确认，防止错误发布。

### 闸口 1：部署确认

**场景**：自动部署到生产环境

**确认内容**：
- ✅ CI 测试全部通过
- ✅ 检查变更内容（git diff）
- ✅ 确认环境变量正确

**操作**：
- Railway/Render 会自动部署，但可以配置「Review App」先预览
- 或使用 GitHub Environments 要求审批

### 闸口 2：发布确认

**场景**：发布新版本（Release）

**流程**：
1. 打 tag 触发自动构建
2. GitHub 创建 **Release 草稿**
3. **人工检查**：
   - 安装包能否正常运行
   - 版本号是否正确
   - Release Notes 是否完整
4. 点击 **Publish release** 正式发布

**⚠️ 发布后不可撤销！**

### 闸口 3：破坏性变更

**场景**：数据库迁移、API 变更等

**确认内容**：
- ✅ 数据备份
- ✅ 迁移脚本测试
- ✅ 回滚方案

---

## 环境变量说明

### 后端环境变量

| 变量名 | 说明 | 默认值 | 生产环境 |
|--------|------|--------|---------|
| `DATABASE_URL` | 数据库连接 | `sqlite:///./vocabmaster.db` | PostgreSQL URL |
| `SECRET_KEY` | JWT 密钥 | ⚠️ 不安全 | **必须修改** |
| `ALGORITHM` | JWT 算法 | `HS256` | - |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token 有效期 | `30` | - |
| `APP_NAME` | 应用名称 | `VocabMaster API` | - |
| `DEBUG` | 调试模式 | `true` | `false` |
| `CORS_ORIGINS` | CORS 允许源 | `*` | 前端域名 |

### 前端环境变量

| 变量名 | 说明 | 开发环境 | 生产环境 |
|--------|------|----------|---------|
| `VITE_API_URL` | API 地址 | `http://localhost:8000` | 实际后端地址 |
| `VITE_APP_ENV` | 环境 | `development` | `production` |

### 生成安全密钥

```bash
# Linux/Mac/WSL
openssl rand -hex 32

# Python
python -c "import secrets; print(secrets.token_hex(32))"

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 故障排查

### 后端无法启动

**问题**：`ModuleNotFoundError: No module named 'app'`

**解决**：
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

### 前端无法连接后端

**问题**：`Failed to fetch` 或 `Network Error`

**排查**：
1. 后端是否启动？访问 http://localhost:8000/health
2. CORS 配置是否正确？
3. 前端 `VITE_API_URL` 是否正确？

**解决**：
```bash
# 检查后端
curl http://localhost:8000/health

# 检查前端配置
cat frontend/.env.development
```

---

### 数据库错误

**问题**：`no such table: users`

**解决**：
```bash
cd backend
python init_db.py  # 初始化数据库
```

---

### Docker 容器无法启动

**问题**：容器启动后立即退出

**排查**：
```bash
docker-compose logs backend
docker-compose logs frontend
```

**常见原因**：
- 环境变量缺失
- 端口被占用
- 数据库连接失败

---

## 下一步

- [ ] 配置生产环境变量
- [ ] 选择部署平台（Railway/Render/自建）
- [ ] 配置 GitHub Secrets（`PRODUCTION_API_URL`, `SECRET_KEY`）
- [ ] 测试部署流程
- [ ] 配置域名（可选）
- [ ] 配置 HTTPS（平台自动提供）

---

## 相关文档

- [架构设计](./architecture.md)
- [需求规格](../specs/requirements.md)
- [API 文档](http://localhost:8000/docs) - 后端启动后访问
