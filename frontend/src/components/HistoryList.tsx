import type React from 'react'
import { useApp } from '@/stores/appStore'
import { deleteRecord, type RecordItem } from '@/lib/db'
import { formatDateTime, formatDuration } from '@/lib/format'
import { AI_TASKS } from '@/lib/aiTasks'

/** 录音历史列表。 */
export function HistoryList() {
  const records = useApp((s) => s.records)
  const selectedId = useApp((s) => s.selectedId)
  const select = useApp((s) => s.select)
  const removeRecord = useApp((s) => s.removeRecord)

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteRecord(id)
    removeRecord(id)
  }

  const exportMarkdown = (e: React.MouseEvent, r: RecordItem) => {
    e.stopPropagation()
    let md = `# 录音记录 ${formatDateTime(r.createdAt)}\n\n`
    md += `- 时长：${formatDuration(r.durationMs)}\n\n`
    md += `## 转写\n\n${r.transcript || '(无)'}\n\n`
    for (const t of AI_TASKS) {
      if (r.ai[t.id]) md += `## ${t.label}\n\n${r.ai[t.id]}\n\n`
    }
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `录音_${r.id.slice(0, 8)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (records.length === 0) {
    return (
      <div className="text-center text-slate-400 text-sm py-10">还没有录音记录</div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {records.map((r) => {
        const active = r.id === selectedId
        const aiCount = AI_TASKS.filter((t) => r.ai[t.id]).length
        return (
          <div
            key={r.id}
            onClick={() => select(r.id)}
            className={`group cursor-pointer rounded-xl border p-3 transition-colors ${
              active
                ? 'border-brand-300 bg-brand-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                {formatDateTime(r.createdAt)}
              </span>
              <span className="text-xs text-slate-400">{formatDuration(r.durationMs)}</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 truncate">
              {r.transcript || <span className="italic text-slate-300">未转写</span>}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {aiCount > 0 ? `已生成 ${aiCount} 项 AI 结果` : ''}
              </span>
              <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => exportMarkdown(e, r)}
                  className="text-[11px] px-1.5 py-0.5 rounded text-slate-500 hover:bg-white"
                >
                  导出
                </button>
                <button
                  onClick={(e) => handleDelete(e, r.id)}
                  className="text-[11px] px-1.5 py-0.5 rounded text-red-500 hover:bg-red-50"
                >
                  删除
                </button>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
