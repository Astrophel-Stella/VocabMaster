# REQ-SOU-38: 部署脚本硬化

## 版本历史
| 版本 | 日期 | 变更人 | 变更内容 |
|------|------|--------|----------|
| 1.0 | 2026-08-01 | 软件工程师 | 初始版本 |

## 背景

SOU-37 把 `frontend` 服务补进 `docker-compose.prod.yml` 后，首次部署（run 30687254473）失败，导致生产 API 一度 502、后端容器被留在 `created` 未运行状态，最终由人工一次性 cutover 恢复。根因是部署脚本不幂等、失败不自愈、回滚是空占位符、冒烟测试只看 200 不看内容。

## 验收标准

### 正常流程

```
Given 存在遗留同名手动容器的生产环境
When 执行部署脚本
Then 脚本自动清理撞名容器并成功部署
And 后端容器正常运行（不是 created 状态）
And 前端容器正常运行
And 健康检查通过
```

### 回滚流程

```
Given 部署过程中发生失败
When 回滚步骤被触发
Then 真正执行 SSH 回滚到上一个 good commit
And 回滚后健康检查通过
And "已回滚" 评论与实际状态一致
```

### 冒烟测试流程

```
Given 部署成功
When 执行冒烟测试
Then 验证前端 HTML 包含 VocabMaster 标识
And 验证 JS bundle 不包含测试数据（Password123、测试账号）
And 验证 API 健康检查通过
And 验证登录 API 正常
And 如果服务旧 bundle，测试会失败（不会假绿）
```

### 异常流程

```
Given SECRET_KEY 未在服务器 .env 中设置
When 执行 docker compose up
Then 显示明确的错误提示（不再是静默默认空字符串）
```

## 技术设计

### API 变更
无

### 组件变更
- `.github/workflows/ai-native-pipeline.yml`:
  - `deploy-to-production` job 重写
  - 新增 `Record Last Good Commit` step
  - 新增 `Rollback on Failure` step（真回滚）
  - `Run Smoke Tests` step 增加内容级验证

### 数据库变更
无

### 配置变更
- `docker-compose.prod.yml`:
  - 移除已废弃的 `version: '3.8'` 字段
  - `SECRET_KEY` 环境变量注释更新，提示必须在服务器 .env 中设置
- 新增 `.env.example` 文件，说明服务器配置要求

## 关联Issue
- SOU-38
