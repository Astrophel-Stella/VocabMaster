# 0002. 前端为主,不打包 Python 后端

- 状态: **已废弃**（被 0005 取代，不适用于 VocabMaster 项目）
- 日期: 2026-07-22(原决策日期)
- 废弃日期: 2026-07-28

## 背景

此决策来自 AI 录音助手项目（AI_Voice_Translate_project），不适用于 VocabMaster 项目。

VocabMaster 是单词学习应用，采用**前后端分离架构**，有 Python FastAPI 后端。

## 原决策（已废弃）

**v1 不打包 Python 后端**; 前端通过 HTTPS **直连** STT / LLM 供应商。

## 废弃原因

1. **项目类型不同**：AI 录音助手是 Copilot 应用（前端直连 AI），VocabMaster 是传统 Web 应用（前后端分离）
2. **架构不同**：VocabMaster 需要后端处理用户认证、词库管理、进度追踪
3. **数据存储不同**：VocabMaster 需要数据库（SQLite）持久化用户数据

## 替代方案

参见 ADR-0005《选择前后端分离架构》

## 影响

- 此 ADR 不再作为 VocabMaster 项目的决策依据
- AI 执行时应引用 ADR-0005 而非本 ADR
