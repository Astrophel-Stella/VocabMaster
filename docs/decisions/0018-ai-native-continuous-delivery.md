# ADR-0018: AI原生持续交付流水线(AI-Native Continuous Delivery Pipeline)

## 状态
提议 (2026-07-31)

## 背景

当前流水线存在严重问题：
1. **人工推进依赖**：每个环节需要人工@mention下一个智能体
2. **角色冗余**：需求分析师、构建助手、部署助手可合并
3. **流程断裂**：Issue状态无法自动流转
4. **产物分散**：需求、代码、测试、部署记录未统一管理

参考国际最佳实践：
- **Google DORA State of DevOps**: 高绩效团队的核心实践
- **GitLab Auto DevOps**: 端到端自动化模板
- **GitHub Flow**: 简化的分支策略
- **GitOps (ArgoCD/Flux)**: 以Git为源的部署
- **Feature Flags**: 解耦部署和发布

## 决策

### 1. 智能体角色重组

**Before (7个角色)**：
```
需求分析师 → 研发工程师 → 测试工程师 → 构建助手 → 架构师 → 部署助手 → 用户
```

**After (3个角色 + 自动化流水线)**：
```
┌─────────────────────────────────────────────────────────┐
│              AI-Native Continuous Delivery              │
└─────────────────────────────────────────────────────────┘
                          ↓
    ┌─────────────────────┼─────────────────────┐
    ↓                     ↓                     ↓
[产品工程师]         [质量工程师]          [架构师]
    ↓                     ↓                     ↓
 需求+研发            测试+验证            审核+决策
```

**角色职责**：

| 角色 | 职责 | 触发条件 | 自动流转 |
|------|------|----------|----------|
| **产品工程师** | 需求分析 + 代码实现 + 单元测试 | 用户需求 → Issue创建 | 完成后自动创建QA Issue |
| **质量工程师** | E2E测试 + 回归测试 + 安全测试 | 代码合并 → 自动触发 | 完成后自动@架构师 |
| **架构师** | 代码审核 + 架构决策 + 合并master | QA通过 → 自动通知 | 合并后自动触发部署 |
| **用户(您)** | 上线确认 | 部署前唯一闸口 | 确认后自动部署 |

**关键改变**：
1. **需求分析师** → 合并到产品工程师（需求与实现合一）
2. **构建助手** → 自动化流水线（GitHub Actions）
3. **部署助手** → GitOps自动化（ArgoCD/Flux模式）

### 2. 流水线自动化设计

