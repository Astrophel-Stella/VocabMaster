import type { PlatformAdapter } from './types'

/**
 * 把真实 API 域名改写为 Vite dev proxy 路径，绕过浏览器 CORS 限制。
 * 见 vite.config.ts 中的 server.proxy 配置。
 * 注意：这是「开发环境」方案；生产 Web 版需要部署真实代理（v1 不涉及）。
 */
function toProxyUrl(url: string): string {
  return url
    .replace('https://api.groq.com', '/proxy/groq')
    .replace('https://api.openai.com', '/proxy/openai')
}

export const webAdapter: PlatformAdapter = {
  name: 'web',
  isDesktop: false,

  async apiFetch(url, options) {
    const res = await fetch(toProxyUrl(url), options as RequestInit)
    return res
  },
}
