# 0010. 测试账号凭据单一真相源：统一为 `testuser / testpass123`

- 状态: 已采纳
- 日期: 2026-07-29
- 修正: 2026-07-29（初版 PR#6 基于 checkout 时残留的旧 master 快照，误判"master 全仓无 123456、本就一致"。实际 `origin/master`（含 `60b4098`）存在真实的凭据不一致——本版据实更正。决策不变，仍是统一 `testuser / testpass123`。）

## 背景

VocabMaster 的测试账号凭据散落在多处表面。对当前 `origin/master`（tip `bddaea5`，含提交 `60b4098` "fix: 修复 4 个 UX bug"）核查，存在**两套互相矛盾的凭据**：

| 凭据 | 出现位置（origin/master 实测） |
|---|---|
| `test / 123456` | `backend/init_db.py`（seed）、`README.md`、`frontend/src/components/LoginPanel.tsx`、`scripts/dev.bat`、`scripts/dev.ps1`、`scripts/dev.sh` |
| `testuser / testpass123` | `backend/tests/test_auth.py`、`backend/tests/test_progress.py`、`frontend/src/hooks/useAuth.test.ts`、`docs/decisions/0008-jwt-authentication.md`（示例）、`docs/test_report.md`（QA 验收报告） |

### 不一致的来源

- 仓库早期（`6fd1062` 重构 + `cdc76f5` README）**全表面统一为 `testuser / testpass123`**，且全套测试用例与 `REQ-AUTH-003` 验收均以此为基准。
- 提交 `60b4098` 把 **6 个非测试表面**（init_db / README / LoginPanel / 3 个启动脚本）的凭据文字改成了简洁易记的 `test / 123456`，但**未同步任何测试用例**（`test_auth.py` / `test_progress.py` / `useAuth.test.ts` 仍硬编码 `testuser / testpass123`），制造了本次不一致。该提交已合并入 master。

### 为什么测试目前仍全绿？

后端测试（`test_auth.py`、`test_progress.py`）通过 `/api/auth/register` 自行注册用户后再登录，**不依赖 `init_db.py` 的 seed**；`conftest.py` 用内存 SQLite + `Base.metadata.create_all`，从不调用 `init_db.create_sample_data()`。前端 `useAuth.test.ts` 全程 mock API，不触达后端。因此测试与 seed 凭据的脱节被"测试自注册"掩盖，verify 全绿但**凭据可追溯性已断裂**：`REQ-AUTH-003` 的验收锚点（`test_login_user`）用 `testuser / testpass123`，而 README/UI/启动脚本告诉用户用 `test / 123456`——文档与"已验收凭据"不是同一份。

## 决策

**统一采用 `testuser / testpass123` 作为测试账号的单一真相源**，覆盖全部表面，**回退 `60b4098` 在 6 个非测试表面的凭据改动**：

需改回的表面（当前为 `test / 123456`，改回 `testuser / testpass123`）：
1. `backend/init_db.py`（`username="test"` → `"testuser"`；`hash("123456")` → `hash("testpass123")`；print 提示同步）
2. `README.md`（"测试账号"段）
3. `frontend/src/components/LoginPanel.tsx`（测试账号提示行）
4. `scripts/dev.bat`、`scripts/dev.ps1`、`scripts/dev.sh`（启动完成提示）

**测试表面保持不变**（已是 `testuser / testpass123`）：`test_auth.py`、`test_progress.py`、`useAuth.test.ts`。

**否决 `test / 123456` 方案**：不把测试改成 `test / 123456`（见理由）。

## 理由

### 为什么统一到 `testuser / testpass123`（回退 60b4098），而不是统一到 `test / 123456`（改测试）？

1. **测试是判官，改判官代价高、风险大**。`CLAUDE.md` §3 硬约定 4：改动测试文件要单独说明、透明。`test_progress.py` 用 `testuser`~`testuser8` 共 8 个账号，`test_auth.py` + `useAuth.test.ts` 合计 ~30 处断言硬编码 `testuser / testpass123`。若选 `test / 123456`，须同步改这 ~30 处断言，且 `test/123456` 与 `testuser/testpass123` 不等价（用户名也变了），牵连面大。回退 6 个非测试表面只动数据/提示文案，零断言改动。

