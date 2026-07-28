#!/usr/bin/env node
/**
 * 环境自检脚本 —— 跨平台（Node 实现，Win/Mac/Linux 通用）。
 * 用法：npm run setup
 * 作用：检查开发/构建桌面版所需的工具链是否就绪，给出缺失项与安装指引。
 * 不做任何安装动作，只做只读检查（安全）。
 */
import { execSync } from 'node:child_process'

const isWin = process.platform === 'win32'

function tryCmd(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return null
  }
}

function line(ok, name, detail) {
  const mark = ok ? '✅' : '❌'
  console.log(`${mark} ${name.padEnd(22)} ${detail ?? ''}`)
  return ok
}

console.log('\n== AI 录音助手 · 环境自检 ==\n')

let allOk = true

// Node
const node = process.version
allOk = line(true, 'Node.js', node) && allOk

// npm
const npm = tryCmd('npm --version')
allOk = line(!!npm, 'npm', npm ?? '未找到') && allOk

// Rust（桌面构建必需）
const cargo = tryCmd('cargo --version')
const rustc = tryCmd('rustc --version')
const rustOk = !!cargo && !!rustc
line(rustOk, 'Rust (cargo/rustc)', rustc ?? '未找到 —— 桌面构建必需，见 https://rustup.rs')

// MSVC（仅 Windows 桌面构建必需）
let msvcOk = true
if (isWin) {
  // rustc 能否找到链接器：用一次 `cargo --version` 无法判断，改查 rustup 默认工具链
  const show = tryCmd('rustup show') ?? ''
  msvcOk = show.includes('msvc')
  line(
    msvcOk,
    'MSVC 工具链',
    msvcOk
      ? '默认 x86_64-pc-windows-msvc'
      : '未检测到 —— 需安装 Visual Studio C++ 生成工具',
  )
}

// Tauri CLI（随 npm 依赖安装，这里提示）
console.log('\n提示：Tauri CLI 通过 `npm install` 安装（devDependency），无需单独装。')

console.log('\n== 结论 ==')
if (allOk && rustOk && msvcOk) {
  console.log('✅ 环境就绪。可执行：')
  console.log('   npm run dev            # Web 开发模式')
  console.log('   npm run desktop        # 桌面开发模式（热更新）')
  console.log('   npm run desktop:build  # 打包 Windows 安装包')
} else {
  console.log('⚠️  存在缺失项：')
  if (!rustOk) console.log('   - 安装 Rust：https://rustup.rs')
  if (isWin && !msvcOk)
    console.log(
      '   - 安装 MSVC：https://visualstudio.microsoft.com/visual-cpp-build-tools/ （勾选「使用 C++ 的桌面开发」）',
    )
  console.log('   仅需 Web 模式则无需 Rust/MSVC，可直接 `npm run dev`。')
  // 环境未就绪不返回错误码，避免阻断纯 Web 开发者
}
console.log('')
