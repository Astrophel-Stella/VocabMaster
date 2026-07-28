import { useCallback, useState } from 'react'
import { getProvider } from '@/providers'
import { useSettings } from '@/stores/settingsStore'
import { getAudio, updateRecord } from '@/lib/db'
import { useApp } from '@/stores/appStore'

// 语音转文字 Hook：读取音频 Blob -> 调用当前供应商 STT -> 写回记录。
export function useTranscription() {
  const [loading, setLoading] = useState(false)
  const settings = useSettings()
  const upsertRecord = useApp((s) => s.upsertRecord)
  const setError = useApp((s) => s.setError)
  const setToast = useApp((s) => s.setToast)

  const transcribe = useCallback(
    async (recordId: string): Promise<string | null> => {
      setLoading(true)
      setError(null)
      try {
        const blob = await getAudio(recordId)
        if (!blob) throw new Error('找不到音频数据，可能已被清理。')

        const provider = getProvider(settings.providerId)
        const text = await provider.transcribe(blob, {
          apiKey: settings.currentKey(),
          model: settings.sttModel,
          language: settings.language,
        })

        const updated = updateRecord(recordId, {
          transcript: text,
          language: settings.language,
          providerId: settings.providerId,
          sttModel: settings.sttModel,
        })
        if (updated) upsertRecord(updated)
        setToast(text ? '转写完成' : '转写结果为空')
        return text
      } catch (e: any) {
        setError(e?.message || String(e))
        return null
      } finally {
        setLoading(false)
      }
    },
    [settings, upsertRecord, setError, setToast],
  )

  return { transcribe, loading }
}
