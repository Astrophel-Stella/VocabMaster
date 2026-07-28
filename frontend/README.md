# VocabMaster 📚

跨平台英语单词学习助手：**单词展示 → 发音学习 → 标记已掌握 → 进度追踪**。

- **v1 桌面版**：Windows（Tauri），同一套代码可扩展到 Mac / Linux / Web / 移动端
- **词库丰富**：高考英语、考研英语、生活英语等多个词库可选
- **学习高效**：小窗口可置顶，随时随地学习

> 详细设计见 [`specs/requirements.md`](../specs/requirements.md)、[`docs/architecture.md`](../docs/architecture.md)。

---

## 架构一览

```
共享层 (React + TypeScript, ~99% 复用)
  components / hooks / stores / providers(AI) / lib
                     │
        adapters/ (平台原生能力接口，隔离差异)
        ┌──────────┼───────────────┐
      Tauri        Web           RN(后续)
     (桌面)       (网页)         (移动)

AI：前端通过 HTTPS 直连 Groq / OpenAI（无需打包 Python 后端）
密钥：用户自填，仅存本地
```

**为什么这样设计**：AI 能力本身就是 HTTPS 接口，前端可直连；不打包 Python 后端，
桌面包体积小（几 MB）、移动端能复用、Web 端无需服务器 —— 最大化跨平台复用。

---

## 快速开始

### 方式 A：Web 模式（最快，只需 Node.js）

适合快速体验和开发调试，浏览器里直接跑。

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 http://localhost:5173 → 登录/注册 → 选择词库 → 开始学习。

### 方式 B：桌面模式（Tauri，需 Rust）

打包成真正的 Windows 桌面应用，支持窗口置顶。

1. 安装 [Rust](https://www.rust-lang.org/tools/install)（Windows 会自动用 WebView2，Win11 已内置）
2. 生成应用图标（首次需要，任意一张 PNG 即可）：
   ```bash
   cd frontend
   npm install
   npx @tauri-apps/cli icon path/to/logo.png   # 生成 src-tauri/icons/*
   ```
3. 开发运行 / 打包：
   ```bash
   npm run desktop         # 开发模式（热更新）
   npm run desktop:build   # 打包安装包到 src-tauri/target/release/bundle
   ```

桌面版支持**窗口置顶**，方便随时学习。

---

## 使用流程

1. 🔐 **登录**：注册账号或登录已有账号
2. 📚 **选择词库**：高考英语、考研英语、生活英语等
3. 📖 **学习单词**：查看拼写、发音、音标
4. ✅ **标记掌握**：认识的单词打勾，系统记录进度
5. 📊 **查看进度**：已学/未学单词统计

---

## 项目结构

```
frontend/
├── src/
│   ├── adapters/        平台适配层（web / tauri 的 HTTP 差异）⭐ 跨平台关键
│   ├── providers/       API 调用封装
│   ├── hooks/           业务逻辑 hooks
│   ├── stores/          Zustand 状态（user / words / settings）
│   ├── lib/             db(存储) / format
│   ├── components/      UI 组件
│   ├── App.tsx          主界面组装
│   └── main.tsx
└── src-tauri/           Tauri 桌面壳（Rust，仅桌面构建用到）

backend/                  Python FastAPI 服务端
├── app/
│   ├── main.py          FastAPI 应用入口
│   ├── api/             API 路由（auth / words / progress）
│   ├── models/          数据库模型（SQLAlchemy）
│   ├── services/        业务逻辑
│   └── config.py        配置管理
└── requirements.txt
```

---

## 如何扩展

**添加新词库**：在数据库 `word_banks` 表中添加新词库，`words` 表添加单词数据。

**支持新平台**：在 `src/adapters/` 新增一个适配器实现 `PlatformAdapter` 接口
（如 React Native），业务层代码无需改动。

---

## v1 已知限制 / 后续

- 服务端使用 SQLite，适合个人使用；后续可迁移到 PostgreSQL
- 暂不支持发音功能（可集成 TTS API）
- 移动端为后续 React Native 阶段

---

## 技术栈

**前端**：React 18 · TypeScript · Vite · Tailwind CSS · Zustand · Tauri 2
**后端**：Python 3.10+ · FastAPI · SQLAlchemy · SQLite
**测试**：Vitest · Playwright · pytest
