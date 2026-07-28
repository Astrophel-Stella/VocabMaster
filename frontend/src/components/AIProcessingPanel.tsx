import { useApp } from '@/stores/appStore'
import { useSettings } from '@/stores/settingsStore'
import { useAIProcessing } from '@/hooks/useAIProcessing'
import { AI_TASKS } from '@/lib/aiTasks'

/** AI 文本处理面板：一键摘要 / 关键词 / 翻译 / 润色。 */
export function AIProcessingPanel() {
  const record = useApp((s) => s.records.find((r) => r.id === s.selectedId) ?? null)
  const hasKey = useSettings((s) => !!s.currentKey())
  const { run, runningTask } = useAIProcessing()

  if (!record) return null

  const disabled = !record.transcript.trim() || !hasKey

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col gap-4">
      <div className="text-sm font-medium text-slate-700">AI 处理</div>

      <div className="flex flex-wrap gap-2">
        {AI_TASKS.map((task) => (
          <button
            key={task.id}
            onClick={() => run(record.id, task.id, record.transcript)}
            disabled={disabled || runningTask !== null}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-brand-50 hover:border-brand-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title={task.desc}
          >
            <span className="mr-1">{task.icon}</span>
            {runningTask === task.id ? '处理中…' : task.label}
          </button>
        ))}
      </div>

      {disabled && (
        <p className="text-xs text-slate-400">
          {!hasKey ? '请先在「设置」中配置 API 密钥。' : '请先完成语音转写。'}
        </p>
      )}

      {/* 结果展示 */}
      <div className="flex flex-col gap-3">
        {AI_TASKS.filter((t) => record.ai[t.id]).map((t) => (
          <div key={t.id} className="rounded-lg bg-slate-50 border border-slate-100 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-500">
                {t.icon} {t.label}
              </span>
              <button
                onClick={() => navigator.clipboard?.writeText(record.ai[t.id] ?? '')}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                复制
              </button>
            </div>
            <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {record.ai[t.id]}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
