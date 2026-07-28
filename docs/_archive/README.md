# 已归档文档(废弃,仅供参考)

本目录下的文档描述的是**早期已废弃的方案**,不再作为有效依据。保留仅为追溯历史决策。

| 文件 | 为什么废弃 | 现在看哪里 |
|---|---|---|
| `需求文档_v1.md` | 无 ID/无验收条件,且技术栈(Electron + Python FastAPI + Whisper/Claude)已过时 | `specs/requirements.md` |
| `架构设计_v1.md` | 顶部是有效决策(已提炼),但下半段仍描述废弃的 Electron/FastAPI 方案,自相矛盾 | `docs/architecture.md` |
| `API选型与成本_v1.md` | 基于旧的 OpenAI/Claude/Google 直连后端方案;当前默认 Groq 前端直连 | `docs/architecture.md` §3 |

> 有效的技术栈:**Tauri 2 + React/TS 前端直连 + Groq**。任何与此冲突的表述以 `docs/architecture.md` 为准。
