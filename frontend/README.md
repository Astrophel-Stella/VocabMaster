# AI 录音助手 🎙️

跨平台 AI 录音助手：**录音 → 语音转文字 → AI 处理（摘要 / 关键词 / 翻译 / 润色）**。

- **v1 桌面版**：Windows（Tauri），同一套代码可扩展到 Mac / Linux / Web / 移动端
- **免费起步**：默认接入 [Groq](https://console.groq.com)（免费额度，Whisper 转写 + Llama 大模型）
- **可替换**：AI 供应商可插拔，一行配置切换到 OpenAI 等

> 详细设计见 [`需求文档_v1.md`](../需求文档_v1.md)、[`架构设计_v1.md`](../架构设计_v1.md)、[`API选型与成本_v1.md`](../API选型与成本_v1.md)。

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

### 前置：申请一个免费密钥（1 分钟）

1. 打开 https://console.groq.com/keys ，用 Google/GitHub 登录
2. 创建 API Key，复制备用（形如 `gsk_...`）

> 也可用 OpenAI（付费）：https://platform.openai.com/api-keys

### 方式 A：Web 模式（最快，只需 Node.js）

适合快速体验和开发调试，浏览器里直接跑。

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 http://localhost:5173 → 点右上「设置」填入密钥 → 开始录音。

> Web 开发模式通过 Vite 代理转发 AI 请求以绕过浏览器 CORS（见 `vite.config.ts`）。

### 方式 B：桌面模式（Tauri，需 Rust）

打包成真正的 Windows 桌面应用。

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

桌面版通过 Rust 侧原生 HTTP 直连 AI 供应商，**无 CORS 限制，密钥不暴露在网页层**。

---

## 使用流程

1. ⚙ **设置**：选供应商（默认 Groq）、填密钥、选模型与语言
2. 🎤 **录音**：点麦克风开始，可暂停/继续，⏹ 停止后自动转写
3. ✍️ **转写**：结果可直接编辑修正；可「重新转写」「播放」
4. 🤖 **AI 处理**：一键 摘要 / 关键词 / 翻译 / 润色
5. 📋 **历史**：右侧列表查看、导出 Markdown、删除

---

## 项目结构

```
frontend/
├── src/
│   ├── adapters/        平台适配层（web / tauri 的 HTTP 差异）⭐ 跨平台关键
│   ├── providers/       AI 供应商抽象（groq / openai，可插拔）⭐
│   ├── hooks/           录音 / 转写 / AI 处理 业务逻辑
│   ├── stores/          Zustand 状态（settings 持久化 / app 运行时）
│   ├── lib/             db(存储) / aiTasks(任务定义) / format
│   ├── components/      UI 组件
│   ├── App.tsx          主界面组装
│   └── main.tsx
└── src-tauri/           Tauri 桌面壳（Rust，仅桌面构建用到）
```

---

## 如何扩展

**加一个 AI 供应商**：在 `src/providers/` 新建文件调用 `createOpenAICompatibleProvider`
（若为 OpenAI 兼容接口），再注册进 `providers/index.ts` 的 `PROVIDERS`。

**加一种 AI 处理能力**：在 `src/lib/aiTasks.ts` 的 `AI_TASKS` 加一个条目，
配好 prompt —— UI 会自动出现对应按钮。

**支持新平台**：在 `src/adapters/` 新增一个适配器实现 `PlatformAdapter` 接口
（如 React Native），业务层代码无需改动。

---

## v1 已知限制 / 后续

- 密钥保存在本地存储，明文。对外公开分发前应加**代理层**隐藏密钥（架构已预留）。
- Web 生产版需要真实反代（dev 用的是 Vite 代理）。
- 转写是「录完再转」，暂不支持边录边转（实时流式）。
- 桌面文件存储走 Webview 的 IndexedDB；后续可换 Tauri SQL 插件增强。
- Mac 端需在 `Info.plist` 补麦克风权限声明；移动端为后续 React Native 阶段。

---

## 技术栈

React 18 · TypeScript · Vite · Tailwind CSS · Zustand · Tauri 2 · Groq / OpenAI API
