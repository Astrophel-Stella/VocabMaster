# 架构设计(当前有效 · 单一真相源)

> 本文件是**当前唯一有效**的架构文档,对齐实际代码(Tauri + 纯前端直连 + Groq)。
> 历史上的 Electron + Python FastAPI 方案已废弃,存于 `docs/_archive/`,仅供参考。

## 1. 方案总述

**Tauri 2 + 前端为主(frontend-centric)+ 用户自填密钥**

- **共享层(约 99% 复用)**:React + TypeScript 承载全部 UI 与业务逻辑(录音、转写、AI 调用、状态、历史存储)。
- **平台适配层 `adapters/`**:隔离各平台原生能力差异(HTTP / 文件 / 存储)。
  - 桌面(Windows/Mac/Linux):**Tauri 2**(体积小,原生 HTTP 无 CORS)
  - 网页:同一套 React,Vite 构建(dev 用 Vite proxy 绕 CORS)
  - 移动(后续):React Native,复用 hooks/stores/providers,仅重写 adapter
- **AI 能力**:前端通过 HTTPS **直连** STT / LLM 提供商,**不打包 Python 后端**。
- **密钥**:用户在设置里自填,仅存本地;v1 零后端,对外分发时再加代理层。
- **存储**:元数据 → localStorage;音频 Blob → IndexedDB。

## 2. 分层(依据实际代码 `frontend/src/`)

依赖方向单向,自底向上:

| 层 | 目录 | 职责 | 关键文件 |
|---|---|---|---|
| 平台适配 | `adapters/` | 收敛平台差异,对上只暴露统一 `apiFetch` | `index.ts` / `platform.ts` / `web.ts` / `tauri.ts` |
| AI 供应商 | `providers/` | STT + LLM 统一抽象,一键切换 | **`openaiCompatible.ts`(核心 HTTP)** / `index.ts` / `groq.ts` / `openai.ts` |
| 本地存储 | `lib/db.ts` | 元数据→localStorage,音频→IndexedDB | `lib/db.ts` |
| 纯工具/领域 | `lib/` | 格式化 + AI 任务 prompt 注册表 | `lib/format.ts` / `lib/aiTasks.ts` |
| 状态管理 | `stores/` | Zustand(会话状态 + 设置持久化) | `appStore.ts` / `settingsStore.ts` |
| 业务编排 | `hooks/` | 把 store+provider+db 编排成用例 | `useRecorder.ts` / `useTranscription.ts` / `useAIProcessing.ts` |
| UI | `components/` `App.tsx` | 展示层,只调 hooks/stores | 5 个 Panel |

## 3. 关键决策

- **为什么不打包 Python 后端**:桌面打包重(150MB+)、移动端跑不了、Web 需部署服务器——都与"跨平台通用"冲突。AI 本身是 HTTPS 接口,前端可直连。
- **默认 Provider = Groq**(免费额度充足,OpenAI 兼容):STT `whisper-large-v3-turbo`,LLM `llama-3.3-70b-versatile`;备选 OpenAI(付费)。
- **AI 任务注册表 `lib/aiTasks.ts`**:加一条 = 加一种 AI 能力,UI 自动出按钮。

## 4. Rust 后端定位

`src-tauri` 是**薄壳**:仅注册 `tauri-plugin-http` 并启动,**无自定义 command、无业务逻辑**。
测试重心因此全部在 TS 侧;Rust 侧在出现真实逻辑(如自定义 command)前不需要单测/变异测试。

## 5. 影响测试的外部边界(需要 mock)

1. **AI 供应商 HTTP**(最关键):集中在 `providers/openaiCompatible.ts` → 测试时 mock `adapters` 的 `apiFetch`。
2. **平台适配**:web vs tauri 的差异。
3. **录音 API**:`navigator.mediaDevices.getUserMedia` / `MediaRecorder`(测试环境需假实现)。
4. **本地存储**:localStorage + IndexedDB(测试需 fake)。

## 6. 与需求 / 打包的衔接

- 需求规格与验收条件:见 `specs/requirements.md`。
- 构建与打包流程:见 `docs/build.md`。
