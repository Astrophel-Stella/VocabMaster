# 0006. 选择 Python FastAPI 作为后端框架

- 状态: 已采纳
- 日期: 2026-07-28

## 背景

VocabMaster 需要后端提供以下能力：
- 用户认证（注册/登录/获取用户信息）
- 词库管理（CRUD 操作）
- 学习进度追踪（标记掌握/查询进度）
- 数据持久化（数据库）

考虑的选项：
- Python FastAPI
- Node.js Express
- Go Gin
- Java Spring Boot

## 决策

**选择 Python FastAPI** 作为后端框架。

配套技术栈：
- FastAPI（Web 框架）
- SQLAlchemy（ORM）
- Pydantic（数据验证）
- python-jose（JWT）
- passlib[bcrypt]（密码加密）
- pytest（测试框架）

## 理由

### 1. AI 时代最佳选择

- Python 是 AI/ML 领域的首选语言
- 与 LangChain、LlamaIndex 等 AI 框架无缝集成
- 未来可轻松扩展智能推荐、自适应学习等 AI 功能

### 2. 性能优秀

- 基于 Starlette（ASGI 框架），性能接近 Node.js
- 异步支持（async/await），适合 I/O 密集型应用
- 自动处理并发请求

### 3. 类型提示与自动文档

- **类型提示**：Pydantic 提供强类型验证，减少运行时错误
- **自动文档**：FastAPI 自动生成 OpenAPI/Swagger 文档
  - 访问 `http://localhost:8000/docs` 即可查看交互式文档
  - 减少手动维护 API 文档的成本

### 4. 开发效率高

- 简洁的装饰器语法（`@app.get`、`@app.post`）
- 自动请求验证和错误处理
- 依赖注入系统（简化测试和复用）

示例代码对比：

```python
# FastAPI（简洁、类型安全）
@app.post("/api/auth/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, user)

# Express（需要手动验证）
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' })
  }
  // ...
})
```

### 5. 测试友好

- pytest 是 Python 最成熟的测试框架
- TestClient 简化 API 测试
- 支持异步测试（pytest-asyncio）
- 测试覆盖率工具完善（pytest-cov）

### 6. 学习曲线平缓

- Python 语法简单，新成员容易上手
- FastAPI 文档完善，示例丰富
- 社区活跃，问题容易找到解决方案

## 后果

### 正面

- ✅ **开发效率高**：自动文档、类型验证、简洁语法
- ✅ **性能优秀**：异步支持，适合高并发
- ✅ **AI 友好**：未来可扩展 AI 功能
- ✅ **测试友好**：pytest 生态成熟
- ✅ **文档自动化**：OpenAPI/Swagger 自动生成

### 需要注意

- ⚠️ **异步理解**：需要理解 async/await，否则可能引入性能问题
- ⚠️ **依赖管理**：使用 venv 或 poetry 管理 Python 依赖
- ⚠️ **类型注解**：需要学习 Pydantic 的类型系统

## 对比其他选项

| 框架 | 性能 | 开发效率 | AI 生态 | 学习曲线 | 是否选择 |
|---|---|---|---|---|---|
| FastAPI | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ 选择 |
| Express | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ AI 生态弱 |
| Go Gin | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ❌ 学习成本高 |
| Spring Boot | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ❌ 过于重型 |

## 相关决策

- ADR-0005：选择前后端分离架构
- ADR-0007：选择 SQLite 作为数据库
- ADR-0008：用户认证方案（JWT）
