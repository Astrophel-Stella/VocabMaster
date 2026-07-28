# 架构设计(当前有效 · 单一真相源)

> 本文件是**当前唯一有效**的架构文档,对齐实际代码(Tauri + React + Python FastAPI)。
> 历史上的 Electron + 无后端方案已废弃,存于 `docs/_archive/`,仅供参考。

## 1. 方案总述

**Tauri 2 + React 前端 + Python FastAPI 后端 + 用户认证**

- **前端**:React + TypeScript 承载全部 UI 与业务逻辑(单词展示、学习进度、状态管理)。
- **后端**:Python FastAPI 提供用户认证、词库管理、进度追踪等 API 服务。
- **平台适配层 `adapters/`**:隔离各平台原生能力差异(HTTP / 文件 / 存储)。
  - 桌面(Windows/Mac/Linux):**Tauri 2**(体积小,原生 HTTP 无 CORS)
  - 网页:同一套 React,Vite 构建
  - 移动(后续):React Native,复用 hooks/stores,仅重写 adapter
- **存储**:SQLite 数据库(后端),localStorage/IndexedDB(前端缓存)。

## 2. 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                    用户界面层 (UI)                        │
│        React Components + Tailwind CSS                  │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                业务逻辑层 (Hooks)                         │
│    useAuth / useWords / useProgress / useSettings       │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                状态管理层 (Stores)                        │
│           Zustand (userStore / wordStore / appStore)    │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│               平台适配层 (Adapters)                       │
│         apiFetch (web/tauri 差异隔离)                    │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
   ┌────▼─────┐     ┌────▼──────────┐
   │   Web    │     │  Tauri Desktop│
   │ (Vite)   │     │  (Rust 壳)    │
   └──────────┘     └───────────────┘
        │                 │
        └────────┬────────┘
                 │
        ┌────────▼─────────┐
        │  FastAPI Backend │
        │  (Python)        │
        │  - Auth API      │
        │  - Words API     │
        │  - Progress API  │
        └────────┬─────────┘
                 │
        ┌────────▼─────────┐
        │  SQLite Database │
        │  - users         │
        │  - word_banks    │
        │  - words         │
        │  - progress      │
        └──────────────────┘
```

## 3. 技术栈详情

### 3.1 前端技术栈

| 技术 | 用途 | 说明 |
|------|------|------|
| React 18 | UI 框架 | 函数式组件 + Hooks |
| TypeScript | 类型安全 | 全量 TS |
| Vite | 构建工具 | 快速开发体验 |
| Tailwind CSS | 样式 | 原子化 CSS |
| Zustand | 状态管理 | 轻量、简单 |
| Tauri 2 | 桌面壳 | Rust 后端,体积小 |

### 3.2 后端技术栈

| 技术 | 用途 | 说明 |
|------|------|------|
| Python 3.10+ | 服务端语言 | AI 时代最佳选择 |
| FastAPI | Web 框架 | 高性能、类型提示、自动文档 |
| SQLAlchemy | ORM | 数据库抽象层 |
| SQLite | 数据库 | 轻量级,适合个人使用 |
| python-jose | JWT | 用户认证 |
| passlib | 密码加密 | bcrypt 算法 |

### 3.3 测试技术栈

| 技术 | 用途 | 说明 |
|------|------|------|
| Vitest | 前端单元测试 | Vite 原生,快速 |
| pytest | 后端单元测试 | Python 标准选择 |
| Playwright | E2E 测试 | 跨浏览器自动化 |
| pytest-asyncio | 异步测试 | FastAPI 异步支持 |

## 4. 分层架构(依据实际代码)

### 4.1 前端分层 (`frontend/src/`)

依赖方向单向,自底向上:

| 层 | 目录 | 职责 | 关键文件 |
|---|---|---|---|
| 平台适配 | `adapters/` | 收敛平台差异,对上只暴露统一 `apiFetch` | `index.ts` / `platform.ts` / `web.ts` / `tauri.ts` |
| API 客户端 | `lib/api.ts` | 封装后端 API 调用 | `lib/api.ts` (新建) |
| 本地存储 | `lib/db.ts` | 本地缓存(可选) | `lib/db.ts` |
| 纯工具 | `lib/` | 格式化等工具函数 | `lib/format.ts` |
| 状态管理 | `stores/` | Zustand(用户/单词/设置) | `userStore.ts` / `wordStore.ts` / `settingsStore.ts` |
| 业务编排 | `hooks/` | 把 store+api 编排成用例 | `useAuth.ts` / `useWords.ts` / `useProgress.ts` |
| UI | `components/` `App.tsx` | 展示层,只调 hooks/stores | 各 Panel 组件 |

### 4.2 后端分层 (`backend/app/`)

| 层 | 目录 | 职责 | 关键文件 |
|---|---|---|---|
| API 路由 | `api/` | HTTP 接口定义 | `auth.py` / `words.py` / `progress.py` |
| 数据模型 | `models/` | SQLAlchemy ORM | `user.py` / `word.py` / `progress.py` |
| 业务逻辑 | `services/` | 业务逻辑封装 | `auth_service.py` / `word_service.py` (可选) |
| 配置 | `config.py` | 环境变量管理 | `config.py` |
| 数据库 | `database.py` | 数据库连接管理 | `database.py` |

## 5. 数据库设计

### 5.1 ER 图

```
┌─────────────┐       ┌────────────────┐
│   users     │       │  word_banks    │
├─────────────┤       ├────────────────┤
│ id (PK)     │       │ id (PK)        │
│ username    │       │ name           │
│ email       │       │ description    │
│ hashed_pass │       │ total_words    │
│ created_at  │       └───────┬────────┘
└──────┬──────┘               │
       │                      │
       │                      │ 1:N
       │                      │
       │              ┌───────▼────────┐
       │              │    words       │
       │              ├────────────────┤
       │              │ id (PK)        │
       │              │ word_bank_id   │
       │              │ spelling       │
       │              │ phonetic       │
       │              │ pronunciation  │
       │              │ meaning        │
       │              │ example        │
       │              └───────┬────────┘
       │                      │
       │ 1:N                  │ 1:N
       │                      │
