# 需求规格(可追溯) v3

> 需求基建的核心产出。每条需求 = **唯一 ID + 验收条件(AC) + 状态 + 测试锚点**,
> 目的是打通「需求 → 验收条件 → 测试用例」的可追溯链路。
> 本文替代已废弃的 `docs/_archive/需求文档_v1.md`(旧版无 ID、无 AC、且产品已变更)。

## 状态图例

| 状态 | 含义 |
|---|---|
| 📝 规划中 | 已纳入范围,尚未实现 |
| 🔨 已实现 | 代码存在,但**尚无测试证明其符合 AC** |
| ✅ 已验收 | 有通过的测试证明其满足 AC(测试锚点已填) |

> 关键规则:**只有当一条需求的验收条件被一个通过的测试覆盖,状态才能升到「✅ 已验收」。**
> 这就是需求与测试的绑定——`已验收` 是测试基建"发"给需求的证书。

## 产品概述

**VocabMaster** - 跨平台英语单词学习助手：选择词库 → 单词展示（拼写/发音/音标）→ 标记掌握 → 进度追踪。

平台演进：Windows 桌面 → Mac → 移动端 → 网页版。技术架构见 `docs/architecture.md`。

---

## 1. 用户认证(REQ-AUTH)

| ID | 需求 | 验收条件(Given/When/Then) | 状态 | 测试锚点 |
|---|---|---|---|---|
| REQ-AUTH-001 | 用户注册 | 给定用户名/邮箱/密码,当提交注册,则创建用户账号并返回用户信息 | ✅ 已验收 | `backend/tests/test_auth.py::test_register_user` |
| REQ-AUTH-002 | 用户名唯一性检查 | 给定已存在的用户名,当再次注册,则返回 400 错误"Username already registered" | ✅ 已验收 | `backend/tests/test_auth.py::test_register_duplicate_username` |
| REQ-AUTH-003 | 用户登录 | 给定正确的用户名/密码,当登录,则返回 JWT token | ✅ 已验收 | `backend/tests/test_auth.py::test_login_user` |
| REQ-AUTH-004 | 登录失败处理 | 给定错误的用户名/密码,当登录,则返回 401 错误 | ✅ 已验收 | `backend/tests/test_auth.py::test_login_invalid_credentials` |
| REQ-AUTH-005 | 获取当前用户信息 | 给定有效 token,当请求 `/api/auth/me`,则返回用户信息 | ✅ 已验收 | `backend/tests/test_auth.py::test_get_current_user` |

## 2. 词库管理(REQ-WB)

| ID | 需求 | 验收条件 | 状态 | 测试锚点 |
|---|---|---|---|---|
| REQ-WB-001 | 获取词库列表 | 给定已登录用户,当请求词库列表,则返回所有可用词库(高考英语、考研英语、生活英语等) | ✅ 已验收 | `backend/tests/test_words.py::test_REQ_WB_001_*` |
| REQ-WB-002 | 获取词库单词 | 给定词库 ID 和分页参数,当请求单词列表,则返回该词库的单词(含拼写/音标/释义/例句) | ✅ 已验收 | `backend/tests/test_words.py::test_REQ_WB_002_*` |
| REQ-WB-003 | 词库不存在处理 | 给定不存在的词库 ID,当请求单词列表,则返回 404 错误 | ✅ 已验收 | `backend/tests/test_words.py::test_REQ_WB_003_word_bank_not_found` |
| REQ-WB-004 | 词库数据完整性 | 给定已导入词库数据,则每个词库词汇数量达到验收标准(四级≥2000,六级≥2500,考研≥5500,托福≥3500,雅思≥3000,GRE≥10000,商务英语≥1000,生活口语≥500) | ✅ 已验收 | `backend/tests/test_words.py::test_REQ_WB_004_*` |

## 3. 单词学习(REQ-WORD)

| ID | 需求 | 验收条件 | 状态 | 测试锚点 |
|---|---|---|---|---|
| REQ-WORD-001 | 单词详情展示 | 给定单词 ID,当请求详情,则返回拼写/音标/发音 URL/释义/例句 | ✅ 已验收 | `backend/tests/test_words.py::test_REQ_WORD_001_get_word_detail_success` |
| REQ-WORD-002 | 单词不存在处理 | 给定不存在的单词 ID,当请求详情,则返回 404 错误 | ✅ 已验收 | `backend/tests/test_words.py::test_REQ_WORD_002_word_not_found` |
| REQ-WORD-003 | 发音播放(可选) | 给定单词有发音 URL,当用户点击播放按钮,则播放音频 | 📝 规划中 | — |
| REQ-WORD-004 | 单词排序 | 给定词库单词列表,则按 order_index 排序返回 | ✅ 已验收 | `backend/tests/test_words.py::test_REQ_WB_002_get_words_sorted_by_order_index` |

## 4. 学习进度(REQ-PROG)

