import { groqProvider } from './groq'
import { openaiProvider } from './openai'
import type { AIProvider, ProviderId } from './types'

/** 已注册的 AI 供应商。新增供应商只需在这里加一行。 */
export const PROVIDERS: Record<ProviderId, AIProvider> = {
  groq: groqProvider,
  openai: openaiProvider,
}

export const PROVIDER_LIST: AIProvider[] = Object.values(PROVIDERS)

export function getProvider(id: ProviderId): AIProvider {
  return PROVIDERS[id] ?? groqProvider
}

export * from './types'
