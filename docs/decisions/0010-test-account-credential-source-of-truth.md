# 0010. 测试账号凭据单一真相源：统一为 `test / 123456`

- 状态: 已采纳
- 日期: 2026-07-29
- 修正: 2026-07-29（根据用户陈豪明确诉求，账号统一为 `test / 123456` 以便记忆。ADR 服从用户决策）

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

**统一采用 `test / 123456` 作为测试账号的单一真相源**，覆盖全部表面，**同步测试用例与文档**：

需更新的表面（当前为 `testuser / testpass123`，改为 `test / 123456`）：
1. `backend/tests/test_auth.py`（注意：测试走 register 端点在隔离内存 DB 自建用户，改的是测试输入与断言，不是依赖 seed）
2. `backend/tests/test_progress.py`
3. `frontend/src/hooks/useAuth.test.ts`
4. `frontend/src/components/LoginPanel.tsx`
5. `docs/decisions/0008-jwt-authentication.md`（示例）
6. `docs/test_report.md`

**已正确的表面保持不变**（已是 `test / 123456`）：`init_db.py`、`README.md`、`scripts/dev.{bat,ps1,sh}`。

## 理由

### 为什么统一到 `test / 123456`（同步测试），而不是统一到 `testuser / testpass123`（回退代码）？

1. **用户明确诉求优先**。用户陈豪反馈账号难记，希望用简洁的 `test / 123456`。这是产品层面的用户决策，ADR 应服从用户决策而非技术便利。

2. **测试账号的目标是"易用 + 可追溯"，两者可兼得**。`test / 123456` 更简洁易记，用户体验更好；同步测试后凭据一致性仍可保证。

3. **测试是可变的，用户诉求不可忽视**。`CLAUDE.md` §3 硬约定 4 要求改测试要透明说明，不是禁止改测试。本 ADR 即为透明说明：同步改为 `test / 123456`，理由是用户对账号易记性的产品诉求。

4. **`123456` 仅用于测试库，非生产环境**。虽然是弱口令，但测试库无安全风险。用户明确表示接受该密码用于测试目的。

### 为什么写本 ADR（而不只是同步代码）？

SOU-11 的根因正是"凭据散落多处、无单一真相源、单边修复未全表面同步就合入（`60b4098`）"。按 `CLAUDE.md` §6「不留第二份真相」与 `docs/decisions/README.md`「架构级取舍先写 ADR」，测试账号凭据虽小，但它是跨代码 + 文档 + 测试 + 用户可见表面的横向约束，属"一处变更须多处同步"的架构纪律，故落 ADR 固化单一真相源与变更协议，防半同步重演。

## 后果

### 好处

1. 全表面凭据一致，`REQ-AUTH-003` 验收锚点与文档/UI/seed 重归同源，可追溯链路恢复。
2. 账号更简洁易记，用户体验更好。
3. 未来改测试账号有明确协议，不再出现 `60b4098` 式半同步。

### 代价

1. 需同步 6 个表面（test_auth.py / test_progress.py / useAuth.test.ts / LoginPanel.tsx / 0008-jwt-authentication.md / test_report.md）——由研发工程师执行，见子 Issue **SOU-13**。
2. `60b4098` 中除凭据外的其他修复（Bug 1/2/3 的 UX 修复、verify 门禁修复）不在本 ADR 范围，保留不动。
3. 改测试断言后，`REQ-AUTH-003` 需重新验收（按 §6，测试凭据变更属验收条件变更）。

### 凭据变更协议（未来如需变更测试账号，必须按此执行）

1. 先更新本 ADR 的"决策"段，记录新凭据与理由。
2. 在**一个提交**内同步全部表面：`backend/init_db.py`、`backend/tests/test_auth.py`、`backend/tests/test_progress.py`、`frontend/src/components/LoginPanel.tsx`、`frontend/src/hooks/useAuth.test.ts`、`scripts/dev.{bat,ps1,sh}`、`README.md`、`docs/test_report.md`、`docs/decisions/0008-jwt-authentication.md`。
3. 同步改测试断言（§3 硬约定 4：改判官要透明，提交说明列明改了哪些测试、为什么）。
4. 跑 `cd frontend && npm run check` 与 `cd backend && pytest` 全绿。
5. 若凭据变更影响 `REQ-AUTH-003` 的 AC，按 §6 将该需求降回 🔨 已实现，待新测试通过后再升 ✅。

## 关联

- 触发 Issue: SOU-11（Bug 4: 测试账号文档与实现不一致）
- 实现子 Issue: SOU-13（同步 6 表面凭据至 `test / 123456`，分配研发工程师）
- 相关 ADR: [0008. 用户认证方案（JWT）](0008-jwt-authentication.md)（示例凭据与本决策一致）
- 相关需求: REQ-AUTH-003（用户登录，需重新验收）
- 致不一致提交: `60b4098`（已合入 master，其凭据部分由 SOU-13 同步完成）
