# 0014. 扩展词库数据策略（开源词库 + 导入脚本 + 表扩展）

- 状态: 已采纳
- 日期: 2026-07-30
- 关联 Issue: SOU-24（父）、SOU-29（扩展词库数据）

## 背景

当前 `init_db.py` 仅内置 3 个示例词库（高考/考研/生活）、共约 7 个单词，远不足以支撑学习产品。SOU-29 要求扩展至四级/六级/考研/托福/雅思/GRE/商务/生活等多词库、单词量数千至万级，并扩展单词信息字段（词根、难度、词频、同反义词）。需在"数据来源合法性、导入脚本、表结构扩展"三方面做决策，避免研发在 Issue 内临时找数据源。

## 选项

### 数据来源
- 选项 A：开源词频表（COCA、四六级大纲、教育部考研大纲）—— 合法、可整理为 CSV/JSON
- 选项 B：爬取有道/百度词典 —— 版权风险、易被封
- 选项 C：付费词库 API —— 成本高、与"开源免费"定位冲突

### 导入方式
- 选项 D：一次性导入脚本 `backend/scripts/import_word_banks.py`（CSV/JSON → DB，去重 + 质检 + 日志）
- 选项 E：运行时实时从 API 拉 —— 慢、依赖外部可用性、不可离线

### 表结构
- 选项 F：在 `words` 表加字段（word_root / difficulty_level / frequency / synonyms / antonyms）
- 选项 G：拆分到 `word_details` 子表 —— 过度设计，单词信息天然 1:1

## 决策

**数据：选项 A（开源大纲词频表，整理为仓库内 CSV/JSON）。导入：选项 D（离线脚本）。表结构：选项 F（扩展 `words` 表字段）。**

### 数据来源与版权
- 四级/六级：教育部公布的大纲词汇（公有领域）
- 考研：考研大纲词汇（公有领域）
- 托福/雅思/GRE：基于 TPO/官方公开词表整理的社区开源版本（选 CC 协议的）
- COCA 词频：美国当代英语语料库词频表（学术公开数据）
- 音标/释义/例句：由研发在导入脚本中**仅使用开源数据**；不爬取商业词典
- 单词量按验收标准下限：四级≥2000、六级≥2500、考研≥5500、托福≥3500、雅思≥3000、GRE≥10000、商务≥1000、生活≥500

### 导入脚本
- 新增 `backend/scripts/import_word_banks.py`
- 输入：`backend/data/word_banks/{名称}.csv`（字段：spelling, phonetic, meaning, example_sentence, word_root, difficulty_level, frequency, synonyms, antonyms）
- 逻辑：按 spelling 去重、校验必填（spelling/meaning）、记录导入日志（每词库导入数/跳过数/失败数）、幂等（重跑不重复插入）

### 数据库扩展（SQLite，ADR-0007）
```sql
ALTER TABLE words ADD COLUMN word_root VARCHAR(255);
ALTER TABLE words ADD COLUMN difficulty_level INTEGER DEFAULT 1;
ALTER TABLE words ADD COLUMN frequency INTEGER;
ALTER TABLE words ADD COLUMN synonyms TEXT;   -- JSON 数组
ALTER TABLE words ADD COLUMN antonyms TEXT;    -- JSON 数组
```
更新 `WordBank.total_words` 为导入后真实计数。

### 后端 API 优化
- `GET /api/word-banks` 列表（已有）
- `GET /api/word-banks/{id}/words` 分页 + 支持按 `difficulty_level` / `frequency` 筛选与排序
- 新增 `GET /api/word-banks/{id}/stats`：词库统计（总词数、难度分布）

## 接口定义

### `GET /api/word-banks/{bank_id}/words?page=1&page_size=20&difficulty=&order=frequency`
响应：`{ "words": [WordResponse], "total": N, "page": 1, "page_size": 20 }`

### `GET /api/word-banks/{bank_id}/stats`
响应：`{ "total_words": N, "difficulty_distribution": {"1": x, "2": y, ...} }`

## 理由

1. **合法优先**：开源大纲词表无版权风险，与产品"开源免费"定位一致；爬取商业词典有法律与封禁风险。
2. **离线导入**：一次性脚本导入后学习不依赖外部 API，性能与可用性都更好；实时拉取对网络与服务可用性过度耦合。
3. **单表扩展足够**：单词与扩展信息天然 1:1，子表拆分是过度设计；JSON 字段存同反义词数组即可（SQLite 虽无 JSON 类型，SQLAlchemy 以 TEXT 存取）。
4. **幂等导入**：脚本重跑安全，便于数据迭代更新而不重复。

## 后果

### 正面
- ✅ 数据合法、可迭代
- ✅ 表结构扩展后信息丰富度对齐主流产品
- ✅ 分页与筛选 API 支撑万级词库的查询性能

### 需注意
- ⚠️ 数据整理工作量大（验收标准预估 8 小时），研发需先确认每类词库的合规数据源再导入，不可随意抓取
- ⚔️ 大数据量首次导入可能耗时，脚本应支持按词库分批、打印进度
- ⚠️ `synonyms`/`antonyms` JSON 字段需在 `WordResponse` Pydantic 模型中反序列化为列表返回
- ⚠️ 现有示例数据保留（高考/考研/生活），新数据追加，不破坏既有测试

## 相关决策
- ADR-0007 SQLite —— 扩展字段沿用
- ADR-0013 发音 —— 词库扩展后发音按钮覆盖更多单词
