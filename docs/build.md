# 构建与自动化指南（BUILD）

本项目的开发 / 测试 / 构建 / 上线全流程说明，以及为「未来全自动化」预留的口子。

---

## 自动化分层

```
本地脚本 (frontend/scripts/)   ← 一键：setup 自检
        ↓ 复用
npm scripts (frontend/)        ← 原子能力：dev / test / lint / typecheck / build / desktop:build
        ↓ 调用
GitHub Actions (.github/)      ← 全自动：push→CI，tag→构建打包→Release 草稿
        ↓ 预留占位
mac / linux / web / 移动端      ← 注释占位，取消注释即启用
```

设计原则：**每一层只依赖下一层的能力**，任何一层都能单独手动跑，也能被上层自动编排。

---

## 常用命令（在 `frontend/` 目录）

| 命令 | 作用 |
|---|---|
| `npm run setup` | 环境自检（Node / Rust / MSVC 是否就绪） |
| `npm run dev` | Web 开发模式（浏览器，最快验证） |
| `npm run desktop` | 桌面开发模式（Tauri，热更新） |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run lint` | ESLint 检查 |
| `npm run test` | 单元测试（Vitest，跑一次） |
| `npm run test:watch` | 单测监听模式 |
| `npm run check` | typecheck + lint + test（提交前跑这个） |
| `npm run desktop:build` | 打包 Windows 安装包（`.msi` / `.exe`） |
| `npm run release:desktop` | check 通过后再打包（本地发布） |

---

## 本地全流程

```bash
cd frontend
npm install            # 首次；会生成 package-lock.json（请提交，CI 用 npm ci）
npm run setup          # 确认环境
npm run check          # 类型/lint/测试全绿
npm run desktop:build  # 产出安装包
```

构建产物位置：
- 可执行文件（免安装，可直接双击）：`frontend/src-tauri/target/release/ai-recorder.exe`
- 安装包（分发用）：`frontend/src-tauri/target/release/bundle/nsis/AI录音助手_<版本>_x64-setup.exe`

> ⚠️ 首次桌面构建需先生成图标：`npm run setup` 确认环境后，
> `node scripts/gen-icon.mjs && npx @tauri-apps/cli icon src-tauri/app-icon.png`
>
> ⚠️ **打包格式用 NSIS 而非 MSI**：应用名含中文（“AI录音助手”）时，WiX 的
> `light.exe` 会在生成 en-US 的 MSI 时失败（CJK 编码坑）。NSIS 对中文名支持良好，
> 已在 `src-tauri/tauri.conf.json` 的 `bundle.targets` 设为 `["nsis"]`。
> 若确需 MSI（企业域部署），需把 `productName` 改为纯 ASCII 名。

---

## 自动上线（GitHub Actions）

### CI（已启用）
`.github/workflows/ci.yml` —— push / PR 到 `main` 自动跑 typecheck + lint + test。

### 发布桌面版（已启用，Windows）
`.github/workflows/release.yml` —— 打 tag 触发：

```bash
git tag v0.1.0
git push origin v0.1.0
```

自动构建 Windows 安装包并创建 **Release 草稿**（人工确认后正式发布 = 上线闸门）。

### Web 部署（预留）
`.github/workflows/deploy-web.yml` —— 默认仅手动触发，构建静态产物。
部署目标（Pages / Vercel / Cloudflare）在文件内注释三选一。

---

## 预留口子清单（未来启用）

| 口子 | 位置 | 启用方式 |
|---|---|---|
| **mac / linux 桌面构建** | `release.yml` matrix | 取消注释对应 platform 行 |
| **Linux 系统依赖** | `release.yml` | 取消注释 apt-get 步骤 |
| **Web 自动部署** | `deploy-web.yml` | 取消注释 push 触发 + 选部署商 |
| **代码签名 / 自动更新** | `release.yml` env | 配 `TAURI_SIGNING_*` secrets |
| **新增 AI 供应商** | `src/providers/` | 加文件 + 注册进 `PROVIDERS` |
| **新增 AI 处理能力** | `src/lib/aiTasks.ts` | 往 `AI_TASKS` 加一项 |
| **新平台（React Native 等）** | `src/adapters/` | 实现 `PlatformAdapter` 接口 |
| **API 密钥代理层** | 新建 `backend/`（可选） | 对外分发时隐藏密钥，替换直连 |

---

## 版本与发布约定

- 版本号同时维护：`frontend/package.json` 与 `frontend/src-tauri/tauri.conf.json` 的 `version`。
  （后续可加脚本自动同步，口子：`scripts/bump-version.mjs`）
- tag 命名：`vX.Y.Z`，触发 `release.yml`。
- Release 默认草稿，确认无误再点发布。

---

## 生产 Web 版的密钥安全（重要）

当前 v1 密钥由用户自填、存本地，桌面版通过原生请求直连、密钥不入网页层。
但**生产 Web 版**若直连 AI 供应商会暴露密钥，需要一个**代理层**：

1. 新建 `backend/`（轻量：FastAPI / Node / Serverless 均可），保管密钥、转发请求。
2. 前端 `src/adapters/web.ts` 把 `/proxy/*` 指向该代理而非 Vite dev 代理。
3. 架构已为此预留：只改适配层，业务代码不动。
