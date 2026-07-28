// 本地数据存储
// 元数据（录音信息、转写文本、AI 结果）-> localStorage（体积小、易读写）
// 音频二进制 Blob -> IndexedDB（避开 localStorage ~5MB 限制）
//
// 该层同样是「平台无关」的：Web 浏览器与 Tauri Webview 都原生支持这两个 API。
// 后续桌面端如需更强能力，可在 adapters 里替换为 Tauri SQL 插件，业务层无感知。

import type { ProviderId } from '@/providers'

export type AITaskType = 'summary' | 'keywords' | 'translate' | 'polish'

export interface RecordItem {
  id: string
  createdAt: number
  durationMs: number
  sizeBytes: number
  mime: string
  /** 转写文本 */
  transcript: string
  /** 转写语言 */
  language: string
  /** AI 处理结果，按任务类型存储 */
  ai: Partial<Record<AITaskType, string>>
  /** 记录使用的供应商与模型，便于追溯 */
  providerId?: ProviderId
  sttModel?: string
}

const META_KEY = 'airec.records.v1'
const DB_NAME = 'airec'
const DB_VERSION = 1
const AUDIO_STORE = 'audio'

// ────────────────── 元数据（localStorage） ──────────────────

export function listRecords(): RecordItem[] {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as RecordItem[]
    // 按时间倒序
    return arr.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

function persist(records: RecordItem[]): void {
  localStorage.setItem(META_KEY, JSON.stringify(records))
}

export function saveRecord(item: RecordItem): void {
  const all = listRecords()
  const idx = all.findIndex((r) => r.id === item.id)
  if (idx >= 0) all[idx] = item
  else all.push(item)
  persist(all)
}

export function updateRecord(id: string, patch: Partial<RecordItem>): RecordItem | null {
  const all = listRecords()
  const idx = all.findIndex((r) => r.id === id)
  if (idx < 0) return null
  all[idx] = { ...all[idx], ...patch, ai: { ...all[idx].ai, ...(patch.ai ?? {}) } }
  persist(all)
  return all[idx]
}

export async function deleteRecord(id: string): Promise<void> {
  persist(listRecords().filter((r) => r.id !== id))
  await deleteAudio(id).catch(() => {})
}

// ────────────────── 音频二进制（IndexedDB） ──────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function putAudio(id: string, blob: Blob): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE, 'readwrite')
    tx.objectStore(AUDIO_STORE).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getAudio(id: string): Promise<Blob | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE, 'readonly')
    const req = tx.objectStore(AUDIO_STORE).get(id)
    req.onsuccess = () => resolve((req.result as Blob) ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteAudio(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE, 'readwrite')
    tx.objectStore(AUDIO_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