```yaml
# .github/workflows/ai-native-pipeline.yml
name: AI-Native Pipeline

on:
  pull_request:
    types: [opened, synchronize, labeled]
  push:
    branches: [master]

jobs:
  # ── 阶段1: 代码质量门禁 ──
  quality-gate:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      
      # 自动化代码检查
      - name: Lint & Format Check
        run: |
          npm run lint
          npm run format:check
      
      # 自动化单元测试
      - name: Unit Tests
        run: npm run test:unit
      
      # 自动化集成测试
      - name: Integration Tests
        run: npm run test:integration
      
      # 覆盖率门禁
      - name: Coverage Gate
        run: |
          npm run test:coverage
          if [ $(cat coverage/coverage.txt) -lt 70 ]; then
            echo "❌ Coverage < 70%"
            exit 1
          fi
      
      # 自动标注通过
      - name: Label PR
        if: success()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              labels: ['✅ quality-gate-passed']
            })

  # ── 阶段2: E2E测试 ──
  e2e-tests:
    runs-on: ubuntu-latest
    needs: quality-gate
    if: contains(github.event.pull_request.labels.*.name, '✅ quality-gate-passed')
    steps:
      - uses: actions/checkout@v4
      
      # 启动测试环境
      - name: Start Test Environment
        run: |
          docker-compose -f docker-compose.test.yml up -d
          sleep 10
      
      # 运行E2E测试
      - name: E2E Tests
        run: npm run test:e2e
      
      # 自动标注通过
      - name: Label PR
        if: success()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              labels: ['✅ e2e-passed']
            })
      
      # 失败自动评论
      - name: Report Failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: '## ❌ E2E测试失败\n\n请产品工程师修复后重新提交。'
            })

  # ── 阶段3: 架构师审核 ──
  architect-review:
    runs-on: ubuntu-latest
    needs: e2e-tests
    if: contains(github.event.pull_request.labels.*.name, '✅ e2e-passed')
    steps:
      - name: Request Review
        uses: actions/github-script@v7
        with:
          script: |
            // 自动@架构师
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: '## 📋 等待架构师审核\n\n@架构师 请审核此PR。'
            })
            
            // 自动分配审核人
            github.rest.pulls.requestReviewers({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
              reviewers: ['架构师']
            })

  # ── 阶段4: 自动合并 ──
  auto-merge:
    runs-on: ubuntu-latest
    needs: architect-review
    if: |
      contains(github.event.pull_request.labels.*.name, '✅ e2e-passed') &&
      contains(github.event.pull_request.labels.*.name, '✅ architect-approved')
    steps:
      - name: Merge PR
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.pulls.merge({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
              merge_method: 'squash'
            })
            
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: '## ✅ 已合并到master\n\n等待用户确认上线。'
            })

  # ── 阶段5: 部署确认 ──
  deploy-confirmation:
    runs-on: ubuntu-latest
    needs: auto-merge
    if: github.event_name == 'push' && github.ref == 'refs/heads/master'
    steps:
      - name: Request Deployment Confirmation
        uses: actions/github-script@v7
        with:
          script: |
            // 创建部署确认Issue
            const issue = await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🚀 部署确认 - ${new Date().toISOString().split('T')[0]}`,
              body: `## 部署信息\n\n- 分支: master\n- 提交: ${context.sha}\n- 时间: ${new Date().toISOString()}\n\n## 请确认\n\n回复 "确认上线" 开始部署。`,
              labels: ['deployment-confirmation']
            })
            
            // @用户
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: issue.data.number,
              body: '@陈豪 请确认是否上线。'
            })

  # ── 阶段6: 自动部署 ──
  auto-deploy:
    runs-on: ubuntu-latest
    if: |
      github.event_name == 'issues' &&
      github.event.action == 'created' &&
      contains(github.event.issue.labels.*.name, 'deployment-confirmation') &&
      contains(github.event.comment.body, '确认上线')
    steps:
      - uses: actions/checkout@v4
      
      - name: Build
        run: |
          docker build -t vocabmaster:${{ github.sha }} .
      
      - name: Deploy
        run: |
          # 部署到生产
          docker-compose -f docker-compose.prod.yml up -d
          
          # 等待服务启动
          sleep 30
          
          # 健康检查
          curl -f http://localhost:8000/health || exit 1
      
      - name: Smoke Test
        run: npm run test:smoke
      
      - name: Report Success
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: '## ✅ 部署成功\n\n- URL: http://111.229.214.179\n- 时间: ' + new Date().toISOString()
            })
            
            github.rest.issues.update({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              state: 'closed'
            })
```

### 3. Issue生命周期自动化

```yaml
# .github/workflows/issue-lifecycle.yml
name: Issue Lifecycle Automation

on:
  issues:
    types: [opened, labeled, closed]

jobs:
  # ── 新Issue自动处理 ──
  new-issue:
    runs-on: ubuntu-latest
    if: github.event.action == 'opened'
    steps:
      - name: Auto-label
        uses: actions/github-script@v7
        with:
          script: |
            const body = context.payload.issue.body || ''
            const labels = []
            
            // 自动识别Issue类型
            if (body.includes('需求') || body.includes('功能')) {
              labels.push('feature')
            }
            if (body.includes('bug') || body.includes('错误')) {
              labels.push('bug')
            }
            if (body.includes('优化') || body.includes('改进')) {
              labels.push('enhancement')
            }
            
            // 自动分配
            if (labels.includes('feature')) {
              await github.rest.issues.addAssignees({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                assignees: ['产品工程师']
              })
            }
            
            if (labels.length > 0) {
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                labels: labels
              })
            }

  # ── 状态流转 ──
  status-transition:
    runs-on: ubuntu-latest
    if: github.event.action == 'labeled'
    steps:
      - name: Move to In Progress
        if: contains(github.event.label.name, 'in-progress')
        uses: actions/github-script@v7
        with:
          script: |
            // 创建子Issue
            if (context.payload.issue.labels.some(l => l.name === 'feature')) {
              await github.rest.issues.create({
                owner: context.repo.owner,
                repo: context.repo.repo,
                title: `QA: ${context.payload.issue.title}`,
                body: `父Issue: #${context.issue.number}\n\n## 测试任务\n\n- [ ] E2E测试\n- [ ] 回归测试`,
                labels: ['qa'],
                assignees: ['质量工程师']
              })
            }
