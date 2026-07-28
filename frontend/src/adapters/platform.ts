import type { PlatformName } from './types'

/**
 * 运行时平台探测。
 * Tauri 2 会在 window 上注入 __TAURI_INTERNALS__。
 */
export function detectPlatform(): PlatformName {
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    return 'tauri'
  }
  return 'web'
}
