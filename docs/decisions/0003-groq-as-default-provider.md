# 0003. 默认 AI Provider 选 Groq

- 状态:已采纳
- 日期:2026-07-22(追溯自架构设计_v1 的 v1 决策)

## 背景

需要 STT(语音转文字)和 LLM(文本处理)两类 AI 能力,且希望初期低成本、易切换。

## 决策

**默认 Provider = Groq**(OpenAI 兼容接口):
- STT:`whisper-large-v3-turbo`
- LLM:`llama-3.3-70b-versatile`

备选 OpenAI(付费),通过 `providers/` 抽象一键切换。

## 理由

- **免费额度充足**,适合个人/初期。
- **OpenAI 兼容**:Groq 与 OpenAI 复用同一套 `openaiCompatible.ts` 实现,切换成本低。
- **抽象隔离**:`providers/index.ts` 注册表 + `types.ts` 接口,新增供应商 = 加一个配置文件。

## 后果

- ✅ 零成本起步,供应商可插拔。
- ⚠️ 依赖 Groq 可用性与额度政策;需保留 fallback(`getProvider` 有默认回退)。
- ⚠️ 测试须 mock `adapters` 的 `apiFetch`,覆盖密钥缺失/网络错误/空响应等分支(见 REQ-STT-004)。