```

### 4. 文档统一管理

**目录结构重组**：
```
VocabMaster/
├── docs/
│   ├── requirements/           # 需求文档(按版本)
│   │   ├── v1.0/
│   │   │   ├── REQ-001-登录.md
│   │   │   └── REQ-002-学习.md
│   │   └── current/            # 当前版本
│   │
│   ├── decisions/              # ADR
│   │   ├── 0018-ai-native-pipeline.md
│   │   └── ...
│   │
│   ├── architecture.md         # 架构文档
│   └── build.md               # 构建文档
│
├── .github/
│   ├── workflows/              # 自动化流水线
│   │   ├── ai-native-pipeline.yml
│   │   └── issue-lifecycle.yml
│   │
│   └── ISSUE_TEMPLATE/         # Issue模板
│       ├── feature.md
│       ├── bug.md
│       └── deployment.md
│
├── tests/
│   ├── unit/                   # 单元测试
│   ├── integration/            # 集成测试
│   ├── e2e/                    # E2E测试
│   └── smoke/                  # 冒烟测试
│
└── deployments/
    ├── prod/                   # 生产环境配置
    │   ├── docker-compose.yml
    │   └── .env
    └── staging/                # 预发环境配置
```

### 5. 质量门禁矩阵

| 阶段 | 门禁 | 自动化方式 | 阻断规则 |
|------|------|------------|----------|
| **代码提交** | Lint通过 | GitHub Actions | ❌ 不通过禁止提交 |
| **单元测试** | 覆盖率≥70% | Vitest | ❌ 不通过禁止PR |
| **集成测试** | 全部通过 | pytest | ❌ 不通过禁止PR |
| **E2E测试** | 核心路径通过 | Playwright | ❌ 不通过禁止合并 |
| **架构审核** | 架构师批准 | GitHub Review | ❌ 不批准禁止合并 |
| **部署确认** | 用户确认 | Issue评论 | ❌ 不确认禁止部署 |
| **冒烟测试** | 核心功能可用 | Playwright | ❌ 不通过自动回滚 |

## 实施方案

### Phase 1: 自动化流水线搭建 (本周)

**任务清单**：
- [ ] 创建 `.github/workflows/ai-native-pipeline.yml`
- [ ] 创建 `.github/workflows/issue-lifecycle.yml`
- [ ] 配置GitHub Secrets (SSH密钥、API密钥)
- [ ] 创建Issue模板
- [ ] 测试流水线

### Phase 2: 智能体指令更新 (下周)

**任务清单**：
- [ ] 更新产品工程师指令
- [ ] 更新质量工程师指令
- [ ] 更新架构师指令
- [ ] 删除冗余智能体(需求分析师、构建助手、部署助手)

### Phase 3: 文档迁移 (下下周)

**任务清单**：
- [ ] 迁移需求文档到 `docs/requirements/`
- [ ] 更新 `CLAUDE.md`
- [ ] 创建部署文档

## 后果

### 正面
- **零人工推进**：所有流转由事件自动触发
- **角色精简**：从7个角色减少到3个
- **质量提升**：5道自动化门禁拦截问题
- **效率提升**：交付周期从5天缩短到1天

### 负面
- **初期投入**：需要2周搭建自动化流水线
- **学习成本**：团队需要适应新流程

## 成本评估

| 项目 | 工作量 | 说明 |
|------|--------|------|
| GitHub Actions配置 | 8小时 | 流水线配置 |
| Issue模板创建 | 2小时 | 自动化模板 |
| 智能体指令更新 | 4小时 | 角色职责调整 |
| 文档迁移 | 4小时 | 目录重组 |
| 测试验证 | 6小时 | 端到端测试 |
| **总计** | **24小时** | 约3天工作量 |

## 相关

- ADR-0015: 交付流水线北极星蓝图(旧版)
- ADR-0016: 部署门禁清单
- ADR-0017: 多环境E2E测试策略

## 参考

- [Google DORA State of DevOps](https://dora.dev/)
- [GitLab Auto DevOps](https://docs.gitlab.com/ee/topics/autodevops/)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [ArgoCD - GitOps](https://argo-cd.readthedocs.io/)
- [Feature Flags Best Practices](https://martinfowler.com/articles/feature-toggles.html)

## 历史

- 2026-07-31: 提议
