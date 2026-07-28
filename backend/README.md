# VocabMaster Backend

Python FastAPI 后端服务，为 VocabMaster 前端提供 API 支持。

## 技术栈

- **框架**: FastAPI
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **ORM**: SQLAlchemy
- **认证**: JWT (python-jose)
- **密码加密**: passlib + bcrypt

## 快速开始

### 安装依赖

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 运行开发服务器

```bash
uvicorn app.main:app --reload --port 8000
```

访问 http://localhost:8000/docs 查看 API 文档。

### 运行测试

```bash
pytest
```

## 项目结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI 应用入口
│   ├── config.py         # 配置管理
│   ├── api/              # API 路由
│   │   ├── __init__.py
│   │   ├── auth.py       # 用户认证 API
│   │   ├── words.py      # 单词相关 API
│   │   └── progress.py   # 学习进度 API
│   ├── models/           # 数据库模型
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── word.py
│   │   └── progress.py
│   └── services/         # 业务逻辑
│       ├── __init__.py
│       ├── auth_service.py
│       └── word_service.py
├── tests/                # 测试
│   ├── __init__.py
│   ├── conftest.py
│   └── test_auth.py
├── requirements.txt
└── README.md
```

## API 概览

### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 词库相关

- `GET /api/word-banks` - 获取词库列表
- `GET /api/word-banks/{id}/words` - 获取词库中的单词
- `GET /api/words/{id}` - 获取单词详情

### 学习进度

- `GET /api/progress` - 获取学习进度
- `POST /api/progress/{word_id}` - 标记单词已掌握
- `DELETE /api/progress/{word_id}` - 取消标记

## 环境变量

创建 `.env` 文件：

```
DATABASE_URL=sqlite:///./vocabmaster.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```
