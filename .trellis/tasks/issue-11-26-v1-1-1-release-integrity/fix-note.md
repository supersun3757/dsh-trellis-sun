# Fix Note

## 改动清单

| 文件 | 改动 |
|---|---|
| `package.json` | `version` 1.1.0 → **1.1.1**；`files` 增加 `CHANGELOG.md` |
| `scripts/install.mjs` | 新增 `nodeFsFileSystem`（`ctx.fs` 形状的 `node:fs` 适配器）与 `reseedProjectSkills`（转调 `lib/skills.js` 的 `ensureProjectSkills`，`force: true` + `dryRun` 透传）；CLI 新增 `--reseed` / `--project`，在 profile 解析**之前**处理；`--project` 缺值直接报错而不是回落 cwd；**一次只允许一个模式**（`--reseed` 与 `--uninstall` / `--fix-deps` / `--patch-harness` / `--auto` 冲突即退出 1）；`main` 改 `async`；帮助文本同步（含删掉「`--auto` 给 postinstall 用」这句误导）；导出 `parseArgs` / `nodeFsFileSystem` / `reseedProjectSkills` 供测试 |
| `lib/skills.js` | `ensureProjectSkills` 新增 `dryRun` 参数并透传给 `pruneDeprecatedProjectTemplates`（清理走裸 `fs.unlinkSync`，写入适配器拦不住，否则 `--reseed --dry-run` 会真删文件）；返回值补上过去被丢弃的 `pruned` 列表 |
| `skills/_templates/work-types.md` | 「Review 节奏」新增小节「大 review 怎么跑（可执行定义）」：入口检查命令、`delegate` 模式取值与执行口径、`native` 模式需显式授权、工具缺失时的 5 项固定降级清单与记录口径；把含糊的 `managed` 模式表述改为实际的 `native` / `delegate` |
| `CHANGELOG.md` | 新增 `v1.1.1 — 2026-11-26` 中英双语条目（含本批全部修复与真实测试数） |
| `test/install.test.js` | 4 → 15 个用例（新增 11） |
| `.trellis/tasks/issue-11-26-v1-1-1-release-integrity/` | 本任务的 report / analysis / fix-note / task.json |

## 验证证据

1. **全量回归**：`node --test` → `# tests 344 / # pass 344 / # fail 0`（v1.1.0 tag 时 329，HEAD 基线 333；本次 +11）。
2. **真机重播种**（缺陷 1 的核心证据）：

   ```
   node scripts/install.mjs --reseed --project %TEMP%\trellis-e2e-proj --dry-run
   目标版本: 1.1.1 / 覆写: 15 个 / 保留: 0 个 / 清理: （无）
   ```

   实跑后 `.trellis-version` 由 `1.1.0` → `1.1.1`，`.agents/skills` 16 个目录，
   播种出的 `_templates/work-types.md` 含 `ocr delegate rule` 的新文本。
   （改前：该项目的 marker 等于包版本 1.1.0，`isUpgrade=false`，任何技能正文修补都送不进去。）
3. **打包**：`npm pack --dry-run` → `version: 1.1.1`、`total files: 55`、含 `CHANGELOG.md`。
4. **发布管道**：`node scripts/extract-changelog.mjs v1.1.1` 正常抽出 5124 字符的中英双语条目。
5. **参数边界**（三条都是真启动脚本的子进程用例）：`--reseed` 不需要 profile、`--project` 缺值退出非 0 且不写 cwd、
   `--reseed --uninstall` 被拒绝且不写任何目标目录。

## 新增测试（11）

1. 已播种 1.1.0 + 陈旧技能正文的项目 → `--reseed` 覆写正文并把 marker 写成当前版本，`present` 为空。
2. `--dry-run` → 正文与 marker 都不动，输出带 `[dry-run]` 前缀。
3. `--dry-run` **不删除**废弃模板（`_templates/feat/implement.md`），但会在 `pruned` 与输出里报告（再真跑断言被删）。
4. 全新项目（无 `.agents/skills`）→ 正常补齐，marker 落盘。
5. 项目根不存在 → `ok:false` 且报「项目目录不存在」。
6. 项目根是文件 → `ok:false` 且报「不是目录」（不吐原始 `ENOTDIR`）。
7. `--reseed` / `--project` 解析；未知参数仍 `help:true`。
8. `nodeFsFileSystem` 对缺失路径返回 `null` 而不是抛错（`ensureProjectSkills` 依赖的契约）。
9. **CLI 接缝**：`--reseed --project <tmp>` 子进程退出 0 且不需要 profile，cwd 不被写。
10. **CLI 接缝**：`--project` 缺值退出非 0，cwd 不被写。
11. **CLI 接缝**：`--reseed --uninstall` 退出非 0，目标目录不被写。

