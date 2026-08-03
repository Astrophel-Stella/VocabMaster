# REQ-SOU-39: 导入完善开源词库（ECDICT：高考/四级/六级/考研）

## 版本历史
| 版本 | 日期 | 变更人 | 变更内容 |
|------|------|--------|----------|
| 1.0  | 2026-08-03 | 软件工程师 | 初始版本：以 ECDICT 为权威源导入四个考试词库 |

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

- **数据文件（提交入库，可溯源）**：`backend/data/wordbanks/*.json`
  - 由 `scripts/build_wordbanks.py` 从 ECDICT 生成（按考试标签筛选 + 频率排序）。
  - 每条记录：`spelling / phonetic / meaning / example_sentence / order_index`。
- **Seed 逻辑**：`backend/app/seed.py`
  - 数据驱动：遍历 `data/wordbanks/`，按文件建库；幂等（存在则跳过/对齐）。
- **入口**：`backend/init_db.py` 调用 seed。
- **API**：沿用 `/api/word-banks`、`/api/words`（`order_index` 升序返回）。
- **配置一致性**：无硬编码 host/URL/端口；DB 路径走既有配置。

## 测试证据

- 后端：`backend/tests/test_seed.py`（pytest）验证 4 库、词数一致、首词 `the`、幂等。
- E2E（生产配置）：`word-bank.spec.ts` 断言 4 个词库；`word-learning.spec.ts` 断言首词 `the` 与稳定排序。

## 关联 Issue
- SOU-39
