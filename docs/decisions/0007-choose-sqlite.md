# 0007. 选择 SQLite 作为数据库

- 状态: 已采纳
- 日期: 2026-07-28

## 背景

VocabMaster 需要持久化以下数据：
- 用户信息（用户名、邮箱、密码hash）
- 词库信息（词库名称、描述、单词总数）
- 单词数据（拼写、音标、释义、例句）
- 学习进度（用户ID、单词ID、掌握状态）

考虑的数据库选项：
- SQLite（嵌入式数据库）
- PostgreSQL（生产级关系数据库）
- MySQL（传统关系数据库）
- MongoDB（NoSQL 文档数据库）

## 决策

**选择 SQLite** 作为开发和小型部署的数据库。

技术栈：
- SQLite（数据库）
- SQLAlchemy（ORM）
- aiosqlite（异步 SQLite 驱动，可选）

## 理由

### 1. 零配置、零安装

- SQLite 是**嵌入式数据库**，数据库就是一个文件（`vocabmaster.db`）
- **无需安装**数据库服务器
- **无需配置**连接参数、端口、用户权限
- 启动应用即可使用

对比 PostgreSQL：
```bash
# PostgreSQL 需要安装和配置
sudo apt install postgresql
sudo service postgresql start
sudo -u postgres createuser vocabmaster
sudo -u postgres createdb vocabmaster_db
# 还需要配置 pg_hba.conf、密码等

# SQLite 无需任何配置
# 只需在代码中指定文件路径即可
```

### 2. 适合小型应用和个人使用

- VocabMaster 是**个人学习项目**
- 预期用户规模：单用户或少量用户
- 数据量：词库约 1000-5000 词，进度记录约 1000 条
- SQLite 完全满足需求

**性能对比**：
| 操作 | SQLite | PostgreSQL | 是否满足需求 |
|---|---|---|---|
| 单词查询 | < 10ms | < 5ms | ✅ 满足 |
| 进度更新 | < 5ms | < 3ms | ✅ 满足 |
| 词库列表 | < 20ms | < 10ms | ✅ 满足 |

### 3. 易于开发和测试

- **开发环境**：无需搭建数据库服务器
- **测试环境**：使用内存数据库 `sqlite:///:memory:`，测试隔离且快速
- **部署简单**：只需复制 `.db` 文件即可迁移数据

测试示例：
```python
# conftest.py
from sqlalchemy import create_engine

@pytest.fixture
def test_db():
    # 内存数据库，测试完自动销毁
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    yield engine
    # 无需清理，内存数据库自动销毁
```

### 4. 易于备份和迁移

- 数据库就是一个文件，备份 = 复制文件
- 迁移到 PostgreSQL 很简单：
  - 导出：`sqlite3 vocabmaster.db .dump > dump.sql`
  - 导入：`psql vocabmaster_db < dump.sql`
  - 代码只需修改连接字符串

### 5. 成本低

- **零运维成本**：无需数据库服务器、无需 DBA
- **零云服务费用**：无需 RDS、Cloud SQL 等付费服务
- **零部署成本**：跟随应用一起部署

## 后果

### 正面

- ✅ **零配置**：无需安装和配置数据库服务器
- ✅ **开发便捷**：本地开发、测试都很简单
- ✅ **部署简单**：跟随应用一起部署
- ✅ **成本低**：无需数据库服务器费用

### 限制

- ⚠️ **并发写入受限**：SQLite 使用文件锁，并发写入性能受限
  - 影响：单用户应用无影响，多用户并发写入可能变慢
  - 解决：读操作不受限，大部分场景是读操作

- ⚠️ **不适合大规模生产环境**：
  - 影响：用户量 > 100 或并发 > 10 时性能下降
  - 解决：迁移到 PostgreSQL（只需修改连接字符串）

- ⚠️ **无远程访问**：
  - 影响：数据库文件必须在本地
  - 解决：云部署时使用 PostgreSQL

### 迁移路径

当需要迁移到 PostgreSQL 时：

1. **导出数据**：
   ```bash
   sqlite3 vocabmaster.db .dump > dump.sql
   ```

2. **修改连接字符串**：
   ```python
   # config.py
   DATABASE_URL = "postgresql://user:pass@localhost/vocabmaster"
   ```

3. **导入数据**：
   ```bash
   psql vocabmaster < dump.sql
   ```

**代码几乎无需修改**（SQLAlchemy ORM 隔离了数据库差异）

## 对比其他选项

| 数据库 | 配置复杂度 | 运维成本 | 性能 | 适用场景 | 是否选择 |
|---|---|---|---|---|---|
| SQLite | ⭐ | ⭐ | ⭐⭐⭐ | 小型应用、个人项目 | ✅ 选择 |
| PostgreSQL | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 生产环境、大规模 | 🔜 生产环境 |
| MySQL | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 传统企业应用 | ❌ 配置复杂 |
| MongoDB | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 文档型数据 | ❌ 需求是关系型 |

## 相关决策

- ADR-0005：选择前后端分离架构
- ADR-0006：选择 Python FastAPI
