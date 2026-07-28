import { apiFetch } from '@/adapters'
import type {
  AIProvider,
  ChatMessage,
  ChatOptions,
  ProviderId,
  TranscribeOptions,
} from './types'

/**
 * OpenAI 兼容接口的通用实现。
 * Groq、OpenAI 等都遵循相同的 /audio/transcriptions 与 /chat/completions 协议，
 * 只是 baseUrl 与路径前缀不同，因此共用这套逻辑。
 */
export interface OpenAICompatibleConfig {
  id: ProviderId
  label: string
  free: boolean
  signupUrl: string
  baseUrl: string
  sttPath: string
  chatPath: string
  defaultSttModel: string
  defaultLlmModel: string
  sttModels: string[]
  llmModels: string[]
}

export function createOpenAICompatibleProvider(cfg: OpenAICompatibleConfig): AIProvider {
  return {
    id: cfg.id,
    label: cfg.label,
    free: cfg.free,
    signupUrl: cfg.signupUrl,
    defaultSttModel: cfg.defaultSttModel,
    defaultLlmModel: cfg.defaultLlmModel,
    sttModels: cfg.sttModels,
    llmModels: cfg.llmModels,

    async transcribe(audio: Blob, opts: TranscribeOptions): Promise<string> {
      if (!opts.apiKey) throw new Error('未配置 API 密钥，请先在「设置」中填写。')

      const form = new FormData()
      // Whisper 接口按文件名后缀推断格式，webm/opus 均支持
      form.append('file', audio, 'audio.webm')
      form.append('model', opts.model)
      form.append('response_format', 'json')
      if (opts.language && opts.language !== 'auto') {
        form.append('language', opts.language)
      }

      // 注意：multipart 请求不要手动设置 Content-Type，由运行时自动带上 boundary
      const res = await apiFetch(cfg.baseUrl + cfg.sttPath, {
        method: 'POST',
        headers: { Authorization: `Bearer ${opts.apiKey}` },
        body: form,
      })

      if (!res.ok) {
        throw new Error(`语音转写失败 (HTTP ${res.status})：${await safeText(res)}`)
      }
      const data = await res.json()
      return (data.text ?? '').trim()
    },

    async chat(messages: ChatMessage[], opts: ChatOptions): Promise<string> {
      if (!opts.apiKey) throw new Error('未配置 API 密钥，请先在「设置」中填写。')

      const res = await apiFetch(cfg.baseUrl + cfg.chatPath, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: opts.model,
          messages,
          temperature: opts.temperature ?? 0.3,
          max_tokens: opts.maxTokens ?? 1024,
        }),
      })

      if (!res.ok) {
        throw new Error(`AI 处理失败 (HTTP ${res.status})：${await safeText(res)}`)
      }
      const data = await res.json()
      return (data.choices?.[0]?.message?.content ?? '').trim()
    },
  }
}

async function safeText(res: { text(): Promise<string> }): Promise<string> {
  try {
    const t = await res.text()
    return t.slice(0, 300)
  } catch {
    return '(无法读取错误详情)'
  }
}
