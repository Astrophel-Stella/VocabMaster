# VocabMaster 📚

跨平台英语单词学习助手：**选择词库 → 单词展示 → 标记掌握 → 进度追踪**。

## 🚀 快速开始

### 方式一：一键启动（推荐）

```bash
# Windows
scripts\dev.bat

# PowerShell
.\scripts\dev.ps1

# Linux/Mac
./scripts/dev.sh
```

自动完成：
- ✅ 检查环境
- ✅ 安装依赖
- ✅ 初始化数据库
- ✅ 启动后端（http://localhost:8000）
- ✅ 启动前端（http://localhost:5173）

### 方式二：手动启动

```bash
# 后端
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python init_db.py
uvicorn app.main:app --reload --port 8000

# 前端
cd frontend
npm install
npm run dev
```

### 测试账号

- 用户名：`testuser`
- 密码：`testpass123`

---

## 📦 部署

详细部署说明见 [docs/build.md](docs/build.md)

### 生产部署选项

1. **Railway**（推荐）- 免费 + 自动部署
2. **Docker** - 一键容器化部署
3. **自建服务器** - 完全掌控

---

## 🛠️ 技术栈

**前端**：React 18 + TypeScript + Vite + Tailwind + Tauri 2
**后端**：Python 3.10+ + FastAPI + SQLAlchemy + SQLite
**测试**：Vitest + pytest + Playwright

---

## 📖 文档导航

| 目录 | 类别 | 内容 |
|------|------|------|
| `specs/` | 需求文档 | [requirements.md](specs/requirements.md) — 可追溯的需求规格 |
| `docs/` | 技术文档 | [architecture.md](docs/architecture.md) · [build.md](docs/build.md) |
| `CLAUDE.md` | 开发规范 | AI 协作宪法 |

---

## 📚 项目结构

```
VocabMaster/
├── frontend/           # 前端（React + Tauri）
│   ├── src/
│   │   ├── components/ # UI 组件
│   │   ├── hooks/      # 业务逻辑
│   │   ├── stores/     # 状态管理
│   │   └── lib/        # 工具函数
│   └── src-tauri/      # Tauri 桌面壳
│
├── backend/            # 后端（FastAPI）
│   ├── app/
│   │   ├── api/        # API 路由
│   │   ├── models/     # 数据模型
│   │   └── services/   # 业务逻辑
│   └── tests/          # 测试
│
├── scripts/            # 工具脚本
├── docs/               # 文档
└── specs/              # 需求规格
```

---

## 🔄 CI/CD

- ✅ 自动测试（push/PR）
- ✅ 自动部署（main 分支）
- ✅ 自动打包（打 tag）
- ⚠️ 人类闸口确认

---

## 📄 License

MIT

---

## 🙏 致谢

- [FastAPI](https://fastapi.tiangolo.com/)
- [Tauri](https://tauri.app/)
- [React](https://react.dev/)
