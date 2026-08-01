# ADR-0020: 单编码智能体 + 人类闸口合并（Single SWE-Agent, Human-Gated Merge）

## 状态
已采纳 (2026-07-31)，取代 ADR-0018 的角色设计。
**第 4 点「合并与上线是人类闸口」的实现已被 ADR-0021 取代**（评论口令 + 脚本自动合并 → GitHub 原生人类闸口）。其余决策继续有效。

## 背景

ADR-0018 把交付流程从 7 个角色精简到 3 个（产品工程师 / 质量工程师 / 架构师）。方向正确，但复盘发现仍受"多智能体流水线接力"的旧思路影响，有两处不符合国际最佳实践（Devin / SWE-agent / GitHub Copilot Coding Agent / OpenHands / CodeRabbit）：

1. **把测试拆成独立"质量工程师"Agent**——国际主流是"测试跟随代码"（test-follows-code）：写业务代码的智能体在同一个 PR 里把单元/集成/E2E 测试一起写，由确定性 CI 验证。独立测试 Agent 只增加接力等待与 token 浪费。
2. **让"架构师 Agent 自动合并"到 master**——没有任何严肃团队让 AI 批准 AI 的代码合并到生产。这是"两个真相"问题：AI 会为了过审优化错的东西。SOU-35（localhost 硬编码上线）的根因正是四道防线全是"软判断"，没有一道确定性门禁 + 人类闸口。

## 决策

### 1. 只保留 1 个写代码的 AI：软件工程师
一个能干的编码智能体独立跑完整条链：需求澄清 → REQ 规格 → 技术设计 → 业务代码 → 单元/集成/E2E 测试（同 PR）→ 本地全绿自验 → 自我修复 → 提 PR。

原"需求分析师""单元&集成测试工程师""UI&功能自动化测试工程师"并入本角色；原"多平台构建助手""服务端部署助手"由 GitHub Actions 承担。

### 2. 验证靠确定性 CI，不靠 AI 审 AI
正确性由 Lint / TypeCheck / 单元 / 集成 / E2E（生产配置）/ 覆盖率≥70% 门禁证明，不靠任何 AI 的"一眼看出来"。

### 3. AI 代码审查助手是 advisory，不是闸口
CI 全绿后 AI 做预审、留结构化评论以降低人类审核负担，但**不改代码、不合并、不部署**。

### 4. 合并与上线是人类闸口
- **合并**：人类审核者在 PR 上 Approve → GitHub Actions 自动打 `✅ approved` 标签 → 自动 squash 合并。AI 无法自行 Approve，合并权锁在人类。
- **上线**：合并后自动创建部署确认 Issue，用户回复"确认上线"才部署 → 冒烟测试 → 失败自动回滚。

### 5. 人只在闸口（gate），不在推进（push）
消灭的是"人工 @mention 推进下一个智能体"，不是"人工审批闸口"。流转全靠 GitHub 事件。**禁止智能体用 @mention 互相接力推进。**

## 角色对照

| 原（ADR-0018） | 现（ADR-0020） | 处置 |
|---|---|---|
| 产品工程师 | 软件工程师 | 升级为全闭环，含全部测试 |
| 质量工程师 | —（并入软件工程师 + CI） | 删除 |
| 架构师（自动合并） | AI 代码审查助手（advisory）+ 人类审核者 | 拆分：AI 只预审，人类批准合并 |

## 现行闭环

```
需求 Issue → 软件工程师(规格+代码+测试+自修复) → PR
  → CI 质量门禁(确定性) → AI 预审(advisory)
  → 🧍人类 Approve(闸口) → 自动合并
  → 🧍用户"确认上线"(闸口) → 自动部署 → 冒烟 → 失败自动回滚
```

唯二人类闸口：**PR 审核批准** + **上线确认**。其余零人工推进。

## 落地清单（本次已执行）

- [x] Multica「研发工程师」→ 升级重写为「软件工程师」（全闭环指令）
- [x] Multica「项目管理&架构师」→ 重定位为「AI 代码审查助手」（advisory + squad leader）
- [x] 交付小队移除并归档 5 个冗余智能体（需求分析师 / 单元&集成测试工程师 / UI&功能自动化测试工程师 / 多平台构建助手 / 服务端部署助手）
- [x] 交付小队更名「AI-Native 交付小队」并重写工作流
- [x] 仓库 CLAUDE.md、feature/bug 模板、ai-native-pipeline.yml 同步修正（含 `pull_request_review` approve 触发合并）
- [x] ADR-0018 标记为 Superseded

## 参考

- GitHub Copilot Coding Agent / Devin / SWE-agent / OpenHands：单编码 Agent 全闭环
- CodeRabbit / Claude in PR：AI advisory review，人类批准
- Google DORA / Continuous Delivery：确定性门禁 + GitOps + 冒烟 + 自动回滚
