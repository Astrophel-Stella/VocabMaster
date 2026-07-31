# CLAUDE.md — AI-Native Continuous Delivery Constitution

> 本文件是 AI 在本项目工作的**执行宪法**。
> **核心目标**: 完全自动化交付流程，零人工推进，人类只在部署前确认。

## 1. 项目速览

- **产品**: VocabMaster - 跨平台英语单词学习助手
- **技术栈**: React/TypeScript 前端 + Python FastAPI 后端 + Tauri 2 桌面端
- **单一真相源**:
  - 需求 → `docs/requirements/` (按版本管理)
  - 架构 → `docs/architecture.md`
  - 决策 → `docs/decisions/` (ADR)
  - 交付流水线 → ADR-0020 (单编码智能体 + 人类闸口合并；取代 ADR-0018)

## 2. AI-Native Delivery Pipeline (强制基线)

### 2.1 六阶段自动化流水线

```
┌──────────────────────────────────────────────────────────┐
│              AI-Native Continuous Delivery               │
│                  (零人工推进，全自动流转)                  │
└──────────────────────────────────────────────────────────┘

① 需求Issue创建
   └─ 自动分配给软件工程师
   └─ 自动标注类型

② 代码质量门禁
   └─ Lint + TypeCheck + 单元测试 + 集成测试
   └─ 覆盖率 ≥ 70%
   └─ 自动标注通过/失败

③ E2E测试
   └─ Playwright自动化测试
   └─ 核心路径全覆盖
   └─ 自动标注通过/失败

④ AI 代码审查助手预审 (advisory，不合并)
   └─ CI 全绿后自动预审，留结构化评论
   └─ 预审通过 → 提示人类审核者批准

⑤ 人类审核批准 + 部署确认 (人类闸口)
   └─ 人类审核者 Approve → CI 自动 squash 合并
   └─ 合并后自动创建部署确认Issue → @用户确认
   └─ 禁止 AI 批准 AI 代码合并到生产

⑥ 自动部署
   └─ 用户确认后自动构建部署
   └─ 冒烟测试验证
   └─ 成功/失败自动报告
```

### 2.2 四条硬规则

1. **自动化优先**: 所有流转由事件自动触发，禁止人工@mention推进
2. **E2E不可跳过**: 面向用户的功能必须有Playwright E2E测试
3. **测试跟随工程**: 测试用例随代码同PR提交、同PR合并
4. **部署需确认**: 部署前必须用户明确确认，AI不越权部署
5. **禁止 AI 审 AI 合并**: 验证靠确定性 CI；AI 只做 advisory 预审，合并/上线批准权在人类

## 3. 智能体角色职责

> 对标国际最佳实践（Devin / SWE-agent / Copilot Coding Agent）：
> **只有 1 个 AI 写代码，验证靠确定性 CI（不靠 AI 审 AI），合并/上线由人类闸口决定。**

### 3.1 软件工程师（唯一写代码的 AI）

**职责**: 需求规格 + 技术设计 + 业务代码 + 单元/集成/E2E 测试 + 自我修复

**触发条件**: 新Issue创建且标签为`feature`或`bug`

**工作流程**:
```
① 需求澄清 → 落 REQ 规格文档 (docs/requirements/)
② 技术设计 → 配置一致性自检 (禁止硬编码 host/URL)
③ 实现代码 + 同 PR 写单元/集成/E2E 测试 (标注 REQ-ID)
④ 本地全绿自验 (lint/typecheck/test/e2e/coverage) → 自我修复
⑤ 提 PR → 自动触发 CI，CI 挂了自己修，零人工推进
```

**完成标志**: CI 全绿、人类审核批准合并、用户确认上线、部署冒烟通过

> 说明：原"需求分析师""单元&集成测试工程师""UI&功能自动化测试工程师"已并入本角色（测试跟随代码，同 PR 提交）；原"多平台构建助手""服务端部署助手"由 GitHub Actions 承担。

### 3.2 AI 代码审查助手（advisory，不是闸口）

**职责**: CI 全绿后做预审、留结构化评论，降低人类审核负担

**触发条件**: 质量门禁（CI）全绿

**预审清单**:
- [ ] 配置一致性（无硬编码 host/URL，生产无 localhost — SOU-35 专项）
- [ ] 测试充分（E2E 用生产配置，覆盖率≥70%，bug 有复现测试）
- [ ] 代码质量（无吞异常、无 @ts-ignore、无删断言作弊）
- [ ] 架构合理、安全（权限/token 有效期/敏感信息）
- [ ] 文档随代码同 PR 更新（REQ / ADR）

**规则（关键）**:
- ✅ 只留评论，**不改代码、不合并、不部署**
- 预审通过 → 提示**人类审核者**批准
- 发现问题 → 评论说明，退回软件工程师修复
- ❌ 禁止 AI 批准 AI 代码合并到生产（避免"两个真相"，这是人类的权力）

### 3.3 人类审核者（合并闸口）

**职责**: PR 审核批准（人类 Approve）

**规则**: 批准后由 CI 自动 `gh pr merge --squash`；不批准则退回软件工程师。
AI 只做 advisory 预审，最终合并批准权在人类。

### 3.4 用户 (陈豪)

**职责**: 部署确认 (唯一人工闸口)

