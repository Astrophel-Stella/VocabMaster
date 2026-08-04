# REQ-SOU-41: 部署恢复与可观测性（宕机复盘 + 硬化）

## 版本历史
| 版本 | 日期 | 变更人 | 变更内容 |
|------|------|--------|----------|
| 1.0 | 2026-08-03 | 软件工程师 | 初始版本：PR #60 部署失败宕机复盘 + 回滚语法修复 + 部署可观测性硬化 |
| 2.0 | 2026-08-04 | 软件工程师 | 经 #62 的日志采集抓到真实 traceback，确认真因是**种子数据被持久化数据卷遮蔽**（非磁盘满推断）；种子数据移出数据卷 + 复现测试 |

## v2.0 确认真因：种子数据被持久化数据卷遮蔽

#62 合并后再次部署（run `30870629789`）仍失败，但这次 #62 加的日志采集生效，**后端容器真实 traceback 首次进入 Actions 日志**，一举确认真因（不再是 v1.0 的"磁盘满"推断）：

```
vocabmaster-api  | FileNotFoundError: Word-bank index not found:
  /app/data/wordbanks/index.json. Run scripts/build_wordbanks.py to generate seed data.
```

**根因**：种子文件曾放在 `backend/data/wordbanks/`（容器内 `/app/data/wordbanks`），而生产 `docker-compose.prod.yml` 把具名卷挂在 `backend-data:/app/data`（持久化 SQLite DB）。二者路径重叠——**棕地卷已有内容时，Docker 不会把镜像里的 `/app/data/wordbanks` 拷进已存在的卷**，种子文件在运行时被彻底遮蔽。

**为何直到现在才炸**：
- SOU-37/38 期就创建了该卷（当时镜像还没有 `wordbanks` 目录，卷里只有 DB）。
- PR #58 用"库已存在即跳过"的 seed：DB 里有旧占位库 → 直接跳过，从不读种子文件 → 不炸。
- PR #60 改成"按内容对账"：**每次启动都读种子文件**做比对 → 首次触发被遮蔽的路径 → `index.json` 读不到 → `init_db.py` 秒崩。

**为何本地/CI 全绿却生产炸**：本地和 CI 没有那个棕地具名卷，种子文件直接可读；只有生产的持久化卷才会遮蔽。这正是"配置一致性"盲区。

**修复**：种子数据是**只读静态资源**，必须与**可写、持久化**的 DB 目录物理隔离。将 `backend/data/wordbanks/` 移到 `backend/seed_data/wordbanks/`（容器内 `/app/seed_data/wordbanks`，在数据卷之外，随镜像分发）。`seed.py` 的 `DATA_DIR`、`scripts/build_wordbanks.py` 默认输出路径、相关文档同步更新。DB 仍在 `/app/data` 卷内，**用户学习进度不受影响**。

### 复现测试（先红后绿）
`backend/tests/test_seed.py::TestSeedDataOutsidePersistedVolume::test_SOU_41_seed_dir_not_under_db_volume`：断言 `DATA_DIR` 不位于持久化数据卷目录（`<backend>/data`）之内。修复前（`data/wordbanks`）断言失败=红，修复后（`seed_data/wordbanks`）通过=绿。这条不变式永久防止种子文件再被塞回数据卷路径。

---

## v1.0 背景

PR #60（SOU-39/40 词库整库对账 + 首页 UI）合并到 master 后触发自动部署（run 30809494937），**部署失败且自动回滚未生效，生产站点完全不可访问**。

复盘确认两层故障叠加：

1. **后端容器启动即崩溃**：部署日志显示 `dependency failed to start: container vocabmaster-api is unhealthy`，后端容器 `Started 11:27:20.135` → `unhealthy 11:27:21.137`，约 1 秒即退出——是 `python init_db.py` 的**快速崩溃**（远快于慢速 seed 或写入中途 OOM）。前端 `depends_on: service_healthy`，后端不健康则前端永不启动，整站下线。
   - PR #58 的 seed「库已存在即跳过」，从不写库故未触发；PR #60 首次做整库对账（约 1.7 万行 INSERT），是首个重写场景。
   - **最大盲点**：`docker compose up -d` 不会把容器 stdout/stderr 打进 Actions 日志，`init_db.py` 的真实 traceback **此前完全不可见**，故确切崩溃原因无法从日志直接观测。最可能诱因：小盘 VM 被历次 `build --no-cache` 悬空镜像/层填满，首次重写 SQLite 时 `database or disk is full` 秒崩。

