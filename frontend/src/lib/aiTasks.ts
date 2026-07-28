import type { ChatMessage } from '@/providers'
import type { AITaskType } from '@/lib/db'

// AI 文本处理任务注册表。
// 新增一种处理能力 = 在这里加一个条目（配好 prompt 即可），UI 会自动出现按钮。

export interface AITaskDef {
  id: AITaskType
  label: string
  icon: string
  desc: string
  buildMessages: (text: string, language: string) => ChatMessage[]
}

export const AI_TASKS: AITaskDef[] = [
  {
    id: 'summary',
    label: '摘要',
    icon: '📝',
    desc: '提炼要点',
    buildMessages: (t) => [
      { role: 'system', content: '你是专业的会议纪要助手，用简洁中文输出要点。' },
      { role: 'user', content: `请为以下内容生成简洁摘要（3-5 条要点，中文）：\n\n${t}` },
    ],
  },
  {
    id: 'keywords',
    label: '关键词',
    icon: '🔑',
    desc: '提取关键词',
    buildMessages: (t) => [
      {
        role: 'user',
        content: `从以下内容提取 5-10 个关键词，用「、」分隔，只输出关键词本身：\n\n${t}`,
      },
    ],
  },
  {
    id: 'translate',
    label: '翻译',
    icon: '🌐',
    desc: '中英互译',
    buildMessages: (t) => [
      {
        role: 'system',
        content:
          '你是翻译助手。若原文主要为中文则翻译成英文；若主要为英文则翻译成中文。只输出译文，不要解释。',
      },
      { role: 'user', content: t },
    ],
  },
  {
    id: 'polish',
    label: '润色',
    icon: '✨',
    desc: '整理成书面文字',
    buildMessages: (t) => [
      {
        role: 'user',
        content: `请把下面这段口语化的语音转写整理成通顺、书面化的文字，保持原意，去除口头语、重复和语气词：\n\n${t}`,
      },
    ],
  },
]
