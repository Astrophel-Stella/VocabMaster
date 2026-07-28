import { useCallback, useState } from 'react'
import { getProvider } from '@/providers'
import { useSettings } from '@/stores/settingsStore'
import { updateRecord, type AITaskType } from '@/lib/db'
import { useApp } from '@/stores/appStore'
import { AI_TASKS } from '@/lib/aiTasks'

// AI 文本处理 Hook：按任务类型构建 prompt -> 调用当前供应商 LLM -> 写回记录。
export function useAIProcessing() {
  const [runningTask, setRunningTask] = useState<AITaskType | null>(null)
  const settings = useSettings()
  const upsertRecord = useApp((s) => s.upsertRecord)
  const setError = useApp((s) => s.setError)
  const setToast = useApp((s) => s.setToast)

  const run = useCallback(
    async (recordId: string, task: AITaskType, transcript: string): Promise<string | null> => {
      if (!transcript.trim()) {
        setError('请先完成语音转写，再进行 AI 处理。')
        return null
      }
      setRunningTask(task)
      setError(null)
      try {
        const def = AI_TASKS.find((t) => t.id === task)
        if (!def) throw new Error(`未知任务类型：${task}`)

        const provider = getProvider(settings.providerId)
        const result = await provider.chat(def.buildMessages(transcript, settings.language), {
          apiKey: settings.currentKey(),
          model: settings.llmModel,
        })

        const updated = updateRecord(recordId, { ai: { [task]: result } })
        if (updated) upsertRecord(updated)
        setToast(`${def.label}完成`)
        return result
      } catch (e: any) {
        setError(e?.message || String(e))
        return null
      } finally {
        setRunningTask(null)
      }
    },
    [settings, upsertRecord, setError, setToast],
  )

  return { run, runningTask }
}
