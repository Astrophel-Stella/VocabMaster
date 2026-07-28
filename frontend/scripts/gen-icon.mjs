#!/usr/bin/env node
/**
 * 生成占位应用图标（零依赖，纯 Node）。
 * 输出 1024x1024 的 PNG 到 src-tauri/app-icon.png，
 * 再由 `npx @tauri-apps/cli icon` 生成各平台所需尺寸。
 *
 * 之后想换成自己的 logo：把一张 1024x1024 PNG 命名为 app-icon.png 覆盖即可，
 * 或直接 `npx @tauri-apps/cli icon 你的图.png`。
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SIZE = 1024
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src-tauri', 'app-icon.png')

// 品牌色（indigo）背景 + 中心浅色圆点（麦克风占位感）
const bg = [79, 70, 229, 255] // #4f46e5
const dot = [238, 242, 255, 255] // #eef2ff

const buf = Buffer.alloc(SIZE * SIZE * 4)
const cx = SIZE / 2
const cy = SIZE * 0.42
const r = SIZE * 0.16
const stemW = SIZE * 0.06
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4
    // 麦克风头（圆）+ 简单竖杆，做个能认出来的占位形状
    const inHead = (x - cx) ** 2 + (y - cy) ** 2 <= r * r
    const inStem =
      Math.abs(x - cx) <= stemW / 2 && y > cy && y < cy + SIZE * 0.28
    const inBase =
      Math.abs(x - cx) <= SIZE * 0.12 &&
      Math.abs(y - (cy + SIZE * 0.3)) <= stemW / 2
    const c = inHead || inStem || inBase ? dot : bg
    buf[i] = c[0]
    buf[i + 1] = c[1]
    buf[i + 2] = c[2]
    buf[i + 3] = c[3]
  }
}

// ── 最小 PNG 编码 ──
function crc32(bytes) {
  let c = ~0
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // color type RGBA
// 每行前置 1 字节 filter(0)
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1))
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0
  buf.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4)
}
const idat = deflateSync(raw)
const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
])
writeFileSync(OUT, png)
console.log(`✅ 已生成占位图标：${OUT}（${png.length} 字节）`)
