# AI-Native Pipeline 配置指南

## 快速开始

### 1. 配置GitHub Secrets

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加以下secrets：

#### 必需的Secrets

| Secret名称 | 说明 | 获取方式 |
|-----------|------|----------|
| `SSH_PRIVATE_KEY` | 生产服务器SSH私钥 | `cat ~/.ssh/id_rsa` |
| `PROD_HOST` | 生产服务器IP | `111.229.214.179` |
| `PROD_USER` | 生产服务器用户名 | `root` 或其他用户 |

#### 可选的Secrets

| Secret名称 | 说明 | 默认值 |
|-----------|------|--------|
| `SLACK_WEBHOOK` | Slack通知 | 无 |
| `SENTRY_DSN` | Sentry错误追踪 | 无 |

### 2. 配置GitHub审核者

新流水线只需要**人类审核者**这一个 GitHub 角色（有权在 PR 上 Approve）。
无需 `product-engineers` / `quality-engineers` team——写代码与测试由 Multica「软件工程师」智能体承担，验证由 CI 承担。

| 角色 | 谁 | 职责 |
|----------|------|--------|
| 人类审核者 | 你 / 资深工程师 | 在 PR 上 Review 并 Approve（合并闸口） |
| （可选）代码所有者 | 见 `.github/CODEOWNERS` | 自动请求审核 |

### 3. 配置生产服务器

SSH到生产服务器执行：

```bash
# 安装Docker
curl -fsSL https://get.docker.com | bash

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 创建项目目录
mkdir -p /opt/vocabmaster
cd /opt/vocabmaster

# 克隆仓库
git clone https://github.com/Astrophel-Stella/VocabMaster.git .

# 配置SSH密钥认证
# (确保GitHub Actions可以用SSH部署)
```

### 4. 测试流水线

创建一个测试PR验证流水线：

```bash
# 创建测试分支
git checkout -b test/pipeline

# 修改一个文件
echo "test" >> README.md

# 提交并push
git add .
git commit -m "test: pipeline test"
git push origin test/pipeline

# 在GitHub上创建PR
gh pr create --title "Test: Pipeline" --body "Testing AI-Native Pipeline"

# 观察流水线执行
# 应该看到以下步骤自动执行：
# 1. quality-gate (Lint + TypeCheck + 单元 + 集成 + E2E + 覆盖率≥70%)
# 2. request-architect-review (CI 全绿后请求人类审核 + AI 预审评论)
```

## 流水线详解

### 阶段1: 代码质量门禁（确定性验证）

**触发条件**: PR创建/更新

**自动化步骤**:
1. Lint检查
2. TypeScript类型检查
3. 单元测试
4. 集成测试
5. E2E测试（Playwright，生产配置）
6. 覆盖率检查 (≥70%)

**通过条件**: 所有检查通过

**自动动作**:
- 通过 → 添加标签 `✅ quality-passed`
- 失败 → 添加标签 `❌ quality-failed` + 自动评论

### 阶段2: AI 预审 + 请求人类审核

**触发条件**: 质量门禁通过

**自动动作**:
- 自动评论 AI 代码审查助手预审清单（advisory，仅供参考）
- 提示**人类审核者** Review 并 Approve

> ⚠️ AI 只留评论，**不合并**。合并批准权在人类。

### 阶段3: 自动合并

**触发条件**: 人类审核者在 PR 上 Approve → `pull_request_review` 事件自动打标签 `✅ approved`

**自动动作**:
- Squash合并PR到master
- 自动评论通知
- 自动创建部署确认Issue → @用户 (陈豪)

### 阶段4: 部署确认（人类闸口）

**触发条件**: 部署确认Issue创建

**用户操作**:
- 回复 "确认上线" → 开始部署
- 回复 "拒绝" → 取消部署

### 阶段5: 自动部署

**触发条件**: 用户回复"确认上线"

**自动化步骤**:
1. 构建Docker镜像
2. SSH到生产服务器
3. 拉取最新代码
4. 滚动更新部署
5. 健康检查
6. 冒烟测试

**自动动作**:
- 成功 → 评论部署成功 + 关闭Issue
- 失败 → 自动回滚 + 评论失败原因

## 常见问题

### Q1: 如何查看流水线执行日志？

A: 在GitHub PR页面，点击 "Checks" 标签查看详细日志。

### Q2: 测试失败怎么办？

A: 在本地修复后重新push，流水线会自动重新运行。

### Q3: 如何跳过某个阶段？

A: **禁止跳过**。这是为了保证质量，所有阶段都必须通过。

### Q4: 部署失败如何回滚？

A: 流水线会自动回滚。如果需要手动回滚：
```bash
ssh root@111.229.214.179
cd /opt/vocabmaster
git reset --hard HEAD~1
docker-compose -f docker-compose.prod.yml up -d --build
```

### Q5: 如何添加新的测试用例？

A: 在 `frontend/e2e/` 目录下创建新的测试文件，流水线会自动运行。

### Q6: 如何修改覆盖率要求？

A: 修改 `.github/workflows/ai-native-pipeline.yml` 中的覆盖率阈值。

## 性能优化

### 加速流水线

1. **使用缓存**: GitHub Actions自动缓存依赖
2. **并行测试**: 配置Playwright并行运行
3. **增量测试**: 只运行受影响的测试

### 监控指标

在仓库 Insights → Actions 中查看：
- 流水线执行时间
- 成功率
- 失败原因分布

## 安全注意事项

1. **SSH密钥管理**: 定期轮换SSH密钥
2. **最小权限**: 生产服务器用户使用最小权限
3. **审计日志**: 所有部署操作都有GitHub记录
4. **回滚测试**: 定期测试回滚流程

## 下一步

1. ✅ 配置GitHub Secrets
2. ✅ 配置生产服务器
3. ✅ 创建测试PR验证流水线
4. ⏳ 团队培训新流程
5. ⏳ 监控流水线性能

## 支持

如有问题，请联系人类审核者或在仓库创建Issue。