## 自查发现并修掉的两个新洞

1. **`--dry-run` 会真删文件**：`ensureProjectSkills` 的废弃模板清理用裸 `fs.unlinkSync`（`lib/skills.js`），
   **不经过 `dshFs` 适配器**，第一版 `--reseed --dry-run` 会真的删。修法：`dryRun` 一路透传，预览只记入 `pruned`。
2. **`--project` 缺值 → 写进 cwd**：`argv[++i]` 拿到 `undefined` 时回落到 `process.cwd()`，而这里 cwd 是**写目标**。
   （独立检查者在验证时真的踩到了：`node scripts/install.mjs --reseed --project` 把技能播进了本仓库，
   它按绝对路径核对后删除了 `C:\Code\projects\dsh-trellis-sun\.agents`，仓库零改动、`git status` 已复原。）
   修法：缺值即 `args.error`，退出 1。

## 独立检查（`trellis-agent-check`）结论

总判定 **pass**（0 blocking / 5 should-fix / 7 note）。处置：

| 发现 | 处置 |
|---|---|
| `--reseed` 与其它模式 flag 静默抢占、exit 0 | **已修**：`MODE_FLAGS` 冲突检测，退出 1 |
| `--project` 缺值静默回落 cwd | **已修**：缺值报错退出 1 |
| `--help` 仍写「`--auto` 供 postinstall 使用」 | **已修**：改为说明本包没有 postinstall |
| fix-note / task.json 数字落后（339 / 6 个 / 6 个文件） | **已修**：见本文与 task.json |
| 新测试绕开 CLI 接缝，`if (args.reseed)` 整段可删而全绿 | **已修**：补 3 条 `spawnSync` 真启动用例 |
| `nodeFsFileSystem` 与 `FileSystem` 类型不等价（Stats/FsInfo 等） | **不改**：`lib/skills.js` 只做真值判断与 `.name` 读取，属潜在类型漂移；加类型层会引入 dsh 依赖，与零依赖取舍冲突 |
| `--reseed` 不校验是否为 Trellis 项目 | **不改**：这是刻意的（要能修复任意目标），改为在 `--help` 明写「**会写入目标目录**」 |
| dry-run 日志前缀不统一（`[sun-trellis] would prune` vs `[dry-run] 清理`） | **不改**：库层日志与会话运行时共用，改成中文前缀会影响线上日志口径 |
| README / FORK 未写 `--reseed` | **不改**：README 本来就不记录安装器 flag（只写 `dsh plugin add`）；入口是 `--help` 与 CHANGELOG |

## tag 处置（与原计划的偏差）

原计划把 `v1.1.0` 移到 `aeabf38`。核对后发现两个事实，因此**不改写已推送的 tag**：

1. `v1.1.0` 是 **annotated tag**（`7f965e3` → `d26cb1c`）且已 push 到 origin，移动等于 `git push --force` 改写已发布 ref；
2. 改写会让「v1.1.0 在 Windows 上装不上」这段历史消失，而它正是 1.1.1 存在的理由。

改为：`v1.1.0` 保持指向 `d26cb1c`（`package.json` 版本确实是 1.1.0，自洽），
新提交打 **`v1.1.1`**，安装器 YAML 修复与 4 个 YAML 用例归到 1.1.1 的条目里。CHANGELOG 已按此口径改写
（v1.1.0 = 318 → 329 / 11 个；v1.1.1 = 329 → 344 / 15 个）。

## 残留债务

- **不是代码问题，仍是环境门**：`#3` 的 `codebase-memory-mcp` 图协议仍未对真服务跑过一次。
  本次新增的大 review 降级口径与 `graph-queries.md` 同构，等网络可用时补 POC。
- **大 review 的降级清单是文本约定**，没有测试钉住（外部工具，无法在 CI 稳定复现；把 OCR 变成测试依赖与零依赖取舍冲突）。
- 抬版本会让所有已装项目在下次会话启动时重播 15 个技能目录（一次性写）。这是设计意图，但值得知道。
- `CHANGELOG.md` 已近 100kB 并随包分发；继续增长时可能要拆历史版本文件。
- `main()` 函数体存在 pre-existing 的缩进不一致（`if (args.help) {` 顶格），不是本次引入，未顺手改。
