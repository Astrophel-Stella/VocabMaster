import { createOpenAICompatibleProvider } from './openaiCompatible'
import type { AIProvider } from './types'

/**
 * OpenAI —— 付费备选方案（质量高、生态大）。
 * 申请密钥：https://platform.openai.com/api-keys
 */
export const openaiProvider: AIProvider = createOpenAICompatibleProvider({
  id: 'openai',
  label: 'OpenAI（付费）',
  free: false,
  signupUrl: 'https://platform.openai.com/api-keys',
  baseUrl: 'https://api.openai.com',
  sttPath: '/v1/audio/transcriptions',
  chatPath: '/v1/chat/completions',
  defaultSttModel: 'whisper-1',
  defaultLlmModel: 'gpt-4o-mini',
  sttModels: ['whisper-1', 'gpt-4o-mini-transcribe'],
  llmModels: ['gpt-4o-mini', 'gpt-4o'],
})
