import { useEffect, useState } from 'react'
import { useApp } from '@/stores/appStore'
import { getAdapter } from '@/adapters'
import { RecordingPanel } from '@/components/RecordingPanel'
import { TranscriptionView } from '@/components/TranscriptionView'
import { AIProcessingPanel } from '@/components/AIProcessingPanel'
import { HistoryList } from '@/components/HistoryList'
import { SettingsPanel } from '@/components/SettingsPanel'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const error = useApp((s) => s.error)
  const toast = useApp((s) => s.toast)
  const setError = useApp((s) => s.setError)
  const setToast = useApp((s) => s.setToast)

  // toast 自动消失
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast, setToast])

  const platform = getAdapter().name

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-900">
      {/* 顶栏 */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎙️</span>
          <h1 className="text-lg font-semibold">AI 录音助手</h1>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
            {platform === 'tauri' ? '桌面版' : 'Web'} · v0.1
          </span>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-sm px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200"
        >
          ⚙ 设置
        </button>
      </header>

      {/* 主体：左侧工作区 + 右侧历史 */}
      <main className="flex-1 overflow-hidden flex">
        <section className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          <RecordingPanel />
          <TranscriptionView />
          <AIProcessingPanel />
        </section>

        <aside className="w-80 shrink-0 border-l border-slate-200 bg-slate-50 overflow-y-auto p-4">
          <h2 className="text-sm font-medium text-slate-500 mb-3 px-1">录音历史</h2>
          <HistoryList />
        </aside>
      </main>

      {/* 错误提示 */}
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-md">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow">
            <span className="text-sm flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-slate-800 text-white text-sm px-4 py-2 rounded-lg shadow">
            {toast}
          </div>
        </div>
      )}

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
