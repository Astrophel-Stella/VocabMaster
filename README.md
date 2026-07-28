# AI 录音助手(AI Voice Assistant)

跨平台 AI 录音助手:实时录音 → 语音转文字(STT)→ AI 文本处理。
技术栈:**Tauri 2 + React/TypeScript 前端直连 + Groq**。

## 文档导航

本项目文档分两类,职责清晰:

| 目录 | 类别 | 内容 |
|---|---|---|
| `specs/` | **需求文档** | `requirements.md` — 可追溯的需求规格(ID + 验收条件 + 状态 + 测试锚点) |
| `docs/` | **项目技术文档** | `architecture.md`(架构 · 单一真相源)、`build.md`(构建打包)、`_archive/`(废弃方案存档) |

> 个人学习文档不在本仓库,位于工作区 `../learning/`。

## 代码

- `frontend/` — 前端(React/TS)+ `src-tauri/`(Tauri 薄壳)。开发/构建见 `docs/build.md`。

## 质量基建(建设中)

按四类基建推进:需求基建(`specs/`)、研发基建(`CLAUDE.md`,建设中)、测试基建(门禁/变异/E2E,建设中)、打包基建(`docs/build.md` + 版本同步,建设中)。
