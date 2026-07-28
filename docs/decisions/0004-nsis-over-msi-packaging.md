# 0004. Windows 打包用 NSIS 而非 MSI

- 状态:已采纳
- 日期:2026-07-22(追溯自 BUILD.md)

## 背景

Tauri 可打包为 MSI(WiX)或 NSIS(.exe 安装器)。本应用 `productName` 为中文「AI录音助手」。

## 决策

Windows 安装包目标设为 **NSIS**(`tauri.conf.json` 的 `bundle.targets = ["nsis"]`)。

## 理由

- **WiX 的 `light.exe` 在生成 en-US 的 MSI 时,遇到中文应用名会失败**(CJK 编码坑)。
- NSIS 对中文名支持良好,且更轻、不依赖 WiX 工具链。

## 后果

- ✅ 中文名可正常打包,安装体验简单。
- ⚠️ 若企业域部署确需 MSI,须把 `productName` 改为纯 ASCII 名。
- ⚠️ 当前未配代码签名,安装时会有"未知发布者"告警(签名口子已在 `release.yml` 预留,见 `docs/build.md`)。
