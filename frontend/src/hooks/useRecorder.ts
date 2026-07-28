import { useCallback, useRef } from 'react'
import { useApp } from '@/stores/appStore'
import { genId } from '@/lib/format'
import { putAudio, saveRecord, type RecordItem } from '@/lib/db'

// 录音管理 Hook：基于浏览器 / Webview 通用的 MediaRecorder API。
// 桌面(Tauri)与 Web 使用同一套实现 —— 这正是「前端为主」架构的复用点。

function pickMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c
  }
  return ''
}

export function useRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTsRef = useRef(0)
  const accumRef = useRef(0) // 已录制累计时长（用于暂停/恢复）
  const timerRef = useRef<number | null>(null)

  const setStatus = useApp((s) => s.setStatus)
  const setElapsed = useApp((s) => s.setElapsed)
  const upsertRecord = useApp((s) => s.upsertRecord)
  const select = useApp((s) => s.select)
  const setError = useApp((s) => s.setError)

  const stopTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startTimer = () => {
    stopTimer()
    timerRef.current = window.setInterval(() => {
      setElapsed(accumRef.current + (Date.now() - startTsRef.current))
    }, 200)
  }

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    recorderRef.current = null
  }

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = pickMimeType()
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorderRef.current = rec
      accumRef.current = 0
      startTsRef.current = Date.now()
      rec.start(250) // 每 250ms 触发一次 dataavailable
      setStatus('recording')
      setElapsed(0)
      startTimer()
    } catch (e: any) {
      const msg =
        e?.name === 'NotAllowedError'
          ? '麦克风权限被拒绝，请在系统设置中允许访问麦克风。'
          : `无法启动录音：${e?.message || e}`
      setError(msg)
      cleanupStream()
      setStatus('idle')
    }
  }, [setError, setStatus, setElapsed, upsertRecord, select])

  const pause = useCallback(() => {
    const rec = recorderRef.current
    if (rec && rec.state === 'recording') {
      rec.pause()
      accumRef.current += Date.now() - startTsRef.current
      stopTimer()
      setStatus('paused')
    }
  }, [setStatus])

  const resume = useCallback(() => {
    const rec = recorderRef.current
    if (rec && rec.state === 'paused') {
      rec.resume()
      startTsRef.current = Date.now()
      startTimer()
      setStatus('recording')
    }
  }, [setStatus])

  const cancel = useCallback(() => {
    const rec = recorderRef.current
    if (rec) {
      rec.onstop = null
      try {
        if (rec.state !== 'inactive') rec.stop()
      } catch {
        /* ignore */
      }
    }
    stopTimer()
    cleanupStream()
    chunksRef.current = []
    accumRef.current = 0
    setStatus('idle')
    setElapsed(0)
  }, [setStatus, setElapsed])

  /** 停止并保存录音，返回新建的记录 */
  const stop = useCallback((): Promise<RecordItem | null> => {
    return new Promise((resolve) => {
      const rec = recorderRef.current
      if (!rec) {
        resolve(null)
        return
      }
      rec.onstop = async () => {
        stopTimer()
        const durationMs = accumRef.current + (Date.now() - startTsRef.current)
        const type = chunksRef.current[0]?.type || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        cleanupStream()

        const item: RecordItem = {
          id: genId(),
          createdAt: Date.now(),
          durationMs,
          sizeBytes: blob.size,
          mime: blob.type,
          transcript: '',
          language: '',
          ai: {},
        }
        try {
          await putAudio(item.id, blob)
          saveRecord(item)
          upsertRecord(item)
          select(item.id)
        } catch (e: any) {
          setError(`保存录音失败：${e?.message || e}`)
        }
        chunksRef.current = []
        accumRef.current = 0
        setStatus('idle')
        setElapsed(0)
        resolve(item)
      }
      try {
        rec.stop()
      } catch {
        resolve(null)
      }
    })
  }, [setStatus, setElapsed, upsertRecord, select, setError])

  return { start, pause, resume, cancel, stop }
}
