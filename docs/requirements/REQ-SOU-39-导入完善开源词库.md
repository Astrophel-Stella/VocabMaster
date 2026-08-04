# REQ-SOU-39: 导入完善开源词库（ECDICT：高考/四级/六级/考研）

## 版本历史
| 版本 | 日期 | 变更人 | 变更内容 |
|------|------|--------|----------|
| 1.0  | 2026-08-03 | 软件工程师 | 初始版本：以 ECDICT 为权威源导入四个考试词库 |
| 1.1  | 2026-08-03 | 软件工程师 | 回归修复：seed 改为「按内容对账」自愈老库；前端放开整库加载（详见下方「回归修复」） |

## 背景与目标

原词库为少量示例数据（含"生活英语"等占位词库、单词量仅数十），不足以支撑真实学习。
本需求引入开源权威词库 **ECDICT**（skywind3000/ECDICT，MIT 许可）作为单词来源，
按语料频率（frq/bnc）排序，导入四个主流考试词库，替换占位数据。

- **数据来源**：ECDICT（MIT）——含释义、音标、考试标签（zk/gk/cet4/cet6/ky）、词频。
- **词库范围**：高考英语、大学英语四级、大学英语六级、考研英语。
- **排序**：按语料频率升序（order_index），最高频词在前，因此首词为 `the`（非字母序 `abandon`）。

## 验收标准

### 正常流程
```
Given 后端数据库已初始化
When  执行 init_db.py（数据驱动 seed）
Then  数据库中存在 4 个词库：高考英语 / 大学英语四级 / 大学英语六级 / 考研英语
And   每个词库的 total_words 与其单词表记录数一致
And   每个词库首词（order_index=0）为语料最高频词 `the`
And   重复执行 seed 幂等，不产生重复词库或重复单词
```

### 异常流程
```
Given seed 数据文件缺失或损坏
When  执行 init_db.py
Then  进程以非零码退出并打印明确错误，不写入半成品数据
```

## 技术设计

- **数据文件（提交入库，可溯源）**：`backend/seed_data/wordbanks/*.json`
  - 由 `scripts/build_wordbanks.py` 从 ECDICT 生成（按考试标签筛选 + 频率排序）。
  - 每条记录：`spelling / phonetic / meaning / example_sentence / order_index`。
  - SOU-41 起放在 `seed_data/`（持久化数据卷 `/app/data` 之外），避免棕地卷遮蔽只读种子文件。
- **Seed 逻辑**：`backend/app/seed.py`
  - 数据驱动：遍历 `seed_data/wordbanks/`，按文件建库；幂等（存在则跳过/对齐）。
- **入口**：`backend/init_db.py` 调用 seed。
- **API**：沿用 `/api/word-banks`、`/api/words`（`order_index` 升序返回）。
- **配置一致性**：无硬编码 host/URL/端口；DB 路径走既有配置。

## 测试证据

- 后端：`backend/tests/test_seed.py`（pytest）验证 4 库、词数一致、首词 `the`、幂等。
- E2E（生产配置）：`word-bank.spec.ts` 断言 4 个词库；`word-learning.spec.ts` 断言首词 `the` 与稳定排序。

## 关联 Issue
- SOU-39

## 回归修复（v1.1）

初版上线后用户反馈：**进入词库仍只有几个单词，高考应为约 3500**。定位到两个真因（均为初版遗留 bug，非部署失败）：

### 真因 1：seed「存在即跳过」→ 老库永不更新（后端）
生产用 Docker 具名卷 `backend-data` 持久化数据库，卷内残留上线前的占位库（高考英语 3 词、生活英语 2 词等）。容器每次启动都跑 `init_db.py`，但旧 seed 逻辑是「库已存在就跳过」，导致真实 ECDICT 词表**永远写不进去**。

修复：`seed_wordbanks` 改为**按内容对账**（reconcile-by-content），可安全地每次启动都跑并自愈老库：
1. 删除不在期望集合内的过时库（如"生活英语"）。
2. 缺失的库按完整词表创建。
3. 已存在但词数不符的库，重建其单词行；**按 spelling 把用户既有 `LearningProgress` 掌握记录重映射到新行**，不丢用户进度（拼写已消失的记录才丢弃）。

- Given 数据库内为上线前占位库（高考 3 词 + 生活英语 2 词）
- When 执行 `init_db.py`
- Then 高考英语被填充为 ≥2000 词、"生活英语"被移除、四个考试库齐全，且再次执行幂等（created=0）
- And 用户此前已掌握的单词（如 `the`）在重建后仍标记为已掌握，无悬空进度行

### 真因 2：前端只加载前 50 词（前端）
学习页此前固定 `loadWords(bankId, 0, 50)`，即使后端有 3677 词也只拉 50，翻到第 50 个 Next 就禁用，观感"只有几个词"。

修复：`App.tsx` 改为按 `total_words` 加载整库（`words.length === totalWords`），进度计数（`1 / 3677`、`已掌握 X / 3677`）与 Next/Prev 遍历全部真实；导航圆点仍保留 50 个作为开头段快速跳转，并显示"+N 更多"。

## 测试证据（v1.1）

- 后端 `backend/tests/test_seed.py::TestSeedReconcilesBrownfield`：复现占位库 → 断言填充/删除/幂等/进度按拼写保留。共 59 passed，覆盖率 84%（seed.py 97%）。
- E2E（生产配置）`word-learning.spec.ts`：`SOU-39` 用例断言整库 `total > 50` 且翻过 50 点条后 Next 仍可用（守护 50 词封顶回归）。63 E2E passed。
- 本地 seed 实测：高考英语 3677 / 四级 3849 / 六级 5407 / 考研 4801（共 17,734 词）。
