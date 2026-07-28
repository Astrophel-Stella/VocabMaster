import { createOpenAICompatibleProvider } from './openaiCompatible'
import type { AIProvider } from './types'

/**
 * Groq —— v1 默认免费方案。
 * 免费额度充足，提供 Whisper 语音转写 + Llama 系列大模型，均为 OpenAI 兼容接口。
 * 申请密钥：https://console.groq.com/keys
 */
export const groqProvider: AIProvider = createOpenAICompatibleProvider({
  id: 'groq',
  label: 'Groq（免费推荐）',
  free: true,
  signupUrl: 'https://console.groq.com/keys',
  baseUrl: 'https://api.groq.com',
  sttPath: '/openai/v1/audio/transcriptions',
  chatPath: '/openai/v1/chat/completions',
  defaultSttModel: 'whisper-large-v3-turbo',
  defaultLlmModel: 'llama-3.3-70b-versatile',
  sttModels: ['whisper-large-v3-turbo', 'whisper-large-v3'],
  llmModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-20b'],
})
