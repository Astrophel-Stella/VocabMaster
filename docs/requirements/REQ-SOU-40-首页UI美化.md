# REQ-SOU-40: 首页 UI 美化（Hero + 学习进度 + 词库卡片升级）

## 版本历史
| 版本 | 日期 | 变更人 | 变更内容 |
|------|------|--------|----------|
| 1.0 | 2026-08-03 | 软件工程师 | 初始版本 |

## 背景

首页（词库选择页 `WordBankSelect` + 顶栏）原为手写 Tailwind，缺少品牌 Hero 与整体学习进度概览，视觉层次与质感有提升空间。参考 shadcn/ui 设计语言（用 Tailwind 原子类实现，不引重依赖）对首页做视觉升级，并补齐"整体学习进度概览"，让用户一进首页就能看到自己在全部词库上的掌握进度。

## 验收标准

### 正常流程

```
Given 已登录进入首页
When 页面加载
Then 展示品牌 Hero 区（标题「继续你的单词之旅」/副标题/关键指标）
And 展示整体学习进度概览（进度条 + 已掌握/总词汇 + 百分比 + 词库数）
And 展示精致的词库卡片网格（图标/名称/描述/单词量/「开始学习」引导）
```

```
Given 词库卡片
When 鼠标悬停或键盘聚焦
Then 卡片有平滑上浮/阴影动效
And 聚焦时有清晰的 focus-visible 焦点环（键盘可达、无障碍）
And 卡片作为原生 <button>，可用 Tab 聚焦、Enter/Space 激活
```

```
Given 不同屏幕尺寸（移动/桌面）
When 缩放视口
Then Hero 与卡片网格响应式布局均正常（grid 1→2→3 列，Hero 单列→双列）
```

### 异常 / 规则

```
Given 整体进度概览接口调用失败或用户未登录
When 首页渲染 Hero
Then 概览降级为"从词库列表可推导"的信息（总词汇量 = 各词库词数之和，词库数 = 词库个数，掌握 0%）
And 页面不因单次请求失败而空白或报错
```

- 保持既有交互契约不回归：选择词库 → 加载单词、退出、修改密码。
- 保留既有 DOM 契约：加载态 `.animate-spin` + "加载词库中"、错误态 `.bg-red-50.border-red-200 p`、词库卡片 `button:has(h3)`、单词量文案以"词"结尾、栅格区标题「选择词库」仍为 heading。
- 面向用户功能必须有 Playwright E2E，且用生产配置跑。
- 组件/接口有单元测试；lint / typecheck / test 全绿；覆盖率 ≥ 70%。

## 技术设计

- **后端**：新增 `GET /api/progress/overview`（`app/api/progress.py`），返回当前用户跨全部词库的聚合进度
  `{ total_words, mastered_words, progress_percentage, total_banks }`。
  该字面量路由声明在 `"/{word_bank_id}"` 之前，避免 `overview` 被当作 int 路径参数（否则 422）。
- **前端 API**：`src/lib/api.ts` 新增 `ProgressOverview` 类型与 `getProgressOverview(token)`。
- **前端 Hook**：新增 `src/hooks/useOverview.ts`，登录后加载整体概览，失败时保留上次结果并暴露 error（优雅降级）。
- **组件**：`src/components/WordBankSelect.tsx` 重做为 Hero + 整体进度概览 + 升级词库卡片；进度条使用
  `role="progressbar"` + `aria-valuenow/min/max` 保证无障碍。
- **配置一致性**：API 地址继续走 `VITE_API_URL` 环境变量，无硬编码 host/URL。

## 测试证据

- 后端：`tests/test_progress.py::TestProgressOverview`（跨库聚合 / 按用户隔离 / 空库零值 / 需鉴权）。
- 前端单元：`src/hooks/useOverview.test.ts`、`src/components/WordBankSelect.test.tsx`（Hero、进度条、CTA、降级、空态无按钮）。
- E2E：`e2e/web/home-page.spec.ts`（Hero、进度概览、CTA、键盘可达、点击选择无回归）。

## 关联 Issue

- SOU-40
- 父需求 SOU-24
