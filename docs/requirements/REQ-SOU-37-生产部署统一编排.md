# REQ-SOU-37: 生产部署统一编排（前端+后端）

## 版本历史
| 版本 | 日期 | 变更人 | 变更内容 |
|------|------|--------|----------|
| 1.0  | 2026-08-01 | 软件工程师 | 初始版本 |

## 问题描述

### 现象
SOU-36 已合并到 master 并"部署成功"，但访问生产 http://111.229.214.179 仍是旧首页。前端 JS bundle 仍含 `Password123`，不含新版特征词 `欢迎回来`。

### 根因
`docker-compose.prod.yml` 只定义了 `backend` 服务，注释写明"仅后端服务"。生产上实际跑着一个不在 compose 编排内的 `vocabmaster-frontend` 容器。自动部署只重建了后端，完全没碰前端容器。

## 需求规格

### 正常流程
```gherkin
Given docker-compose.prod.yml 包含 backend + frontend 两个服务
When 执行 docker compose -f docker-compose.prod.yml up -d --build
Then frontend 容器由 compose 管理并运行
And 前端 JS bundle 更新为最新版本
And 首页显示新版内容（含"欢迎回来"）
```

### 异常流程
```gherkin
Given 前端构建失败
When 执行 docker compose up
Then 容器启动失败并报错
And 部署流程中断
```

## 技术设计

### 1. 修改 docker-compose.prod.yml

新增 `frontend` 服务：
- `build.context: ./frontend`
- `build.args.VITE_API_URL`: 空字符串（使用 nginx 同域反代）
- `container_name: vocabmaster-frontend`
- `ports: "80:80"`（不映射 443，当前无证书）
- `restart: unless-stopped`
- `depends_on: backend`
- 使用默认网络，与 backend 同网络

### 2. 修改前端 API 配置

`frontend/src/lib/api.ts` 当前逻辑：
- `VITE_API_URL` 有值 → `${VITE_API_URL}/api`
- `VITE_API_URL` 无值 → `http://localhost:8000/api`

新增支持空字符串：
- `VITE_API_URL === ''` → `/api`（相对 URL，nginx 反代）

### 3. 更新部署脚本

`scripts/deploy.sh` 已使用 `docker compose -f docker-compose.prod.yml`，无需修改。

### 4. 移除过时注释

删除 compose 顶部"仅后端服务，前端使用桌面版或单独部署"的注释。

## 验收标准

1. `docker-compose.prod.yml` 同时定义 backend + frontend 两个服务
2. `docker compose config` 校验通过
3. 从干净状态 `docker compose up -d --build` 后，前端容器由 compose 管理
4. 部署后生产首页 JS bundle 不含 `Password123`，含 `欢迎回来`
5. 首页不再显示"测试账号: test / Password123"提示
6. `/api/` 反代正常（登录等接口可用）
7. CI 质量门禁全绿

## 关联 Issue
- SOU-37
- 相关：SOU-35（生产 localhost 硬编码防呆）
- 源需求：SOU-36
