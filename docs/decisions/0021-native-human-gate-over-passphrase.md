# ADR-0021: 用 GitHub 原生人类闸口取代评论口令合并（Native Human Gate over Comment Passphrase）

## 状态
已采纳 (2026-08-01)，取代 ADR-0020 第 4 点「合并」机制

## 背景

ADR-0020 确立了「合并与上线是人类闸口」的方向，方向正确。但其落地实现（`ai-native-pipeline.yml`）在真实运行中暴露两个设计缺陷：

### 缺陷 1（安全，致命）：评论口令闸口可被 AI 绕过
ADR-0020 设想「人类在 PR 上 Approve → 自动打 `✅ approved` 标签 → 自动 squash 合并」。但 GitHub 有一条规则：**PR 作者不能 Approve 自己的 PR**。当仓库是「单人 = 作者 = 审核者」场景时，人类无法对 AI 提的 PR 点 Approve（作者与审核者是同一账号）。

为绕开它，实现里加了一个**评论口令**：检测到 PR 评论包含「酸豇豆确认通过」就由脚本调 `pulls.merge()` 自动合并。这是一个**反模式**：

- 口令是**明文字符串**，写在 workflow 里人人可见。
- 持有仓库 token 的 **AI 自己也能发这条评论** → 等于 AI 自审自批。
- `author_association ∈ {OWNER,MEMBER,COLLABORATOR}` + `user.type != 'Bot'` 都是「谁持有 token 谁就是谁」，无法证明背后是活人。

实证事故：PR #39 曾因 AI 自行发出该口令而被自动合并，越过了本应属于人类的闸口。**身份即权限、口令即明文**，这道闸口形同虚设。

### 缺陷 2（可靠性）：GITHUB_TOKEN 合并的 push 不触发后续 workflow
「建部署确认 Issue」设计为 `on: push` 触发。但 GitHub 有防递归机制：**用 `GITHUB_TOKEN` 产生的 push 不会再触发任何 workflow**。由于合并是脚本用 `GITHUB_TOKEN` 调 `pulls.merge()` 完成的，合并后的 push 不触发 → 部署确认 Issue 漏建，只能靠复用旧 Issue 兜底，链路脆弱。

### 根因
两个缺陷同源：**把「合并」这个人类闸口交给了 AI 脚本用 token 去执行**。一旦执行权在 token 手里，AI 就能伪造闸口动作（缺陷1），而 token 触发的事件又受平台防递归限制（缺陷2）。

## 决策

**合并与上线两道闸口，改用 GitHub 平台原生、AI 无法伪造的人类动作承载。彻底移除评论口令与脚本自动合并。**

### 1. 合并闸口 = 人类亲手点绿色 "Merge" 按钮
- 删除 `finalize-approval` job、评论口令逻辑、`pulls.merge()` 脚本、`pull_request_review` 触发器。
- CI 全绿后，人类审核者看完 AI 预审报告，**在 PR 页面亲手点 "Merge"**。
- 仓库主人点自己仓库的 Merge 按钮不受「作者不能 Approve 自己」限制（那条规则只约束 review，不约束 merge）。
- **AI 的 token 不会去点这个按钮**（workflow 里没有任何 merge 调用），合并权真正锁在人类手里。

### 2. 建部署确认 Issue 由「人类的 Merge push」触发
- 人类点 Merge 产生的 push **归属于人类账号**（不是 GITHUB_TOKEN），会正常触发 `on: push` 的 `create-deployment-issue`。缺陷 2 随之消失。

### 3. 上线闸口 = GitHub Environment 审批（Required reviewers）
- `deploy-to-production` job 挂 `environment: production-gate`。
- 该环境配置 **Required reviewers = 人类审核者**。
- 用户回复「确认上线」只是**启动**流程；job 会**暂停**，在 Actions 页弹出 "Review deployments"，必须人类点 **Approve and deploy** 才继续。
- **`GITHUB_TOKEN` / 自动身份无资格批准环境部署**（GitHub 平台级强制），AI 无法自行放行上线。

### 4. 单人仓库的关键配置（坑）
Environment 的 **`Prevent self-review`** 默认开启，含义是「触发部署的人不能是审批人」。单人场景下部署由本人触发、审批也需本人 → 会把自己挡掉导致死锁。**单人仓库必须取消勾选 `Prevent self-review`。**
（多人团队应保持开启，让触发者与审批者分离。）

## 取代关系

| ADR-0020 原设计 | ADR-0021 现设计 |
|---|---|
| 人类 Approve → 自动打 `✅ approved` 标签 → 脚本 `pulls.merge()` 自动合并 | 人类亲手点绿色 Merge 按钮，脚本不合并 |
| 评论口令「酸豇豆确认通过」兜底（应对作者不能自审） | 删除；Merge 按钮天然不受该限制 |
| 部署 Issue 靠 GITHUB_TOKEN 合并 push 触发（实际不触发） | 靠人类 Merge push 触发（正常触发） |
| 上线：回复「确认上线」即部署 | 上线：回复「确认上线」启动 + Environment 审批 Approve |

ADR-0020 的其余决策（单编码 Agent 全闭环、确定性 CI、AI 预审 advisory、人只在闸口）**继续有效**，本 ADR 仅精化「合并 / 上线」两道闸口的实现。

## 现行闭环（更新）

```
需求 Issue → 软件工程师(规格+代码+测试+自修复) → PR
  → CI 质量门禁(确定性) → AI 预审(advisory)
  → 🧍人类亲手点 Merge 按钮(闸口, AI 不碰)
  → 人类的 push 触发 → 自动建部署确认 Issue
  → 🧍用户回复"确认上线"(启动) → Environment 审批暂停
  → 🧍人类点 "Approve and deploy"(闸口, AI 无资格) → 自动部署 → 冒烟 → 失败自动回滚
```

三道人类闸口：**点 Merge** + **确认上线** + **点 Approve 部署**。前后两道均为 AI 无法伪造的平台原生动作。

## 落地清单（本次已执行）

- [x] `ai-native-pipeline.yml`：删除 `finalize-approval` job（口令 + 自动合并）
- [x] 删除 `pull_request_review` 触发器（已无 job 使用）
- [x] `deploy-to-production` job 挂 `environment: production-gate`
- [x] `request-architect-review` 提示语改为「亲手点 Merge 按钮」
- [x] 仓库 Settings → Environments 建 `production-gate`，Required reviewers = 人类，取消 `Prevent self-review`
- [x] 全流程实证跑通：PR #43 人类点 Merge → 自动建 Issue #44 → 确认上线 → Environment Approve → 部署 + 冒烟全绿，生产 http://111.229.214.179 在线
- [x] ADR-0020 第 4 点标记为被本 ADR 取代

## 参考

- GitHub Docs: Using environments for deployment / Required reviewers（平台原生部署审批，token 无资格批准）
- GitHub Docs: 作者不能审批自己的 PR（review 约束不适用于 merge 按钮）
- GitHub Docs: GITHUB_TOKEN 产生的事件不触发 workflow（防递归）
- 教训来源：本仓库 PR #39 AI 自发口令自动合并事故
