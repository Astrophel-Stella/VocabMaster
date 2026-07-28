import { describe, it, expect } from 'vitest'
import { formatDuration, formatBytes, formatDateTime } from './format'

describe('formatDuration', () => {
  it('小于一小时用 mm:ss', () => {
    expect(formatDuration(0)).toBe('00:00')
    expect(formatDuration(45_000)).toBe('00:45')
    expect(formatDuration(90_000)).toBe('01:30')
  })
  it('超过一小时用 hh:mm:ss', () => {
    expect(formatDuration(3_600_000)).toBe('01:00:00')
    expect(formatDuration(3_661_000)).toBe('01:01:01')
  })
})

describe('formatBytes', () => {
  it('按量级切换单位', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB')
  })
})

describe('formatDateTime', () => {
  it('输出 YYYY-MM-DD HH:mm 结构', () => {
    const s = formatDateTime(new Date(2026, 0, 2, 3, 4).getTime())
    expect(s).toBe('2026-01-02 03:04')
  })
})