┌──────▼──────────────────────▼───────┐
│      learning_progress              │
├─────────────────────────────────────┤
│ id (PK)                             │
│ user_id (FK)                        │
│ word_id (FK)                        │
│ is_mastered                         │
│ mastered_at                         │
└─────────────────────────────────────┘
```

### 5.2 表结构

#### users 表
- `id`: 主键
- `username`: 用户名(唯一)
- `email`: 邮箱(唯一)
- `hashed_password`: 加密后的密码
- `created_at`: 创建时间
- `updated_at`: 更新时间

#### word_banks 表
- `id`: 主键
- `name`: 词库名称(唯一)
- `description`: 描述
- `total_words`: 单词总数
- `created_at`: 创建时间

#### words 表
- `id`: 主键
- `word_bank_id`: 所属词库 ID(外键)
- `spelling`: 单词拼写
- `phonetic`: 音标
- `pronunciation_url`: 发音音频 URL
- `meaning`: 中文释义
- `example_sentence`: 例句
- `order_index`: 排序索引

#### learning_progress 表
- `id`: 主键
- `user_id`: 用户 ID(外键)
- `word_id`: 单词 ID(外键)
- `is_mastered`: 是否已掌握
- `mastered_at`: 掌握时间
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 6. API 设计

### 6.1 认证 API (`/api/auth`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/register` | 用户注册 | ❌ |
| POST | `/login` | 用户登录 | ❌ |
| GET | `/me` | 获取当前用户 | ✅ |

### 6.2 词库 API (`/api`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/word-banks` | 获取词库列表 | ❌ |
| GET | `/word-banks/{id}/words` | 获取词库单词 | ❌ |
| GET | `/words/{id}` | 获取单词详情 | ❌ |

### 6.3 进度 API (`/api/progress`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/{word_bank_id}` | 获取学习进度 | ✅ |
| GET | `/{word_bank_id}/stats` | 获取进度统计 | ✅ |
| POST | `/{word_id}` | 标记已掌握 | ✅ |
| DELETE | `/{word_id}` | 取消标记 | ✅ |

## 7. 关键决策

### 7.1 为什么选择 Python FastAPI

- ✅ AI 时代最佳服务端语言,与 AI 框架无缝集成
- ✅ FastAPI 性能优秀,类型提示,自动生成 API 文档
- ✅ 学习曲线平缓,生态成熟
- ✅ 适合测试基建学习(pytest 功能强大)

### 7.2 为什么保留 Tauri

- ✅ 跨平台桌面应用,体积小(几 MB)
- ✅ Rust 后端保证性能和安全
- ✅ 窗口置顶等桌面特性支持
- ✅ 前后端分离,架构清晰

### 7.3 为什么使用 SQLite

- ✅ 轻量级,无需额外安装
- ✅ 适合个人学习项目
- ✅ 可迁移到 PostgreSQL(生产环境)

## 8. 影响测试的外部边界(需要 mock)

### 8.1 前端测试边界

1. **后端 API HTTP**: 集中在 `lib/api.ts` → 测试时 mock `apiFetch`
2. **平台适配**: web vs tauri 的差异
3. **本地存储**: localStorage + IndexedDB(测试需 fake)

### 8.2 后端测试边界

1. **数据库**: 使用内存数据库 `sqlite:///:memory:`
2. **密码加密**: bcrypt 可配置(测试时可用更快的算法)
3. **JWT**: 测试时可使用固定密钥

## 9. 部署方案

### 9.1 开发环境

```bash
# 后端
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 前端
cd frontend
npm install
npm run dev  # Web 模式
# 或
npm run desktop  # 桌面模式
```

### 9.2 生产环境

**后端部署**:
- Docker 容器化
- 或 Serverless(AWS Lambda / 阿里云函数计算)
- 数据库迁移到 PostgreSQL

**前端部署**:
- Web 版:Vite 构建 + CDN
- 桌面版:Tauri 打包 NSIS 安装包

## 10. 与需求 / 打包的衔接

- 需求规格与验收条件:见 `specs/requirements.md`。
- 构建与打包流程:见 `docs/build.md`(需更新)。
