# 0003. 默认 AI Provider 选 Groq

- 状态: **已废弃**（不适用于 VocabMaster 项目）
- 日期: 2026-07-22(原决策日期)
- 废弃日期: 2026-07-28

## 背景

此决策来自 AI 录音助手项目（AI_Voice_Translate_project），不适用于 VocabMaster 项目。

VocabMaster 是单词学习应用，**没有 AI 能力需求**。

## 原决策（已废弃）

**默认 Provider = Groq**(OpenAI 兼容接口):
- STT:`whisper-large-v3-turbo`
- LLM:`llama-3.3-70b-versatile`

## 废弃原因

1. **功能不符**：VocabMaster 需求中没有 AI 相关功能（无 REQ-AI 系列）
2. **架构不符**：VocabMaster 采用前后端分离架构，不直连 AI Provider
3. **测试需求不同**：不需要 mock AI API，而是 mock 后端 HTTP API

## 影响

- 此 ADR 不再作为 VocabMaster 项目的决策依据
- 如后续需要增加 AI 功能（如智能单词推荐），应新建 ADR 讨论
- 当前项目无 AI 能力，AI 执行时不应引用此 ADR
