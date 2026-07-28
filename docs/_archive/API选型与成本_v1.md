# AI录音助手 - 免费API评估与技术选型

## 第一版 API 方案选择

### Speech-to-Text (语音转文字)

| API | 免费额度 | 优点 | 缺点 | 建议 |
|-----|--------|------|------|------|
| **Whisper API (OpenAI)** | $5额度/月<br/>约50-100条 | 准确度高、多语言 | 需要API Key | ✅ **首选** |
| **Google Cloud Speech** | 60分钟/月 | 准确度极高、多语言 | 需要信用卡验证 | ✅ **备选1** |
| **Azure Speech Services** | 5 audio hours/month | 服务稳定 | 需要Azure账户 | ✅ **备选2** |
| **Whisper-CPP (本地)** | 完全免费 | 离线、无额度限制 | GPU较慢、模型体积大 | ⚠️ **降本方案** |

**v1 推荐：使用 Whisper API**（配合备选方案快速切换）

---

### Text Processing (文本处理 - AI理解)

| API | 免费额度 | 优点 | 缺点 | 建议 |
|-----|--------|------|------|------|
| **Claude API (Anthropic)** | $5额度/月 | 质量最高、理解能力强 | 需要API Key | ✅ **首选** |
| **OpenAI GPT-3.5** | $5额度/月 | 功能全面、生态大 | 同上 | ✅ **备选** |
| **Cohere API** | 5000条/月 | 免费额度充足 | 质量略低于GPT/Claude | ⚠️ **备选** |
| **LLaMA 2 (本地)** | 完全免费 | 隐私保护、无额度 | 需要显卡、推理慢 | ⚠️ **降本方案** |

**v1 推荐：使用 Claude API**（快速集成、质量好）

---

## 快速申请指南

### 1️⃣ Whisper API (OpenAI) - 最简单

```bash
1. 访问 https://platform.openai.com/account/api-keys
2. 使用 GitHub/Google 账户登录
3. 创建新 API Key
4. 获得 $5 免费额度
5. 复制 API Key 到项目 .env 文件

环境变量:
OPENAI_API_KEY=sk-xxx...
```

**预估费用**：
- 每1分钟音频 ≈ $0.06（对应约50-100条转录/月）

### 2️⃣ Claude API (Anthropic) - 同样简单

```bash
1. 访问 https://console.anthropic.com
2. 注册账户 (邮箱即可)
3. 创建 API Key
4. 获得 $5 免费额度
5. 复制到 .env 文件

环境变量:
ANTHROPIC_API_KEY=sk-ant-xxx...
```

**预估费用**：
- Claude 3.5 Sonnet: 输入 $3/M tokens, 输出 $15/M tokens
- 每条摘要请求 ≈ 500 tokens ≈ $0.003

### 3️⃣ Google Cloud Speech (可选备选)

```bash
1. 访问 https://console.cloud.google.com
2. 创建新项目
3. 启用 Speech-to-Text API
4. 创建服务账户 Key (JSON格式)
5. 复制 JSON 文件到项目

环境变量:
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
```

**预估费用**：60分钟免费额度/月（足够MVP)

---

## 项目初始化清单

### ✅ 必做

- [ ] 申请 Whisper API Key
- [ ] 申请 Claude API Key
- [ ] 创建 `.env` 文件，保存 API Keys
- [ ] 初始化 Electron 项目
- [ ] 初始化 Python FastAPI 后端项目
- [ ] 创建 SQLite 数据库 Schema

### ⚠️ 可选

- [ ] 申请 Google Cloud 账户（作为备选）
- [ ] 下载 Whisper-CPP 模型（用于成本优化）
- [ ] 配置 LLaMA 本地模型（用于离线处理）

---

## 成本估算 (初期)

### 假设场景：月均使用
- **录音数**: 100条
- **平均时长**: 1分钟
- **处理数**: 50条（摘要、关键词等）