2. **自动回滚因自身 bash 语法错误从未执行**：`Rollback on Failure` step 缺少闭合外层 `if [ -z "$LAST_GOOD_SHA" ] ...` 的 `fi`，bash 解析到文件尾报 `line 66: syntax error: unexpected end of file`（exit 2）。回滚脚本根本没跑，故第 1 层失败后无任何自愈，站点持续宕机。此外 `Report Failure` step 引用 `steps.rollback.outputs.rollback_status`，但该 step 从未设置 `id: rollback`。

## 验收标准

### 回滚脚本可执行（先修不可逆的安全网）

```
Given 部署失败触发 Rollback on Failure step
When bash 解析并执行回滚脚本
Then 脚本无语法错误（bash -n 通过）
And 外层 if/else 正确闭合
And step 声明 id: rollback，Report Failure 能读到 rollback_status
And 无历史版本时明确报"无法回滚"，有历史版本时 SSH 回滚到上一个 good commit 并健康检查
```

### 部署失败可观测（消除 init_db traceback 盲点）

```
Given docker compose up 或健康检查失败
When 部署脚本进入失败分支
Then 自动抓取 docker compose ps 与 backend 容器最近 150 行日志到 Actions 日志
And init_db.py 的真实 traceback 在 Actions 日志中可见
```

### 磁盘空间回收（阻断最可能诱因）

```
Given 生产机历经多次 build --no-cache 堆积悬空镜像/层
When 部署脚本在 up 之前运行
Then 打印 df -h、docker system prune -af（仅清未引用镜像/缓存）、再打印 df -h
And 绝不使用 --volumes，backend-data 数据卷及用户数据不受影响
```

### 慢启动不被误判 unhealthy

```
Given 棕地数据卷首次整库对账（约 1.7 万行）比"库已存在即跳过"慢
When 后端容器启动
Then healthcheck start_period=40s、retries=5，给足对账时间
And 不因慢启动被误判 unhealthy 拖垮前端依赖
```

### 内容级冒烟测试（杜绝 seed 静默降级假绿）

```
Given 部署成功、冒烟测试运行
When 请求 GET /api/word-banks
Then 断言至少一个词库 total_words >= 1000
And 若 seed 失败/降级（词库仍只有几个词），冒烟测试失败并触发回滚（不会假绿）
```

## 技术设计

### API 变更
无（冒烟测试只**读** `GET /api/word-banks`，契约不变）。

### 组件变更
- `.github/workflows/ai-native-pipeline.yml`：
  - `Rollback on Failure` step：补齐缺失的外层 `fi`；新增 `id: rollback`。
  - `Deploy to Production Server` step：`up` 前新增 `df -h` + `docker system prune -af`（不带 `--volumes`）+ `df -h`；`up` 失败与健康检查失败两个分支各自抓取 `docker compose ps` + `logs --tail=150 backend`。
  - `Run Smoke Tests` step：新增测试6，断言最大词库 `total_words >= 1000`。

### 数据库变更
无。seed 逻辑（`backend/app/seed.py` 整库对账）沿用 PR #60，不改动。

### 配置变更
- `docker-compose.prod.yml`：backend healthcheck `retries: 3→5`、`start_period: 10s→40s`。

## 测试证据（本地全绿）

- **Shell 语法**：对 workflow 全部 17 个 `run:` 块跑 `bash -n`，全部通过（回滚 `line 66` 语法错误已消除）。
- **YAML**：`yaml.safe_load` 通过。
- **后端**：`pytest` 59 passed（seed/init_db 行为未改，回归绿）。
- **前端**：lint / typecheck clean；unit 133 passed。
- **E2E**：本 hotfix 不改任何前端/API 代码，E2E 生产配置未变，PR #60 的 63 passed 覆盖用户面行为，不受影响；本次未引入用户面新功能，故不新增 E2E。

## 关联Issue
- SOU-41（修复 PR #60 部署失败宕机）

## 遗留与后续

- 若下次部署仍失败：现在 Actions 日志会带出 `init_db.py` 的真实 traceback，据此精确定位（磁盘满 / 只读卷 / 其它）。修复后的回滚会自动回退到上一个 good commit，站点先恢复到旧版本再迭代。
- 可复用沉淀：**部署失败必须让容器日志进 CI 日志**、**内容级冒烟（不只看 200）**、**改 CI shell 必过 `bash -n`**，已纳入本 REQ 作为部署硬化清单。
