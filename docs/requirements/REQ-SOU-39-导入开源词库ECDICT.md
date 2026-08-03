# REQ-SOU-39: 导入完善开源词库（ECDICT：高考/考研/四级/六级）

## 版本历史
| 版本 | 日期 | 变更人 | 变更内容 |
|------|------|--------|----------|
| 1.0  | 2026-08-03 | 软件工程师 | 初始版本：以 ECDICT 真实开源词库替换 7 词占位种子 |

## 背景

此前 `backend/init_db.py` 硬编码 3 个示例词库（高考/考研/生活）共约 7 个单词，且释义为
`n. abandon` 之类的占位文本，无法支撑学习产品。本需求引入 **ECDICT
（skywind3000/ECDICT，MIT 许可）** 开源词库，按考纲标签生成真实词库种子，
提交入库、CI/离线可复现、运行时零网络依赖。

## 验收标准

### 正常流程
```
Given 数据库已按种子文件初始化
When  用户请求 GET /api/word-banks
Then  返回至少 4 个真实词库（高考≈3677、考研≈4801、四级≈3849、六级≈5407），
      且每个词库的 total_words 等于其真实单词数
```
```
Given 某个词库已初始化
When  用户请求 GET /api/word-banks/{id}/words
Then  单词按 order_index 升序返回（ECDICT 词频高频词在前），
      每个单词含真实音标与真实中文释义（绝非 "n. abandon" 之类占位）
```
```
Given 全新环境（CI 或离线）
When  运行 python backend/init_db.py
Then  从仓库内 backend/data/wordbanks/*.json 幂等种子化，无需任何网络访问；
      重复运行不产生重复行
```

### 异常流程
```
Given 种子文件缺失或为空目录
When  运行种子化
Then  不抛异常，跳过并保持数据库现状（幂等，可被后续补种）
```

## 技术设计

- **数据来源**：ECDICT（`https://github.com/skywind3000/ECDICT`，MIT）。`frq`/`bnc`
  词频秩用于高频优先排序（越小越高频，0 视为未排名）。
- **构建脚本**：`scripts/build_wordbanks.py`（构建期开发工具，非运行时依赖）
  - 按考纲标签 `gk/ky/cet4/cet6` 过滤，规范化音标（包裹 `/.../`）与释义
    （合并多义项、还原 `\r\n` 转义），要求释义含中日韩汉字。
  - 按 `(词频秩, 拼写)` 排序，赋 `order_index` 1..N。
  - 源地址可通过 `--source-url` / `ECDICT_SOURCE_URL` 覆盖，**不硬编码**。
  - 输出 `backend/data/wordbanks/{gk,ky,cet4,cet6}.json`（记录 source/source_url/
    license/total_words）与 `README.md` 溯源清单。
- **种子入库**：`backend/init_db.py` 重构为**数据文件驱动 + 幂等**：
  `load_wordbank_files()` 读取 JSON，`seed_word_banks()` 按词库名跳过已存在项，
  `total_words = len(words)`，`bulk_save_objects` 批量插入；保留 ADR-0010 的
  `test/123456` 单一真相测试账号（幂等）。
- **配置一致性（SOU-35）**：无硬编码 host/URL/端口/密钥；构建源地址走参数/环境变量。

## 测试证据

- 后端：`backend/tests/test_words.py` 新增 `TestSeedDataFiles` / `TestSeedDatabase`
  —— 覆盖规模匹配考纲、MIT 溯源、释义为真实中文非占位、order_index 连续、
  高频词在前、API total_words 与真实词数一致、幂等、测试账号幂等。
- 前端 E2E（生产路径，CI 执行）：`word-bank.spec.ts` 断言 4 个词库与高频词优先；
  `word-learning.spec.ts` 首词为真实词、按 order_index 分页、边界禁用（通过路由拦截
  注入小词表使末词可达，规避万级词库末词不可点击）；`app.spec.ts` 词库名匹配更新。

## 关联 Issue / ADR
- SOU-39
- ADR-0014（扩展词库数据策略）—— 本需求以 ECDICT 落地其"开源数据 + 离线导入脚本"决策；
  简化为"数据文件驱动种子"而非独立一次性导入脚本。
