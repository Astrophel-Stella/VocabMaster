# 0013. 发音服务方案（有道为主 + 本地缓存）

- 状态: 已采纳
- 日期: 2026-07-30
- 关联 Issue: SOU-24（父）、SOU-30（发音功能集成）

## 背景

SOU-30 要求每个单词提供标准发音。现有 `words` 表已有 `pronunciation_url` 字段（`backend/app/models/word.py`），但无数据、无播放逻辑。需求描述给了五个服务商对比（有道/百度/Google/Azure/ResponsiveVoice）。发音 API 属"花钱/对外服务"类，密钥配置需人工确认（CLAUDE.md §4）。本 ADR 固化选型与缓存策略，避免研发在 Issue 里临时选型。

## 选项

见 SOU-30 描述中的对比表（有道⭐5 / 百度⭐4 / Google⭐3 / Azure⭐4 / ResponsiveVoice⭐3）。

## 决策

**主用有道词典 API，百度翻译 API 作为降级备用；本地缓存音频避免重复请求与频控。**

### 服务层抽象（`backend/app/services/pronunciation_service.py`）
```python
class PronunciationService:
    def get_audio(self, word: str, accent: Accent = Accent.US) -> str:  # 返回可播放 URL 或音频流
        ...
```
- 优先级：本地缓存目录 → 有道 API → 百度 API → 失败返回 404 + 友好提示
- 缓存：`backend/media/audio/{accent}/{word}.mp3`，落盘后后续直接返回文件 URL，避免频控与延迟
- 开发/测试期：若未配置 API Key，降级为返回一个占位音频或 404，**不阻塞**主路径开发与测试（与 ADR-0012 同思路，把"对外密钥"闸口与"业务代码"解耦）

### API 端点
- `GET /api/words/{word_id}/pronunciation?accent=us|uk`：返回音频（优先缓存文件 URL，否则代理流式返回）

### 前端
- `WordCard.tsx` 增加发音按钮（🔊），HTML5 `<audio>` 播放
- 播放状态管理：idle / loading / playing / error；点击新发音时停止当前播放

### 数据库
- `words.pronunciation_url`（已存在）保留，作为"已缓存音频文件 URL"
- 不新增字段（accent 维度通过缓存目录区分，避免表结构膨胀）

## 接口定义

### `GET /api/words/{word_id}/pronunciation?accent=us|uk`
- 成功：`200`，响应体为音频流（`Content-Type: audio/mpeg`）或 `{"url": "/media/audio/us/abandon.mp3"}`
- 未配置 key（开发期）：`404 {"detail": "发音服务未配置"}`，前端显示"发音加载失败，请稍后重试"
- accent 非法：`422`

## 理由

1. **国内到达与质量**：有道国内访问快、质量高，与目标用户匹配。
2. **缓存降成本降频控**：词库单词有限且高频重复，落盘缓存后 API 调用次数从"每次点击"降到"首次获取"，规避频控与延迟（验收标准明确要求"优先使用本地缓存"）。
3. **开发期解耦密钥闸口**：与 ADR-0012 一致，未配置 key 时降级而非报错阻塞，让研发/测试能先跑通 UI 与状态机逻辑。
4. **不膨胀表结构**：accent 维度用缓存目录表达，避免给 `words` 表加 `audio_url_us`/`audio_url_uk` 两列（原 Issue 建议加，但缓存方案下无需）。

## 后果

### 正面
- ✅ 缓存后无频控风险、加载快
- ✅ 主备双服务商，单点故障可降级
- ✅ 开发期不卡密钥

### 需注意（人类闸口）
- ⚠️ 有道/百度 API Key 属"花钱/对外服务"类，研发不得自行申请或硬编码；通过 `.env` 注入（`YOUDAO_APP_KEY`/`YOUDAO_APP_SECRET` 等），不进代码不进文档。
- ⚠️ 生产前需人工确认 Key 配额与计费，并确认音频版权（使用官方 API 即合规）。
- ⚠️ 缓存目录需加入 `.gitignore`，并确保部署卷持久化。

## 相关决策
- ADR-0012 邮件服务 —— 同为"对外密钥服务 + 开发期降级"模式，可复用配置与启动校验思路
- ADR-0008 认证 —— 发音端点需登录（依赖 `get_current_user`）
