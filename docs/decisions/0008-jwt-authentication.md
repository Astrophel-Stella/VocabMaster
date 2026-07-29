# 0008. 用户认证方案（JWT）

- 状态: 已采纳
- 日期: 2026-07-28

## 背景

VocabMaster 需要用户认证系统，支持：
- 用户注册（用户名/邮箱/密码）
- 用户登录（返回认证凭证）
- 保护 API 端点（仅登录用户可访问）
- 获取当前用户信息

考虑的认证方案：
- JWT（JSON Web Token）
- Session + Cookie
- OAuth 2.0（第三方登录）
- API Key

## 决策

**选择 JWT（JSON Web Token）** 作为用户认证方案。

技术栈：
- python-jose[cryptography]（JWT 库）
- passlib[bcrypt]（密码加密）
- HTTP Bearer Token（传输方式）

认证流程：
1. 用户注册/登录 → 后端验证 → 返回 JWT token
2. 前端存储 token（localStorage）
3. 后续请求携带 token（`Authorization: Bearer <token>`）
4. 后端验证 token → 解析用户信息 → 处理请求

## 理由

### 1. 无状态（Stateless）

- JWT 是**自包含**的，token 本身包含用户信息
- 后端无需存储 session，**易于水平扩展**
- 适合前后端分离架构

对比 Session：
```
Session 方案：
前端 → 后端验证 → 后端创建 session，存入 Redis → 返回 session_id
前端再次请求 → 携带 session_id → 后端查询 Redis → 验证通过

JWT 方案：
前端 → 后端验证 → 后端生成 JWT（包含用户信息）→ 返回 token
前端再次请求 → 携带 token → 后端解析 token（无需查询数据库）→ 验证通过
```

### 2. 跨域友好

- 前后端分离架构，前端和后端可能在不同域名
- JWT 通过 HTTP Header 传输，**无 CORS 问题**
- Session Cookie 需要配置 CORS、SameSite 等，复杂且容易出错

### 3. 适合移动端和桌面应用

- VocabMaster 目标支持桌面和移动端
- 这些平台可能不支持 Cookie
- JWT 通过 HTTP Header 传输，**平台无关**

### 4. 标准化

- JWT 是 **RFC 7519 标准**，所有语言都有实现
- 前端可用多种库解析和验证（虽然通常由后端验证）
- 便于与其他系统集成（如 SSO）

### 5. 密码安全

- 使用 **bcrypt** 加密密码
- bcrypt 是**加盐哈希**，防止彩虹表攻击
- 自动处理盐值，无需手动管理

```python
# 密码加密
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

hashed = pwd_context.hash("user_password")  # 自动加盐
verified = pwd_context.verify("user_password", hashed)  # 验证
```

## 后果

### 正面

- ✅ **无状态**：后端无需存储 session，易于扩展
- ✅ **跨域友好**：适合前后端分离架构
- ✅ **跨平台**：适合 Web、桌面、移动端
- ✅ **标准化**：JWT 是行业标准
- ✅ **密码安全**：bcrypt 加密，防止泄露

### 需要注意

- ⚠️ **Token 过期处理**：
  - Token 有效期 30 分钟
  - 过期后需重新登录
  - 可实现 refresh token 机制（后续优化）

- ⚠️ **Token 存储**：
  - 前端存储在 localStorage（开发环境）
  - 生产环境建议使用 HttpOnly Cookie（防止 XSS）

- ⚠️ **Token 注销**：
  - JWT 无状态，无法主动注销
  - 解决：使用黑名单（需存储）或缩短有效期

- ⚠️ **安全传输**：
  - 必须使用 HTTPS
  - 防止 token 在传输中被窃取

## 实现细节

### 1. JWT 结构

```json
{
  "sub": "user_id_123",       // 用户ID
  "username": "test",         // 用户名
  "exp": 1704067200,          // 过期时间（Unix timestamp）
  "iat": 1704065400           // 签发时间
}
```

### 2. 后端验证中间件

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### 3. 前端请求示例

```typescript
// 存储 token
localStorage.setItem('token', response.data.access_token)

// 发送请求时携带 token
const response = await fetch('/api/progress/stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

## 对比其他方案

| 方案 | 无状态 | 跨域 | 跨平台 | 实现复杂度 | 是否选择 |
|---|---|---|---|---|---|
| JWT | ✅ | ✅ | ✅ | ⭐⭐⭐ | ✅ 选择 |
| Session + Cookie | ❌ | ⚠️ | ⚠️ | ⭐⭐ | ❌ 需要存储 |
| OAuth 2.0 | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ | 🔜 后续扩展 |
| API Key | ✅ | ✅ | ✅ | ⭐ | ❌ 适合服务间认证 |

## 未来优化

1. **Refresh Token**：
   - Access Token 有效期 15 分钟
   - Refresh Token 有效期 7 天
   - 减少用户登录频率

2. **OAuth 2.0 登录**：
   - 支持 GitHub、Google 等第三方登录
   - 降低注册门槛

3. **双因素认证（2FA）**：
   - TOTP（Time-based OTP）
   - 增强安全性

## 相关决策

- ADR-0005：选择前后端分离架构
- ADR-0006：选择 Python FastAPI
- ADR-0007：选择 SQLite
