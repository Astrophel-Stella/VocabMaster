import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/stores/appStore'
import { useSettings } from '@/stores/settingsStore'
import { useTranscription } from '@/hooks/useTranscription'
import { getAudio, updateRecord } from '@/lib/db'
import { formatDateTime, formatDuration } from '@/lib/format'

/** 转写结果显示与编辑区（针对当前选中的记录）。 */
export function TranscriptionView() {
  const selectedId = useApp((s) => s.selectedId)
  const record = useApp((s) => s.records.find((r) => r.id === s.selectedId) ?? null)
  const upsertRecord = useApp((s) => s.upsertRecord)
  const hasKey = useSettings((s) => !!s.currentKey())
  const { transcribe, loading } = useTranscription()

  const [draft, setDraft] = useState('')
  const audioUrlRef = useRef<string | null>(null)

  // 切换记录时同步草稿
  useEffect(() => {
    setDraft(record?.transcript ?? '')
  }, [selectedId, record?.transcript])

  // 清理上一个音频 URL
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    }
  }, [])

  if (!record) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center text-slate-400">
        从下方历史中选择一条记录，或开始新的录音。
      </div>
    )
  }

  const saveDraft = () => {
    if (draft !== record.transcript) {
      const updated = updateRecord(record.id, { transcript: draft })
      if (updated) upsertRecord(updated)
    }
  }

  const play = async () => {
    const blob = await getAudio(record.id)
    if (!blob) return
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    audioUrlRef.current = URL.createObjectURL(blob)
    new Audio(audioUrlRef.current).play().catch(() => {})
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {formatDateTime(record.createdAt)} · {formatDuration(record.durationMs)}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={play}
            className="text-sm px-2.5 py-1 rounded-md hover:bg-slate-100 text-slate-600"
            title="播放录音"
          >
            ▶ 播放
          </button>
          <button
            onClick={() => transcribe(record.id)}
            disabled={loading || !hasKey}
            className="text-sm px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-50"
          >
            {loading ? '转写中…' : record.transcript ? '重新转写' : '转写'}
          </button>
        </div>
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={saveDraft}
        placeholder={loading ? '正在识别语音…' : '转写文本会显示在这里，可直接编辑修正。'}
        className="w-full min-h-[140px] resize-y rounded-lg border border-slate-200 p-3 text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500/40"
      />

      <div className="flex justify-end">
        <button
          onClick={() => navigator.clipboard?.writeText(draft)}
          className="text-xs px-2.5 py-1 rounded-md text-slate-500 hover:bg-slate-100"
        >
          复制文本
        </button>
      </div>
    </div>
  )
}
