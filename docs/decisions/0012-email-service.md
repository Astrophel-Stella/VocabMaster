# 0012. 邮件服务方案（邮箱验证 + 忘记密码共用）

- 状态: 已采纳
- 日期: 2026-07-30
- 关联 Issue: SOU-24（父）、SOU-26（忘记密码）、SOU-27（邮箱验证）

## 背景

SOU-26（忘记密码）与 SOU-27（邮箱验证）都需要向用户邮箱发送含 token 的链接。两份子需求描述里各自提到"集成邮件发送服务（SendGrid/阿里云邮件推送）"，若各实现一套会重复且凭据/模板/队列各搞一份。邮件发送属"花钱/对外发布"类能力（CLAUDE.md §4 人类闸口），服务商选型与密钥配置需人工确认。本 ADR 在研发动手前固化共用方案，避免两个 Issue 各跑各的。

## 选项

### 选项 A：SendGrid
- 优点：国际通用、SDK 完善、免费额度（100 封/天）
- 缺点：国内到达率不稳，国内用户邮箱可能进垃圾箱

### 选项 B：阿里云邮件推送（Direct Mail）
- 优点：国内到达率高、与国内用户邮箱（QQ/163/126）兼容好、按量付费便宜
- 缺点：需备案发信域名、配置 SPF/DKIM，初次配置较重

### 选项 C：SMTP 自建（如 QQ 企业邮箱 SMTP）
- 优点：零额外成本、配置简单
- 缺点：发送频率受限、易被封、无送达统计、不适合生产

### 选项 D：开发期兜底——控制台打印 + 内存队列，生产再接 B
- 优点：不阻塞开发与测试（无需真实邮箱与密钥即可跑通流程）
- 缺点：仅限开发/测试环境，生产必须切换

## 决策

**生产采用选项 B（阿里云邮件推送），开发/测试期采用选项 D（控制台打印兜底 + 接口抽象）。**

通过 `EmailService` 抽象层隔离：
- 开发/测试：`ConsoleEmailService`——将验证链接/重置链接打印到日志，测试可直接断言日志内容
- 生产：`AliyunEmailService`——通过阿里云 SDK 发送（密钥从环境变量读，不入库不入仓）

服务商切换由 `app/config.py` 的 `email_provider` 配置项控制，默认 `console`。

## 接口定义

### 邮件服务抽象（`backend/app/services/email_service.py`）
```python
class EmailService(Protocol):
    def send_verification_email(self, to: str, username: str, token: str, verify_url: str) -> None: ...
    def send_password_reset_email(self, to: str, username: str, token: str, reset_url: str) -> None: ...
```

### Token 规范（与 ADR-0008 JWT 体系一致，采用 secrets.token_urlsafe 生成，非 JWT）
- 邮箱验证 token：`secrets.token_urlsafe(32)`，有效期 7 天，存 `users.verification_token` / `verification_token_expires`，使用后置空
- 密码重置 token：`secrets.token_urlsafe(32)`，有效期 24 小时，存 `users.reset_token` / `reset_token_expires`，使用后置空；新申请使旧 token 失效

### 新增 API 端点
| 端点 | 用途 | 关联 Issue |
|---|---|---|
| `POST /api/auth/forgot-password` | 发送重置邮件（限频 1 次/分钟/邮箱） | SOU-26 |
| `POST /api/auth/reset-password` | 凭 token 重置密码（复用 ADR-0011 强度校验） | SOU-26 |
| `POST /api/auth/resend-verification` | 重发验证邮件（限频 3 次/5 分钟/邮箱） | SOU-27 |
| `GET /api/auth/verify-email/{token}` | 验证邮箱 | SOU-27 |

### 数据库变更（SQLite，ADR-0007）
```sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN verification_token_expires DATETIME;
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expires DATETIME;
```

## 理由

1. **共用抽象避免重复**：两份子需求共享同一 `EmailService`，凭据、模板、队列只配一次，符合"不留第二份真相"。
2. **开发期不阻塞**：选项 D 让研发与测试无需真实邮箱/密钥即可跑通完整流程并断言，解耦于"人工配置阿里云"这一闸口。
3. **生产到达率**：目标用户为国内学习者，QQ/163 邮箱占多数，阿里云到达率优于 SendGrid。
4. **token 用 `secrets` 而非 JWT**：重置/验证 token 是一次性、短效、需服务端状态（使用即失效）的，JWT 无状态无法表达"已使用"，故用随机 token + DB 字段，与 ADR-0008 的会话型 JWT 各司其职。

## 后果

### 正面
- ✅ 两 Issue 共用一套邮件能力
- ✅ 开发/测试可立即开工，不卡在阿里云配置闸口
- ✅ 生产切换仅改配置项，不改业务代码

### 需注意（人类闸口）
- ⚠️ **生产上线前必须人工确认**：阿里云发信域名备案、SPF/DKIM、AccessKey 配置属"对外发布/花钱"类，研发不得自行申请或提交真实密钥；密钥通过 `.env` 注入，不进代码不进文档。
- ⚠️ `ConsoleEmailService` 仅限 `debug=True` 环境，生产启动前 `email_provider` 必须为 `aliyun`，建议在 `main.py` 启动校验：生产配置下若 provider 仍为 console 则拒绝启动。

## 相关决策
- ADR-0008 用户认证（JWT）—— 本决策补充邮件类一次性 token 流程
- ADR-0011 密码强度策略 —— 重置密码复用其强度校验
- ADR-0007 SQLite —— 新增字段沿用
