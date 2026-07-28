import { detectPlatform } from './platform'
import { webAdapter } from './web'
import { tauriAdapter } from './tauri'
import type { ApiRequestInit, PlatformAdapter } from './types'

let _adapter: PlatformAdapter | null = null

/** 获取当前平台适配器（单例） */
export function getAdapter(): PlatformAdapter {
  if (_adapter) return _adapter
  _adapter = detectPlatform() === 'tauri' ? tauriAdapter : webAdapter
  return _adapter
}

/** 业务层统一使用的 AI 请求入口 */
export function apiFetch(url: string, options?: ApiRequestInit) {
  return getAdapter().apiFetch(url, options)
}

export * from './types'
