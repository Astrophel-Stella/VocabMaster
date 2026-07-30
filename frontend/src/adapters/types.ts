// 平台适配层接口定义
// 目标：把「各平台原生能力差异」收敛到这一层，业务代码只依赖这个接口。
// v1 只需要一个统一的 AI HTTP 请求入口（不同平台绕 CORS / 走原生请求的方式不同）。

export type PlatformName = 'tauri' | 'web'

export interface ApiRequestInit {
  method?: string
  headers?: Record<string, string>
  body?: BodyInit | FormData
}

/** 兼容 Web fetch 的 Response 与 Tauri plugin-http 的返回 */
export interface ApiResponse {
  ok: boolean
  status: number
  headers?: {
    get(name: string): string | null
  }
  json(): Promise<any>
  text(): Promise<string>
  blob?(): Promise<Blob>
}

export interface PlatformAdapter {
  readonly name: PlatformName
  readonly isDesktop: boolean
  /** 统一的 AI 接口请求入口。桌面走原生 HTTP（无 CORS），Web 走 dev 代理。 */
  apiFetch(url: string, options?: ApiRequestInit): Promise<ApiResponse>
}