2. **`testuser / testpass123` 是已验收基线**。`REQ-AUTH-003`（用户登录）凭 `test_auth.py::test_login_user`（用 `testuser / testpass123`）通过并升为「✅ 已验收」。改测试凭据等于推翻已验收需求的 AC，按 §6 须降回 🔨 再重验收。回退 seed/文档则不动验收状态。

3. **`testuser / testpass123` 是设计 + QA 共识**。`ADR-0008`（JWT 认证方案，2026-07-28）示例用 `testuser`；`docs/test_report.md`（QA 验收报告）用 `testuser / testpass123`。`60b4098` 的 `test / 123456` 是未同步测试的单边改动，与设计/QA 共识相悖。

4. **`123456` 是弱口令反模式**。`123456` 长期居公开泄露口令榜前列，即便仅用于测试库，也不应作为"简洁易记"之选写进代码与文档，避免被复制到非测试环境。回退可顺带消除该弱口令。

5. **凭据简短非架构目标**。测试账号的核心属性是"稳定、可追溯、与测试同源"，而非"短"。`testuser / testpass123` 已满足。

### 为什么写本 ADR（而不只是回退代码）？

SOU-11 的根因正是"凭据散落多处、无单一真相源、单边修复未全表面同步就合入（`60b4098`）"。按 `CLAUDE.md` §6「不留第二份真相」与 `docs/decisions/README.md`「架构级取舍先写 ADR」，测试账号凭据虽小，但它是跨代码 + 文档 + 测试 + 用户可见表面的横向约束，属"一处变更须多处同步"的架构纪律，故落 ADR 固化单一真相源与变更协议，防半同步重演。

## 后果

### 好处

1. 全表面凭据一致，`REQ-AUTH-003` 验收锚点与文档/UI/seed 重归同源，可追溯链路恢复。
2. 不动测试断言，不推翻已验收需求，零回归风险（测试本就用 `testuser / testpass123` 且全绿）。
3. 消除 `123456` 弱口令。
4. 未来改测试账号有明确协议，不再出现 `60b4098` 式半同步。

### 代价

1. 需回退 6 个非测试表面（init_db / README / LoginPanel / 3 脚本）——由研发工程师执行，见子 Issue **SOU-12**。
2. `60b4098` 中除凭据外的其他修复（Bug 1/2/3 的 UX 修复、verify 门禁修复）不在本 ADR 范围，保留不动。

### 凭据变更协议（未来如需变更测试账号，必须按此执行）

1. 先更新本 ADR 的"决策"段，记录新凭据与理由。
2. 在**一个提交**内同步全部表面：`backend/init_db.py`、`backend/tests/test_auth.py`、`backend/tests/test_progress.py`、`frontend/src/components/LoginPanel.tsx`、`frontend/src/hooks/useAuth.test.ts`、`scripts/dev.{bat,ps1,sh}`、`README.md`、`docs/test_report.md`、`docs/decisions/0008-jwt-authentication.md`。
3. 同步改测试断言（§3 硬约定 4：改判官要透明，提交说明列明改了哪些测试、为什么）。
4. 跑 `cd frontend && npm run check` 与 `cd backend && pytest` 全绿。
5. 若凭据变更影响 `REQ-AUTH-003` 的 AC，按 §6 将该需求降回 🔨 已实现，待新测试通过后再升 ✅。

## 关联

- 触发 Issue: SOU-11（Bug 4: 测试账号文档与实现不一致）
- 实现子 Issue: SOU-12（回退 6 表面凭据至 `testuser / testpass123`，分配研发工程师）
- 相关 ADR: [0008. 用户认证方案（JWT）](0008-jwt-authentication.md)（示例凭据与本决策一致）
- 相关需求: REQ-AUTH-003（用户登录，已凭 `testuser / testpass123` 验收）
- 致不一致提交: `60b4098`（已合入 master，其凭据部分由 SOU-12 回退）
