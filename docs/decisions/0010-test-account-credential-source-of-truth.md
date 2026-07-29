# 0010. 测试账号凭据单一真相源：统一为 `testuser / testpass123`

- 状态: 已采纳
- 日期: 2026-07-29

## 背景

VocabMaster 的测试账号凭据散落在多处表面（数据库初始化脚本、启动脚本提示、前端登录页提示、README、ADR-0008 示例、测试报告、前后端测试用例），存在两套互相矛盾的凭据：

| 凭据 | 出现位置 |
|---|---|
| `testuser / testpass123` | `backend/init_db.py`、`backend/tests/test_auth.py`、`backend/tests/test_progress.py`、`frontend/src/components/LoginPanel.tsx`、`frontend/src/hooks/useAuth.test.ts`、`scripts/dev.bat`、`scripts/dev.ps1`、`scripts/dev.sh`、`README.md`、`docs/test_report.md`、`docs/decisions/0008-jwt-authentication.md` |
| `test / 123456` | 仅存在于一个未合并的工作分支（`agent/agent/6e3a9d60`，提交 `60b4098`），从未进入 master |

### 为什么会冒出 `test / 123456`？

仓库 master 历史（`6fd1062` 重构 + `cdc76f5` README 更新）从一开始就统一为 `testuser / testpass123`，且全套后端/前端测试用例（`test_auth.py`、`test_progress.py`、`useAuth.test.ts`）都以该凭据为断言基准，需求 `REQ-AUTH-003` 已据此验收为「✅ 已验收」。

`test / 123456` 是某次单点修复尝试（提交 `60b4098`，"fix: 修复 4 个 UX bug"）中，作者把 init_db / README / LoginPanel / 启动脚本**四处表面文字**改成了简洁易记的 `test / 123456`，但：

1. **未同步测试用例**：`test_auth.py`、`test_progress.py`、`useAuth.test.ts` 仍硬编码 `testuser / testpass123`。若该分支合并，登录测试会立刻全红（先红后绿的"红"留在了交付里）。
2. **未进入 master**：该提交只存在于本地分支 `agent/agent/6e3a9d60`，`origin/master`（tip `8a07c75`）从未包含它。当前 master 全仓无任何 `123456` 字样。

> 触发本次决策的 Issue（SOU-11）描述称"`init_db.py` 实际创建的测试账号为 `testuser/testpass123`，而 Issue 提到测试账号为 `test/123456`"。经核查，"`test/123456`" 这个说法**在当前 master 代码与文档中不存在**，只来自上述未合并的旁路分支与历史 Issue 文本。换句话说，master 上文档与实现**本就一致**，SOU-11 描述的"不一致"在 master 上并不成立。

## 决策

**统一采用 `testuser / testpass123` 作为测试账号的单一真相源**，覆盖所有表面：

- 代码层（数据库初始化、API/Service 调用）
- 文档层（README、ADR、测试报告）
- 用户可见层（前端登录页提示、启动脚本提示）
- 测试层（后端 pytest、前端 vitest 的断言凭据）

**否决 `test / 123456` 方案**：不采纳 `60b4098` 那条旁路分支的凭据变更，该分支不予合并；如未来确需简化凭据，须按本 ADR 的"凭据变更协议"全表面同步后再合入。

## 理由

### 为什么选 `testuser / testpass123` 而不是 `test / 123456`？

1. **它是已验收的现状基线**。`REQ-AUTH-003`（用户登录）已凭 `testuser / testpass123` 通过测试并升级为「✅ 已验收」（测试锚点 `backend/tests/test_auth.py::test_login_user`）。改凭据等于推翻一条已验收需求，按 `CLAUDE.md` §6 的状态纪律，需重走"有通过的测试证明其满足 AC"才能再升回 ✅，代价不成比例。

2. **测试用例已深度绑定该凭据**。`test_progress.py` 用 `testuser`~`testuser8` 共 8 个账号、`useAuth.test.ts` 与 `test_auth.py` 全部以 `testuser / testpass123` 为断言对象。改 `test / 123456` 需同步改 ~30 处测试断言，且会触碰"判官"（测试文件），按 `CLAUDE.md` §3 硬约定 4，改测试要单独说明、风险高、收益低。

3. **`test / 123456` 是弱口令反模式**。`123456` 是公开泄露口令榜单常客，即便仅用于测试库，也不应作为"简洁易记"的优选写进代码与文档，避免被复制到非测试环境。

4. **凭据简化不是架构目标**。测试账号的核心属性是"稳定、可追溯、与测试同源"，而非"短"。`testuser / testpass123` 已满足，换名只增加漂移面，不创造价值。

### 为什么写本 ADR（而不只是口头统一）？

SOU-11 的根因是"凭据散落多处、无单一真相源、旁路修复未全表面同步就提交"。按 `CLAUDE.md` §6「不留第二份真相」与 `docs/decisions/README.md`「架构级/依赖级取舍先写 ADR」，测试账号凭据虽小，但它是**跨代码+文档+测试+用户可见表面的横向约束**，属于"一处变更须多处同步"的架构级纪律，故落 ADR 固化单一真相源与变更协议，防止 `60b4098` 式的半同步重演。

## 后果

### 好处

1. master 全表面凭据本就一致，无需任何代码/文档改动即可交付，零回归风险。
2. 已验收需求 `REQ-AUTH-003` 不被推翻，验收链路保持完整。
3. 未来任何人想改测试账号，有明确协议可循，不会再出现"改了 init_db 没改测试"的半同步。

### 代价

1. 测试账号偏长（`testuser / testpass123`），对人工敲入略繁琐——但本账号主要用于开发自测与验收，非高频人工输入。
2. `test / 123456` 旁路分支（`agent/agent/6e3a9d60`）作废，其内除凭据外的其他修复（Bug 1/2/3 的 UX 修复、verify 门禁修复）如未在别处落地，需另行评估是否补提——见 SOU-11 交付说明。

### 凭据变更协议（未来如需变更测试账号，必须按此执行）

1. 先写/更新本 ADR 的"决策"段，记录新凭据与理由。
2. 在**一个提交**内同步全部表面：`backend/init_db.py`、`backend/tests/test_auth.py`、`backend/tests/test_progress.py`、`frontend/src/components/LoginPanel.tsx`、`frontend/src/hooks/useAuth.test.ts`、`scripts/dev.{bat,ps1,sh}`、`README.md`、`docs/test_report.md`、`docs/decisions/0008-jwt-authentication.md`。
3. 同步改测试断言（`CLAUDE.md` §3 硬约定 4：改判官要透明，提交说明列明改了哪些测试、为什么）。
4. 跑 `cd frontend && npm run check` 与 `cd backend && pytest` 全绿。
5. 若凭据变更影响 `REQ-AUTH-003` 的 AC，按 §6 将该需求降回 🔨 已实现，待新测试通过后再升 ✅。

## 关联

- 触发 Issue: SOU-11（Bug 4: 测试账号文档与实现不一致）
- 相关 ADR: [0008. 用户认证方案（JWT）](0008-jwt-authentication.md)（其示例凭据与本决策一致）
- 相关需求: REQ-AUTH-003（用户登录，已凭 `testuser / testpass123` 验收）
- 旁路分支（作废，不合并）: `agent/agent/6e3a9d60` @ `60b4098`
