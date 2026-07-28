import { useApp } from '@/stores/appStore'
import { useSettings } from '@/stores/settingsStore'
import { formatDuration } from '@/lib/format'
import { useRecorder } from '@/hooks/useRecorder'
import { useTranscription } from '@/hooks/useTranscription'

/** 顶部录音控制面板：开始 / 暂停 / 停止，停止后自动转写。 */
export function RecordingPanel() {
  const status = useApp((s) => s.status)
  const elapsedMs = useApp((s) => s.elapsedMs)
  const { start, pause, resume, cancel, stop } = useRecorder()
  const { transcribe, loading: transcribing } = useTranscription()
  const hasKey = useSettings((s) => !!s.currentKey())

  const isIdle = status === 'idle'
  const isRecording = status === 'recording'
  const isPaused = status === 'paused'

  const handleStop = async () => {
    const rec = await stop()
    if (rec) {
      // 录音结束后自动触发转写（有密钥时）
      if (hasKey) void transcribe(rec.id)
    }
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col items-center gap-4">
        {/* 时长 / 状态 */}
        <div className="text-center">
          <div className="text-4xl font-mono font-semibold text-slate-800 tabular-nums">
            {formatDuration(elapsedMs)}
          </div>
          <div className="mt-1 text-sm text-slate-500 h-5">
            {isRecording && (
              <span className="inline-flex items-center gap-2 text-red-500">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> 录音中…
              </span>
            )}
            {isPaused && <span className="text-amber-500">已暂停</span>}
            {isIdle && transcribing && <span className="text-brand-600">正在转写…</span>}
            {isIdle && !transcribing && '准备就绪'}
          </div>
        </div>

        {/* 主按钮 */}
        <div className="flex items-center gap-3">
          {isIdle && (
            <button
              onClick={start}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl transition-transform hover:scale-105 ${
                isRecording ? 'recording-pulse' : ''
              } bg-red-500 hover:bg-red-600`}
              title="开始录音"
            >
              🎤
            </button>
          )}

          {(isRecording || isPaused) && (
            <>
              <button
                onClick={cancel}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200"
                title="取消（不保存）"
              >
                取消
              </button>

              {isRecording ? (
                <button
                  onClick={pause}
                  className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium"
                >
                  暂停
                </button>
              ) : (
                <button
                  onClick={resume}
                  className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium"
                >
                  继续
                </button>
              )}

              <button
                onClick={handleStop}
                className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center text-xl"
                title="停止并保存"
              >
                ⏹
              </button>
            </>
          )}
        </div>

        {!hasKey && (
          <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
            尚未配置 API 密钥，录音可保存但无法自动转写 —— 请在右上角「设置」中填写。
          </p>
        )}
      </div>
    </div>
  )
}
