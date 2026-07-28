import { create } from 'zustand'
import { listRecords, type RecordItem } from '@/lib/db'

export type RecStatus = 'idle' | 'recording' | 'paused'

interface AppState {
  // ── 录音会话状态 ──
  status: RecStatus
  elapsedMs: number

  // ── 记录列表 ──
  records: RecordItem[]
  selectedId: string | null

  // ── 全局提示 ──
  error: string | null
  toast: string | null

  setStatus: (s: RecStatus) => void
  setElapsed: (ms: number) => void
  refreshRecords: () => void
  upsertRecord: (r: RecordItem) => void
  removeRecord: (id: string) => void
  select: (id: string | null) => void
  selected: () => RecordItem | null
  setError: (e: string | null) => void
  setToast: (t: string | null) => void
}

export const useApp = create<AppState>((set, get) => ({
  status: 'idle',
  elapsedMs: 0,
  records: listRecords(),
  selectedId: null,
  error: null,
  toast: null,

  setStatus: (status) => set({ status }),
  setElapsed: (elapsedMs) => set({ elapsedMs }),

  refreshRecords: () => set({ records: listRecords() }),
  upsertRecord: (r) =>
    set((s) => {
      const others = s.records.filter((x) => x.id !== r.id)
      return { records: [r, ...others].sort((a, b) => b.createdAt - a.createdAt) }
    }),
  removeRecord: (id) =>
    set((s) => ({
      records: s.records.filter((r) => r.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  select: (selectedId) => set({ selectedId }),
  selected: () => {
    const s = get()
    return s.records.find((r) => r.id === s.selectedId) ?? null
  },

  setError: (error) => set({ error }),
  setToast: (toast) => set({ toast }),
}))
