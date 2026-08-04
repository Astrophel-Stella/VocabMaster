## REQ-SOU-42：单词发音失败修复（无密钥公共发音源）

## 版本历史
| 版本 | 日期 | 变更人 | 变更内容 |
|------|------|--------|----------|
| 1.0  | 2026-08-04 | 软件工程师 | 修复点击扬声器发音失败：新增有道词典公共发音源（无需密钥），前端补 Web Speech 兜底，修复缓存路径 bug |

## 问题描述（缺陷复现）

用户（QA 陈豪）反馈：单词卡片点击扬声器图标发音失败。

**根因**：`/api/words/{id}/pronunciation` 依赖商用 TTS 密钥（有道/百度）。密钥属人类闸口，生产默认未配置 → `PronunciationService.is_configured()` 返回 `False` → 端点直接返回 `404 发音服务未配置`。种子词库亦无 `pronunciation_url`。因此生产环境点击发音必然失败。

次要缺陷：端点内缓存路径 `backend/app/media/...` 与服务缓存目录 `backend/media/...` 不一致，已缓存音频永远命中不到。

## 验收标准

### 正常流程
```
Given 生产环境未配置任何商用 TTS 密钥（默认状态）
When 已登录用户点击单词扬声器图标
Then 后端返回 200 及可播放音频 URL（有道公共发音端点），前端播放发音成功
```

### 口音支持
```
Given 请求 accent=us / accent=uk
When 生成公共发音 URL
Then 美音 type=2、英音 type=1，且单词经 URL 编码
```

### 兜底流程（前端）
```
Given 音频流加载/播放失败（离线/被墙/网络异常）
When 音频元素触发 error
Then 前端降级使用浏览器 Web Speech API 朗读单词，不再直接报错
```

### 显式关闭时
```
Given 部署显式关闭公共源（PRONUNCIATION_PUBLIC_ENABLED=false）且无商用密钥
When 请求发音
Then 返回 404「发音服务未配置」（保留友好降级语义）
```

### 异常流程
```
Given accent 参数非法
When 请求发音
Then 返回 422
```

## 技术设计

- 配置（`backend/app/config.py`）：新增 `pronunciation_public_enabled: bool = True`、`pronunciation_public_base_url: str = "https://dict.youdao.com/dictvoice"`（主机不硬编码，走配置注入，遵守 SOU-35）。
- 服务（`backend/app/services/pronunciation_service.py`）：新增 `get_public_url(word, accent)`；`get_audio` 优先级追加公共源兜底；`is_configured` 在公共源开启时返回 `True`。
- 端点（`backend/app/api/words.py`）：修正缓存路径为 `backend/media/audio`；外部 URL 以 `{url, available, accent}` 返回。
- 前端（`frontend/src/hooks/usePronunciation.ts`）：`play(wordId, spelling, accent)` 新增 `spelling`；音频失败时 `speechSynthesis` 兜底朗读。
- 组件（`frontend/src/components/WordCard.tsx`）：调用处传入 `currentWord.spelling`。

## 测试证据

- 后端 pytest：`test_REQ_WORD_003_pronunciation_public_provider_default`（默认返回 200+URL）、`test_REQ_WORD_003_pronunciation_not_configured`（关闭公共源+无密钥→404）、`test_REQ_WORD_003_public_url_accent_mapping`（口音映射）。
- 前端 vitest：`usePronunciation` 新增「音频失败降级 speechSynthesis」用例；`WordCard` 调用签名更新。
- E2E（Playwright，生产配置）：新增回归用例「无密钥也能发音」，断言不再出现「发音服务未配置」。

## 关联
- 缺陷来源：QA（陈豪）聊天反馈
- ADR-0013 发音服务方案（本次追加「无密钥公共源」补充章节）
- SOU-35 配置一致性（禁止硬编码 host/URL）
