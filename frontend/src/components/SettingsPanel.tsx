import { useSettings } from '@/stores/settingsStore'
import { PROVIDER_LIST, getProvider, type ProviderId } from '@/providers'

interface Props {
  open: boolean
  onClose: () => void
}

/** 设置弹窗：选择供应商、填写密钥、选择模型与语言。 */
export function SettingsPanel({ open, onClose }: Props) {
  const s = useSettings()
  const provider = getProvider(s.providerId)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">设置</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">
            ✕
          </button>
        </div>

        {/* 供应商 */}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-600">AI 供应商</span>
          <select
            value={s.providerId}
            onChange={(e) => s.setProvider(e.target.value as ProviderId)}
            className="rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            {PROVIDER_LIST.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {/* 密钥 */}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-600">
            API 密钥
            <a
              href={provider.signupUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-2 text-xs text-brand-600 hover:underline"
            >
              免费申请 →
            </a>
          </span>
          <input
            type="password"
            value={s.apiKeys[s.providerId] ?? ''}
            onChange={(e) => s.setApiKey(s.providerId, e.target.value)}
            placeholder="粘贴你的 API Key（仅保存在本地）"
            className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          {/* STT 模型 */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-600">语音识别模型</span>
            <select
              value={s.sttModel}
              onChange={(e) => s.setSttModel(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              {provider.sttModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          {/* LLM 模型 */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-600">文本处理模型</span>
            <select
              value={s.llmModel}
              onChange={(e) => s.setLlmModel(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              {provider.llmModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* 语言 */}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-600">识别语言</span>
          <select
            value={s.language}
            onChange={(e) => s.setLanguage(e.target.value as any)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <option value="auto">自动检测</option>
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </label>

        <p className="text-xs text-slate-400 leading-relaxed">
          密钥仅保存在本机浏览器/应用存储中，不会上传。桌面版通过原生请求直连供应商，
          密钥不暴露在网页环境。
        </p>

        <button
          onClick={onClose}
          className="self-end px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
        >
          完成
        </button>
      </div>
    </div>
  )
}
