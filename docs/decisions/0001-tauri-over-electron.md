# 0001. 桌面框架选 Tauri 而非 Electron

- 状态:已采纳
- 日期:2026-07-22(追溯自架构设计_v1 的 v1 决策)

## 背景

需要一个跨平台(Windows → Mac → 移动 → Web)的桌面容器承载 React 前端。
早期需求文档曾选 Electron。

## 决策

桌面端采用 **Tauri 2**。

## 理由

- **体积小**:Tauri 产物为几 MB 级,Electron 动辄上百 MB。
- **原生 HTTP 无 CORS**:Tauri 用系统 WebView + Rust 侧 HTTP,前端可直连 AI 供应商而不受浏览器 CORS 限制;Web 版则用 Vite proxy 绕过。
- **跨平台一致**:同一套 React 代码,桌面/Web/移动只换适配层(`adapters/`)。

## 后果

- ✅ 安装包小、启动快、原生请求方便。
- ⚠️ Rust 工具链成为桌面构建依赖(需 cargo/MSVC);纯 Web 开发者可不装(`npm run setup` 只自检不强制)。
- ⚠️ Tauri 生态较 Electron 新,部分插件需自行适配。
