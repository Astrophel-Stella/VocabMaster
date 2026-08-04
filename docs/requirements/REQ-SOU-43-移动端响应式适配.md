## REQ-UI-005: 移动端响应式适配

## 版本历史
| 版本 | 日期 | 变更人 | 变更内容 |
|------|------|--------|----------|
| 1.0  | 2026-08-04 | 软件工程师 | 初始版本：修复移动端页面显示不美观（头部溢出、按钮拥挤） |

## 背景

QA（陈豪）反馈两点：

1. 直接在浏览器访问 `http://111.229.214.179/api/progress/1`、`/api/progress/1/stats`、`/api/words/6/pronunciation?accent=us` 返回 **401**，怀疑是缺陷、且测试没覆盖。
2. 页面在移动端显示不太美观。

### 关于 401（结论：符合预期，非缺陷）

上述接口都由 `get_current_user` 保护（用户维度数据 / 发音）。浏览器地址栏直接 GET **不带 `Authorization: Bearer` 头**，服务端正确返回 401 —— 这是鉴权在正常工作，而不是 bug。若这些接口对匿名请求返回 200 才是安全缺陷。

已用生产环境验证：带合法 token 时三者均返回 **200**，发音返回无密钥有道公共源 URL（SOU-42 已合并上线）。

> 为什么测试"没测出来"：`test_progress.py` 里每个用例都先登录再断言 200，**从未显式断言"无 token → 401"** 这条契约，所以 401 行为没有被测试记录下来。本次补齐（见下）。

## 验收标准

### 正常流程（响应式）
```
Given 用户在 390px 宽（iPhone 12 逻辑分辨率）的手机视口
When 打开登录页 / 词库选择页 / 单词学习页
Then 页面不出现横向滚动（scrollWidth ≤ clientWidth + 1px）
 And 顶部"修改密码""退出""返回"控件在窄屏折叠为图标，但仍可通过无障碍名称访问
 And 单词卡片的"上一个""下一个"在窄屏折叠为图标，"标记已掌握"保留文字
 And 发音按钮可见可点
```

### 异常流程（鉴权契约）
```
Given 不带 token（或携带非法 token）
When 请求 /api/progress/{id}、/{id}/stats（GET/POST/DELETE）
Then 返回 401（而非 200）
```

## 技术设计

- 组件：
  - `App.tsx`：抽出 `HeaderControls`，两个头部共用；窄屏隐藏用户名文本与按钮文字（`hidden sm:inline`），按钮加 `aria-label` 保证无障碍名稳定（E2E 选择器不受影响）；头部 `px-3 sm:px-6`、`min-w-0` + `truncate` 防溢出；分隔线与"返回"文字窄屏隐藏。
  - `WordCard.tsx`：外边距 `p-4 sm:p-6`，卡片 `p-5 sm:p-8 md:p-12`；拼写 `text-4xl sm:text-5xl md:text-6xl` + `break-words`；操作区 `gap-2 sm:gap-4`，上一个/下一个窄屏图标化（`aria-label`），已掌握按钮 `shrink-0`。
  - `LoginPanel.tsx`：表单列 `p-4 sm:p-8`、卡片 `p-6 sm:p-8`。
- 无硬编码 host/URL/端口（SOU-35）。
- 测试：
  - 后端 `test_progress.py::TestProgressAuthContract`（REQ-PROG-005）：参数化断言四条 progress 路由无 token / 非法 token 均 401。发音 401 契约已由 `test_words.py::test_REQ_WORD_003_pronunciation_requires_auth` 覆盖。
  - 前端 E2E `frontend/e2e/web/mobile-responsive.spec.ts`：390×844 手机视口，断言三页无横向溢出 + 折叠控件可达 + 翻页后仍不溢出。

## 关联Issue
- SOU-43（本次）
- SOU-42（发音无密钥公共源，已合并 PR #66）
- SOU-35（配置一致性，禁止硬编码）