**触发条件**: 代码合并到master后自动创建确认Issue

**确认方式**: 在Issue中回复"确认上线"

**拒绝方式**: 回复"拒绝"

## 4. 自动化门禁体系

| 阶段 | 门禁 | 自动化方式 | 阻断规则 |
|------|------|------------|----------|
| 代码提交 | Lint通过 | GitHub Actions | ❌ 不通过禁止提交 |
| 单元测试 | 覆盖率≥70% | Vitest | ❌ 不通过禁止PR |
| 集成测试 | 全部通过 | pytest | ❌ 不通过禁止PR |
| E2E测试 | 核心路径通过(生产配置) | Playwright | ❌ 不通过禁止合并 |
| AI 预审 | advisory 评论 | AI Reviewer | ⚠️ 不阻断，仅供参考 |
| 人类审核 | 人类 Approve | GitHub Review | ❌ 不批准禁止合并 |
| 部署确认 | 用户确认 | Issue评论 | ❌ 不确认禁止部署 |
| 冒烟测试 | 核心功能可用 | Playwright | ❌ 不通过自动回滚 |

## 5. 常用命令

### 前端 (frontend/)
```bash
npm run dev              # 启动开发服务器
npm run build            # 生产构建
npm run test             # 运行单元测试
npm run test:e2e         # 运行E2E测试
npm run test:coverage    # 测试覆盖率
npm run lint             # 代码检查
npm run typecheck        # 类型检查
```

### 后端 (backend/)
```bash
uvicorn app.main:app --reload  # 启动开发服务器
pytest -v                      # 运行测试
pytest --cov=app               # 测试覆盖率
```

### 部署
```bash
docker-compose -f docker-compose.prod.yml up -d  # 部署到生产
docker-compose logs -f                           # 查看日志
```

## 6. 文档管理

### 6.1 目录结构

```
docs/
├── requirements/           # 需求文档 (按版本)
│   ├── v1.0/
│   │   ├── REQ-001-登录.md
│   │   └── REQ-002-学习.md
│   └── current/            # 当前版本
│
├── decisions/              # ADR (架构决策记录)
│   ├── 0018-ai-native-pipeline.md
│   └── ...
│
├── architecture.md         # 架构文档
└── build.md               # 构建文档
```

### 6.2 需求文档模板

```markdown
# REQ-XXX: [需求名称]

## 版本历史
| 版本 | 日期 | 变更人 | 变更内容 |
|------|------|--------|----------|
| 1.0  | YYYY-MM-DD | 产品工程师 | 初始版本 |

## 验收标准

### 正常流程
\`\`\`
Given [前置条件]
When [用户操作]
Then [预期结果]
\`\`\`

### 异常流程
\`\`\`
Given [前置条件]
When [异常操作]
Then [错误提示]
\`\`\`

## 技术设计
- API: `/api/xxx`
- 组件: `Xxx.tsx`
- 数据库: [变更说明]

## 关联Issue
- SOU-XXX
```

## 7. 质量红线

### 7.1 禁止事项

- ❌ 删断言让测试变绿
- ❌ 写死期望值
- ❌ `try/catch` 吞异常
- ❌ 跳过/删除测试
- ❌ `@ts-ignore` 忽略类型错误
- ❌ 人工@mention推进流程

### 7.2 强制事项

- ✅ 每次改代码必须跑测试
- ✅ 修bug前先写复现测试(先红后绿)
- ✅ 测试用例标注REQ-ID
- ✅ 文档随代码同PR提交
- ✅ 使用Issue模板创建需求/bug

## 8. 故障处理

### 8.1 测试失败

```
测试失败 → 自动评论报告 → 软件工程师修复 → 重新push → 自动重测
```

### 8.2 部署失败

```
部署失败 → 自动回滚 → 自动报告 → 软件工程师修复 → 重新创建部署确认
```

### 8.3 生产bug

```
用户报告 → 创建Bug Issue → 自动分配软件工程师 → 修复流程
```

## 9. 特殊场景

### 9.1 紧急修复 (Hotfix)

```bash
# 从master切hotfix分支
git checkout master
git checkout -b hotfix/xxx

# 修复后直接合并
gh pr create --base master
gh pr merge --squash

# 创建部署确认
# (流水线自动触发)
```

### 9.2 回滚

```bash
# SSH到生产服务器
ssh user@111.229.214.179

# 回滚到上一版本
cd /opt/vocabmaster
git reset --hard HEAD~1
docker-compose -f docker-compose.prod.yml up -d --build
```

## 10. 性能指标

| 指标 | 目标 | 当前 |
|------|------|------|
| 部署频率 | 每周 ≥ 2次 | - |
| 变更前置时间 | ≤ 1天 | - |
| 平均恢复时间 | ≤ 1小时 | - |
| 变更失败率 | ≤ 5% | - |
| 测试覆盖率 | ≥ 70% | - |

## 11. 参考

- ADR-0018: AI-Native Continuous Delivery Pipeline
- ADR-0015: 交付流水线北极星蓝图 (旧版)
- [Google DORA State of DevOps](https://dora.dev/)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)

---

**版本**: v2.0 (AI-Native)
**更新日期**: 2026-07-31
**核心变化**: 从人工推进转向完全自动化流水线