| 服务 | 单价 | 用量 | 预估费用 |
|------|------|------|---------|
| Whisper API | $0.06/min | 100 min | $6 |
| Claude API | $0.003/摘要 | 50 | $0.15 |
| **合计** | - | - | **$6.15/月** |

✅ 在 $5 免费额度范围内（超出极少）

**后续降本方案**：
- 切换本地 Whisper-CPP 模型 → 节省 $6/月
- 使用 Cohere API 替代 Claude → 节省 $0.10/月
- 集成本地 LLaMA 模型 → 节省 $0.15/月

---

## 开发环境配置

### .env.example 文件模板

```bash
# Speech-to-Text
STT_PROVIDER=whisper  # whisper | google | azure
OPENAI_API_KEY=sk-xxx...

# LLM (文本处理)
LLM_PROVIDER=claude  # claude | openai | cohere
ANTHROPIC_API_KEY=sk-ant-xxx...
OPENAI_API_KEY=sk-xxx...
COHERE_API_KEY=xxx...

# Google Cloud (可选)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json

# 应用配置
APP_ENV=development  # development | production
LOG_LEVEL=INFO
DATABASE_URL=sqlite:///./app.db

# 代理配置 (可选，用于访问被墙的API)
HTTP_PROXY=
HTTPS_PROXY=
```

---

## 集成示例代码结构

### 后端：调用 Whisper API

```python
# backend/app/services/transcription_service.py

import openai
from app.config import settings

class TranscriptionService:
    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY
    
    async def transcribe(self, audio_file_path: str, language: str = "zh-CN"):
        with open(audio_file_path, "rb") as audio_file:
            transcript = openai.Audio.transcribe(
                model="whisper-1",
                file=audio_file,
                language="zh" if language == "zh-CN" else "en"
            )
        return transcript["text"]
```

### 后端：调用 Claude API

```python
# backend/app/services/ai_service.py

import anthropic
from app.config import settings

class AIProcessingService:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    async def summarize(self, text: str, max_tokens: int = 200):
        message = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=max_tokens,
            messages=[
                {"role": "user", "content": f"请总结以下内容:\n\n{text}"}
            ]
        )
        return message.content[0].text
    
    async def extract_keywords(self, text: str, top_k: int = 10):
        message = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=200,
            messages=[
                {"role": "user", "content": f"从以下文本中提取{top_k}个关键词，用逗号分隔:\n\n{text}"}
            ]
        )
        keywords = message.content[0].text.split(",")
        return [k.strip() for k in keywords][:top_k]
```

---

## 后续扩展路线图

### 短期 (1-2月)
- ✅ MVP 完成（录音、转文字、基础AI处理）
- ⚠️ 支持 Mac 版本编译
- ⚠️ 性能优化、错误处理完善

### 中期 (2-3月)
- ⚠️ 集成本地 Whisper-CPP 模型（降本）
- ⚠️ 云同步功能（基础版）
- ⚠️ Web 版本（React + Next.js 复用组件）

### 长期 (3-6月)
- ⚠️ 移动版本 (React Native / Flutter)
- ⚠️ 高级 AI 功能 (自定义 Prompt、插件系统)
- ⚠️ 离线本地模型（LLaMA、Mistral）集成
- ⚠️ 多语言支持完善

---

## 常见问题

**Q: 如果超出免费额度怎么办？**
A: 可快速切换到 Google Cloud Speech（60分钟免费）或本地 Whisper-CPP 模型。设计的目的就是支持多 Provider 切换。

**Q: 隐私安全如何保证？**
A: 
- 录音文件可选本地存储，不强制上传
- API 调用可选使用代理或本地模型
- 用户可离线使用（集成本地模型后）

**Q: 如何支持多语言？**
A: Whisper API 和 Claude API 都原生支持多语言。配置中选择语言即可。

**Q: 如何切换到本地模型？**
A: 修改 `.env` 中的 `STT_PROVIDER` 和 `LLM_PROVIDER`，后端会自动加载对应的服务模块。

