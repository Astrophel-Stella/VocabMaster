# AI-Native 流水线人类闸口 · 标准做法手册

> 可复用资产。任何「单编码 AI + 确定性 CI + 人类闸口」的项目可直接照搬本手册配置合并与上线闸口。
> 决策依据见 ADR-0021。

## 一句话原则

**闸口动作必须是「AI 无法伪造」的平台原生人类动作，而不是「AI 也能执行」的脚本 / 评论。**

判断一道闸口是否合格，只问一句：**AI 持有仓库 token，能不能自己完成这个动作？** 能 → 不合格。

## 反模式（不要这样做）

| 反模式 | 为什么错 |
|---|---|
| 评论口令（检测到某句话就自动合并） | 口令是明文，AI 也能发这句话 → 自审自批 |
| 脚本 `pulls.merge()` 自动合并 | 合并权在 token 手里，AI 能触发 |
| 靠 `author_association` / `user.type != Bot` 判断「是不是人」 | 都是 token 身份，无法证明背后是活人 |
| 靠 GITHUB_TOKEN 合并的 push 触发下游 job | GitHub 防递归，根本不触发 |

## 标准做法（照此配置）

### 闸口一：合并代码 = 人类点绿色 Merge 按钮

**workflow 侧**：不要写任何 `pulls.merge()`。CI 全绿后只留一条 advisory 评论提示人类去点 Merge。

**人类侧**：在 PR 页面看完 AI 预审 + CI 全绿，**亲手点 "Merge pull request"**。

- 仓库主人点自己仓库的 Merge 不受「作者不能 Approve 自己 PR」限制——那条规则只约束 **review**，不约束 **merge 按钮**。
- （可选硬化）Settings → Branches → 分支保护 → Require status checks = 质量门禁标签，门禁未过时按钮不可点。

### 闸口二：建部署确认 Issue = 人类的 Merge push 触发

`create-deployment-issue` 用 `on: push`（master）。人类点 Merge 的 push 归属人类账号（非 GITHUB_TOKEN），会**正常触发**。无需任何额外机制。

### 闸口三：上线部署 = GitHub Environment 审批

**workflow 侧**：部署 job 加一行——

```yaml
deploy-to-production:
  runs-on: ubuntu-latest
  environment: production-gate     # ← 就这一行
  if: |
    github.event_name == 'issue_comment' &&
    contains(github.event.issue.labels.*.name, 'deployment-confirmation') &&
    contains(github.event.comment.body, '确认上线')
```

**仓库配置侧**（一次性）：

1. Settings → Environments → **New environment** → 命名 `production-gate`
2. 进入该环境 → **Deployment protection rules** →
3. 勾选 **Required reviewers** → 搜索框加入人类审核者
4. ⚠️ **取消勾选 `Prevent self-review`**（见下方「单人仓库的坑」）
5. **Save protection rules**

**运行时**：用户回复「确认上线」→ 部署 job 进入 `waiting` 状态并暂停 → Actions 页出现 **"Review deployments"** → 人类勾选 `production-gate` → 点 **Approve and deploy** → 才真正部署。

- `GITHUB_TOKEN` / 自动身份**无资格**批准环境部署（平台级强制），AI 无法自行放行。

## 单人仓库的坑（必读）

**场景**：作者 = 审核者 = 管理员，都是同一个账号。

| 坑 | 现象 | 解法 |
|---|---|---|
| 作者不能 Approve 自己 PR | 找不到 Review changes 里的 Approve | 合并**不用 Approve**，直接点 Merge 按钮 |
| `Prevent self-review` 默认开启 | 部署你触发、审批也是你 → 被自己挡掉，永久卡 `waiting` | Environment 里**取消勾选** `Prevent self-review` |
| private 仓库 + 免费账号无 Required reviewers | Environment 页面根本没有 protection rules 区块 | 仓库转 public / 升级 Pro；或临时去掉 `environment:` 只靠 Merge 闸口 |

> 多人团队相反：**保持** `Prevent self-review` 开启，强制触发者与审批者是不同的人，闸口更强。

## 迁移到下一个项目的三步

1. 复制部署 job 的 `environment: production-gate` 写法 + 本手册的 Environment 配置步骤。
2. 确认 workflow 里**没有任何** `pulls.merge()` / 口令检测 / `pull_request_review` 合并触发。
3. 用一次真实 PR 走查：人类点 Merge → 自动建部署 Issue → 确认上线 → job 停在 `waiting` → 人类 Approve → 部署。**只要 job 会停下来等审批，闸口就成立。**

## 验证脚本（确认闸口真的挡住了 AI）

部署触发后，用以下命令确认 job 卡在审批、且只有人类能批：

```bash
gh api repos/<owner>/<repo>/actions/runs/<run_id>/pending_deployments \
  --jq '.[] | {env: .environment.name, reviewers: [.reviewers[].reviewer.login], current_user_can_approve}'
# 期望: env=production-gate, reviewers 含人类, 且 job 状态为 waiting
```
