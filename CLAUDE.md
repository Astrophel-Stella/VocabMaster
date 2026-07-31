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
  - 交付流水线 → ADR-0018

## 2. AI-Native Delivery Pipeline (强制基线)

### 2.1 六阶段自动化流水线

```
┌──────────────────────────────────────────────────────────┐
│              AI-Native Continuous Delivery               │
│                  (零人工推进，全自动流转)                  │
└──────────────────────────────────────────────────────────┘

① 需求Issue创建
   └─ 自动分配给产品工程师
   └─ 自动标注类型

② 代码质量门禁
   └─ Lint + TypeCheck + 单元测试 + 集成测试
   └─ 覆盖率 ≥ 70%
   └─ 自动标注通过/失败

③ E2E测试
   └─ Playwright自动化测试
   └─ 核心路径全覆盖
   └─ 自动标注通过/失败

④ 架构师审核
   └─ E2E通过后自动@架构师
   └─ 架构师批准后自动合并

⑤ 部署确认 (唯一人工闸口)
   └─ 合并后自动创建确认Issue
   └─ @用户确认

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

## 3. 智能体角色职责

### 3.1 产品工程师

**职责**: 需求分析 + 代码实现 + 单元测试

**触发条件**: 新Issue创建且标签为`feature`或`bug`

**工作流程**:
```
① 分析需求 → 输出设计文档
② 实现代码 → 编写业务逻辑
③ 编写单元测试 → 标注REQ-ID
④ 提交PR → 自动触发流水线
```

**完成标志**: PR通过所有自动化测试

### 3.2 质量工程师

**职责**: E2E测试 + 回归测试 + 安全测试

**触发条件**: 代码合并到master

**工作流程**:
```
① 运行E2E测试套件
② 验证核心路径
③ 生成测试报告
④ 自动@架构师审核
```

**完成标志**: 架构师批准并合并PR

### 3.3 架构师

**职责**: 代码审核 + 架构决策 + 合并master

**触发条件**: E2E测试通过

**审核清单**:
- [ ] 代码质量符合规范
- [ ] 测试覆盖关键路径
- [ ] 架构设计合理
- [ ] 文档更新完整

**合并规则**:
- 通过 → 执行 `gh pr merge --squash`
- 不通过 → 评论说明问题，退回产品工程师

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
| E2E测试 | 核心路径通过 | Playwright | ❌ 不通过禁止合并 |
| 架构审核 | 架构师批准 | GitHub Review | ❌ 不批准禁止合并 |
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
测试失败 → 自动评论报告 → 产品工程师修复 → 重新push → 自动重测
```

### 8.2 部署失败

```
部署失败 → 自动回滚 → 自动报告 → 产品工程师修复 → 重新创建部署确认
```

### 8.3 生产bug

```
用户报告 → 创建Bug Issue → 自动分配产品工程师 → 修复流程
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
