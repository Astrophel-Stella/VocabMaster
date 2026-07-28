import type { PlatformAdapter } from './types'

/**
 * 桌面端（Tauri）适配：使用 @tauri-apps/plugin-http 发起原生 HTTP 请求。
 * 优势：
 *  1. 不受浏览器 CORS 限制，可直连 Groq / OpenAI。
 *  2. 请求由 Rust 侧发出，API 密钥不暴露在网页 network 层面。
 *
 * plugin-http 通过动态 import 引入，保证纯 Web 构建时不会因缺少 Tauri 环境而报错。
 */
export const tauriAdapter: PlatformAdapter = {
  name: 'tauri',
  isDesktop: true,

  async apiFetch(url, options) {
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http')
    return await tauriFetch(url, options as any)
  },
}