| ID | 需求 | 验收条件 | 状态 | 测试锚点 |
|---|---|---|---|---|
| REQ-PROG-001 | 标记单词已掌握 | 给定已登录用户和单词 ID,当标记已掌握,则更新进度记录(is_mastered=True) | ✅ 已验收 | `backend/tests/test_progress.py::test_REQ_PROG_001_*` |
| REQ-PROG-002 | 取消掌握标记 | 给定已标记的单词,当取消标记,则更新进度记录(is_mastered=False) | ✅ 已验收 | `backend/tests/test_progress.py::test_REQ_PROG_002_*` |
| REQ-PROG-003 | 获取学习进度 | 给定已登录用户和词库 ID,当请求进度,则返回每个单词的掌握状态 | ✅ 已验收 | `backend/tests/test_progress.py::test_REQ_PROG_003_*` |
| REQ-PROG-004 | 学习进度统计 | 给定已登录用户和词库 ID,当请求统计,则返回总词数/已掌握数/完成百分比 | ✅ 已验收 | `backend/tests/test_progress.py::test_REQ_PROG_004_*` |

## 5. 用户界面(REQ-UI)

| ID | 需求 | 验收条件 | 状态 | 测试锚点 |
|---|---|---|---|---|
| REQ-UI-001 | 登录/注册界面 | 主界面含登录/注册表单 | ✅ 已验收 | `frontend/src/components/LoginPanel.test.tsx` |
| REQ-UI-002 | 词库选择界面 | 登录后展示词库列表供选择 | ✅ 已验收 | `frontend/src/components/WordBankSelect.test.tsx` |
| REQ-UI-003 | 单词学习界面 | 展示单词拼写/音标/释义/例句,含"已掌握"勾选按钮 | ✅ 已验收 | `frontend/src/components/WordCard.test.tsx` |
| REQ-UI-004 | 进度统计界面 | 展示当前词库学习进度(已学/总数) | ✅ 已验收 | `frontend/src/components/WordCard.progress.test.tsx` |
| REQ-UI-005 | 窗口置顶(桌面版) | 桌面应用支持窗口置顶功能 | 📝 规划中 | 待补(E2E) |
| REQ-UI-006 | 小窗口模式 | 支持小窗口展示,方便随时学习 | 📝 规划中 | 待补(E2E) |

## 6. 非功能需求(NFR)

| ID | 需求 | 验收条件(可测量) | 状态 | 测试锚点 |
|---|---|---|---|---|
| NFR-PERF-001 | 登录响应 < 500ms | 登录请求到返回 token 耗时 < 500ms | 📝 规划中 | 待补(性能门禁) |
| NFR-PERF-002 | 单词加载 < 300ms | 单词列表请求返回耗时 < 300ms | 📝 规划中 | 待补 |
| NFR-PERF-003 | UI 响应 < 200ms | 关键交互响应 < 200ms | 📝 规划中 | 待补 |
| NFR-SEC-001 | 密码加密存储 | 密码使用 bcrypt 加密,不存储明文 | 🔨 已实现 | 待补 |
| NFR-SEC-002 | JWT 认证 | API 使用 JWT token 认证,token 有效期 30 分钟 | 🔨 已实现 | 待补 |
| NFR-SEC-003 | CORS 配置 | 仅允许指定源访问(localhost:5173, tauri://localhost) | 🔨 已实现 | 待补 |
| NFR-REL-001 | 数据库初始化 | 首次启动自动创建数据库表和示例数据 | 🔨 已实现 | 待补 |
| NFR-USE-001 | 小窗口可拖拽 | 小窗口模式下窗口可拖拽移动 | 📝 规划中 | 待补 |

---

## MVP 范围

**必做**:
- REQ-AUTH-001~005 (用户认证)
- REQ-WB-001~002 (词库列表和单词列表)
- REQ-WORD-001 (单词详情)
- REQ-PROG-001~004 (学习进度)
- REQ-UI-001~004 (基础 UI)

**暂不做**:
- 发音播放(REQ-WORD-003)
- 窗口置顶(REQ-UI-005,可作为 Tauri 特性后续添加)
- 复杂的复习算法(艾宾浩斯遗忘曲线)
- 多设备同步

## 技术栈

**前端**: React 18 · TypeScript · Vite · Tailwind CSS · Zustand · Tauri 2
**后端**: Python 3.10+ · FastAPI · SQLAlchemy · SQLite · JWT
**测试**: Vitest (前端) · pytest (后端) · Playwright (E2E)

## 追溯矩阵

自动生成的「需求 ↔ 测试」矩阵将放在 `specs/traceability.md`(Phase 5 由脚本扫描测试中的 REQ-ID 标注生成)。
约定:测试用例名或注释里标注对应 `REQ-ID`,如 `it('REQ-PROG-001: 标记已掌握成功', ...)`。
