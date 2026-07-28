import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getProvider, type ProviderId } from '@/providers'

export type LanguageOption = 'auto' | 'zh' | 'en'

interface SettingsState {
  providerId: ProviderId
  /** 各供应商的密钥分开存，切换时不丢失 */
  apiKeys: Record<ProviderId, string>
  sttModel: string
  llmModel: string
  language: LanguageOption

  setProvider: (id: ProviderId) => void
  setApiKey: (id: ProviderId, key: string) => void
  setSttModel: (m: string) => void
  setLlmModel: (m: string) => void
  setLanguage: (l: LanguageOption) => void

  /** 当前供应商的密钥 */
  currentKey: () => string
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      providerId: 'groq',
      apiKeys: { groq: '', openai: '' },
      sttModel: getProvider('groq').defaultSttModel,
      llmModel: getProvider('groq').defaultLlmModel,
      language: 'auto',

      setProvider: (id) => {
        const p = getProvider(id)
        // 切换供应商时，模型重置为该供应商默认值
        set({ providerId: id, sttModel: p.defaultSttModel, llmModel: p.defaultLlmModel })
      },
      setApiKey: (id, key) =>
        set((s) => ({ apiKeys: { ...s.apiKeys, [id]: key } })),
      setSttModel: (m) => set({ sttModel: m }),
      setLlmModel: (m) => set({ llmModel: m }),
      setLanguage: (l) => set({ language: l }),

      currentKey: () => {
        const s = get()
        return s.apiKeys[s.providerId] ?? ''
      },
    }),
    {
      name: 'airec.settings.v1',
    },
  ),
)
