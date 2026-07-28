// AI Provider 抽象层
// 目标：STT（语音转文字）与 LLM（文本处理）统一接口，支持一键切换供应商。

export type ProviderId = 'groq' | 'openai'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface TranscribeOptions {
  apiKey: string
  model: string
  /** ISO-639-1，如 'zh' / 'en'；'auto' 或空则自动检测 */
  language?: string
}

export interface ChatOptions {
  apiKey: string
  model: string
  temperature?: number
  maxTokens?: number
}

export interface AIProvider {
  readonly id: ProviderId
  readonly label: string
  /** 是否免费额度友好（用于 UI 标注） */
  readonly free: boolean
  readonly signupUrl: string
  readonly defaultSttModel: string
  readonly defaultLlmModel: string
  readonly sttModels: string[]
  readonly llmModels: string[]

  /** 语音转文字 */
  transcribe(audio: Blob, opts: TranscribeOptions): Promise<string>
  /** 对话补全（文本处理） */
  chat(messages: ChatMessage[], opts: ChatOptions): Promise<string>
}
