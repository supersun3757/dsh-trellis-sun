# Graph Queries（codebase-memory-mcp 接入约定）

**图服务是外部依赖，不是本插件的组成部分**：本仓库只带行为层（何时查、查什么、查不到怎么办），
二进制与图索引不进插件、不随包分发。所有图查询都遵守本文的纪律，各 skill 只写自己的阶段要点。

## 依赖与连接

| 项 | 约定 |
|---|---|
| 服务本体 | `codebase-memory-mcp`，钉版本（调研基线 v0.12.1）；装在主力本，独立进程 + SQLite 图索引 |
| 连接方式 | **只用 DSH 内置 `@deepseek-ai/dsh-mcp-client` 原生挂载**（stdio 直接指向二进制）。第三方薄桥 `princeofdream/dsh-codebase-memory-mcp` 已证否：DSH 0.2.x 按**命名导出**加载插件，它只给 `export default`，且默认 `failOnStartupError: true`——spawn 失败会把异常抛进宿主启动路径，**表现是白屏**。不要再挂第三方桥 |
| 工具名 | 会话里呈现为 `mcp__<server>__<tool>`；下文用不带前缀的短名，实际调用前以当前工具列表为准 |
| 数据边界 | 本地进程、本地索引；**禁止**把代码发往云端或 managed 端点 |

主要工具（名字取自 0.12.1 二进制自报的 `--help`，共 17 个；以下四个是各阶段实际会用的）：

- `get_architecture`（分层与模块骨架，`--aspects` 控制详略）
- `search_graph`（按名字/模式找符号，带文件与行号）
- `trace_path`（调用链，`--direction inbound|outbound|both`，默认 `depth=3`）
- `detect_changes`（改动波及面，`--scope impact|files|tests`，`--direction inbound` 走调用者）

⚠️ **没有名为 impact 的工具**（别照名字去找）：0.12.1 里 `cli impact` 直接返回 `unknown tool`。
「波及面」一律用 `detect_changes --scope impact`。CLI 也支持 `--args-file` 或管道传入参数，
裸 JSON 参数已标记 deprecated。

## 环境前置（跑不通就别开始查）

**第 0 步：服务装没装。** `codebase-memory-mcp --version` 能打印版本才算装了。装都没装时，
下面两种症状一个都不会出现——表现是「命令不存在」，那是**缺依赖**，不是「没索引」；
直接按下方「降级」处理，并在产物里写明「图服务未安装」，不要反复重试也不要去重建索引。

装上了之后，起不来有两种，症状完全不同，**都不等于「没索引」**：

1. **默认 profile 被拒绝**（Windows）：0.12.1 把 daemon 端点钉在 `%LOCALAPPDATA%\cbm-daemon-<hash>\`
   （`cbm-lifetime.lock` / `cbm-rendezvous.lock` / `cbm-version-cohort-*.lock`），并在创建前检查祖先目录的 DACL。
   只要祖先（典型是 `C:\Users\<你>\AppData`）上有 ACE 把 Modify 授予其它身份（沙箱组、孤儿 SID 都算），
   就直接报 `secure daemon endpoint could not be created: ... DACL entry N grants mutation rights ...` 并退出。
   `install` 也会被同一条检查拒绝（`activation could not reserve exclusive access`）。
   ⇒ 这**不是**索引问题，别去重建索引、别反复重试；要么把服务指向一个硬化过的 home（断继承、只留本人/SYSTEM/Administrators，
   再用 `USERPROFILE`/`APPDATA`/`LOCALAPPDATA`/`TEMP` 重定向），要么按下方「降级」处理。
2. **端点建得起来但索引写不进**（旧 daemon 存活）：见下条「索引纪律」第 3 点。

自检命令（按顺序跑，任一步失败即降级）：

| 检查 | 命令 | 通过的样子 |
|---|---|---|
| 装了没 | `codebase-memory-mcp --version` | 打印版本号；命令不存在即未安装 → 直接降级 |
| 服务能起 | `codebase-memory-mcp cli list_projects` | `projects: N`，不出现 `DACL entry` |
| 索引在 | `codebase-memory-mcp cli index_status --project <name>` | `status: ready` + 近期的 `indexed_at` |
| 写入没锁死 | 重建一次索引，再看 `indexed_at` | 时间戳前移 |
| 端点归属 | 看 `%LOCALAPPDATA%\cbm-daemon-*\*.lock` 的时间戳 | 与本次进程一致；残留旧锁视为可疑 |

## 索引纪律

1. **进任务先确认索引**：查一次架构/索引状态；当前仓库没有索引就先建，再开始查询。
2. **建不起来就降级，不要硬查**：建索引失败时按下方「降级」处理，并在产物里写明原因。
3. **升级后先验证旧 daemon 已退出**：升级二进制后旧 daemon 可能仍存活，会锁死写入而读调用照常成功——
   表现为「写不进新索引但读得到旧图」，极易误判成「没索引」。按上表「写入没锁死」一跳自检
   （重建索引后看 `indexed_at` 是否前移），或先结束旧 daemon 进程再重建索引。
4. **索引陈旧时先重建**：最近一次索引提交早于当前 HEAD 时，先重建再查，否则波及面是错的。

## 查询纪律（失败换参，不无限重试）

- 单条查询失败最多**换参重试 2 次**，每次换一个维度：
  1. 收窄/放宽符号名或模式（`search_graph`）；
  2. 改用文件路径或模块名定位，而不是符号名；
  3. 改用上游/下游方向（`detect_changes` / `trace_path`）。
- 2 次仍失败即判定「图服务不可用」，按降级处理，并在产物中记录尝试过的参数。
- **读调用成功 ≠ 索引可用**：结合写入自检（第 3 条）判断，不要把读到旧图当成事实。

## 降级（服务缺失或不可信时）

- 退回文本检索与读文件（`grep` / `glob` / `read`），范围由改动集或任务产物确定，不靠猜。
- 在产物（design.md / review.md / fix-note.md / apply-notes.md）里**显式写明降级**：
  「图服务不可用，改用文本检索」，并给出检索入口。
- 降级结果不得表述为图查询结论；波及面不完整时标注「未覆盖」。

## Qt 仓库门禁

- **验证范围只有本仓**：图服务是在 `dsh-trellis-sun` 自身上跑通的（3469 节点 / 6644 边，建索引 14 秒；
  `trace_path` 对 `ensureProjectSkills` 返回 3 个调用者，与真实代码一致）。Qt 工程的解析精度——
  信号槽、moc 生成代码、模板实例化——**没有验证过，也没有安排过对照实验**，任何「Qt 上查得准」的说法目前都不成立。
- 未验证按未验证处理：Qt 层的关键结论必须另有文本或运行时证据支撑，不能只凭图；
  图查不到时按上面的降级口径退回 `grep` / `glob` / `read`，并在产物里写明「Qt 层图结果未验证」。
- 未验证 ≠ 不可用：纯 C++ 业务层照常使用图查询。若日后在 Qt 工程上实测出精度不足，
  再收紧为「Qt 仓库停用图查询」——以实测数据为准，不预设立场。
