import { describe, it, expect } from 'vitest'
import { AI_TASKS } from './aiTasks'

describe('AI_TASKS 注册表', () => {
  it('包含摘要/关键词/翻译/润色四种任务', () => {
    const ids = AI_TASKS.map((t) => t.id)
    expect(ids).toEqual(['summary', 'keywords', 'translate', 'polish'])
  })

  it('每个任务都能生成含用户内容的消息', () => {
    for (const task of AI_TASKS) {
      const msgs = task.buildMessages('测试文本内容', 'zh')
      expect(msgs.length).toBeGreaterThan(0)
      const joined = msgs.map((m) => m.content).join('\n')
      expect(joined).toContain('测试文本内容')
      // 最后一条应为 user 角色（携带待处理文本）
      expect(msgs[msgs.length - 1].role).toBe('user')
    }
  })
})
