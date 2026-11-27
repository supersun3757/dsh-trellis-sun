# Feature Code Review

status: passed
snapshot: 工作区未提交，基于 HEAD aa7e485 + 未提交改动（`aa7e4858703d1b8d45dba95d966320cb1018624f`，无额外快照）
base: aa7e485
round: 2

## Diff 范围

- 快照：**工作区未提交，基于 HEAD `aa7e485` + 未提交改动**。评审基线不是任何 commit，而是 `git status --porcelain` 现场列出的那 17 项；下文所有 file:line 都指工作区当前内容。
- base：`aa7e485`（本任务的全部改动都还没提交，因此 base 与 HEAD 同一提交）。
- 现场核对命令与结果：

```text
$ git -C C:\Code\projects\dsh-trellis-sun rev-parse HEAD
aa7e4858703d1b8d45dba95d966320cb1018624f
$ git status --porcelain
 M CHANGELOG.md
 M README.md
 M README_EN.md
 M lib/index.js
 M lib/skills.js
 M package.json
 M skills/_templates/feat/review.md
 M skills/_templates/work-types.md
 M skills/dsh-trellis-sun-check/SKILL.md
 M skills/dsh-trellis-sun-feat/SKILL.md
 M skills/dsh-trellis-sun-issue/SKILL.md
 M skills/dsh-trellis-sun-refactor/SKILL.md
 M test/skill-contract.test.js
?? .trellis/tasks/feat-11-27-doc-review-two-tier/
?? skills/_templates/doc-review.md
?? skills/dsh-trellis-sun-doc-review/
?? test/doc-review-seam.test.js
$ git diff --stat
 13 files changed, 243 insertions(+), 10 deletions(-)
```

- 改动集：**13 个已跟踪文件修改 + 4 项新增**（任务目录内含 `prd.md` / `design.md` / `spec-delta.md` / `review.md`）。
- 与派单清单的差异：**派单清单没有漏项也没有多项**。清单里没有点名、但确实属于本次改动集的只有 `.trellis/tasks/.../spec-delta.md`（任务目录内产物，非代码）。`lib/artifact.js` 未被改动（`git status` 中不出现），符合「不该改产物白名单」的约束。

## 覆盖清单（改动集里每个文件都要有结论）

| 文件 | 结论 | 依据 |
|------|------|------|
| `lib/skills.js` | 通过 | 仅 2 处注释 15→16 与 `SKILL_DIRS` 增加 `'dsh-trellis-sun-doc-review'`（`:113`）；数组现为 16 项，与磁盘 16 个 `dsh-trellis-sun-*` 目录一一对应（见验证证据 E1） |
| `lib/index.js` | 通过 | 仅 `:13` 注释 `15` → `16`；无逻辑改动（`git diff -- lib/index.js` 只有 1 行） |
| `package.json` | 通过 | 仅 `version` `1.1.3` → `1.2.0`；`dependencies` 仍为 `null`（无运行时依赖引入），`files` 含 `skills`，新技能随包分发 |
| `skills/_templates/doc-review.md`（新增） | 有问题 | 协议本体齐全（S1–S4 表含「命中级别」，D1–D7 表**不含**）→ R1 |
| `skills/dsh-trellis-sun-doc-review/SKILL.md`（新增） | 通过 | 六步 + 硬卡点 + 报告落点/`draft`→`confirmed`/不卡门禁/不改被审文档全部写明；frontmatter `name` 与目录名一致 |
| `test/doc-review-seam.test.js`（新增） | 有问题 | seam 1 真实有效（M6 变异 → `not ok 1`）；seam 2 声称「双向」但**只挡得住一个方向** → R2 |
| `test/skill-contract.test.js` | 通过 | 追加 5 个 `test()`；断言经变异实测非永真（M1/M2/M4 各打红对应用例） |
| `skills/_templates/work-types.md` | 有问题 | 新增「文档审查节奏（两级）」与 4 条纪律自洽；但 `:165` 与 `:93` 对同一触发条件的口径不一致 → R4 |
| `skills/_templates/feat/review.md` | 通过 | 新增「文档审查（小审 S1–S4）」节插在 `## 结论` 之前；四行维度表 + DR 发现表 + 「S1/S2/S3 命中未处理不得勾通过」与协议一致 |
| `skills/dsh-trellis-sun-feat/SKILL.md` | 通过 | review 阶段行、文档 review 小节、人卡点（新增第 3 条后旧 3–5 顺延为 4–6，无悬挂编号引用）、子代理表、2 条反模式；`_templates/doc-review.md` 引用可解析 |
| `skills/dsh-trellis-sun-check/SKILL.md` | 通过 | 矩阵由 6 行扩到 7 行，第 7 行「文档审查落定」+ 与第 5 行划界块引用；行号自称（第 5 / 第 7）与实际行序一致 |
| `skills/dsh-trellis-sun-issue/SKILL.md` | 通过 | 一条「文档小审（按需）」，落点 `fix-note.md`，不新建产物；与 `work-types.md` issue 段引文同口径 |
| `skills/dsh-trellis-sun-refactor/SKILL.md` | 通过 | 同上，落点 `apply-notes.md` |
| `README.md` | 通过 | 特性 +1 条、§6 补两级与不采用项、结构树 `15` → `16`；`README.md:324` 计数与磁盘一致 |
| `README_EN.md` | 通过 | 与中文版同构改动；`README_EN.md:328` 计数一致 |
| `CHANGELOG.md` | 有问题 | v1.2.0 双语条目结构与历史条目一致（`## vX` + `## 功能/文档/测试`），`extract-changelog.mjs v1.2.0` 抽出 6155 字符；但「349 → 356 全过」与「两种都会红」两处断言与实测不符 → R2、R3 |
| `.trellis/tasks/feat-11-27-doc-review-two-tier/{prd,design,spec-delta}.md` | 见「文档审查」节 | 小审 S1–S4 逐文件结论在下一节；`design.md` / `spec-delta.md` 仍为 `status: draft` → R5 |

## 发现

| 编号 | 级别 | 问题 | 文件:行号 | 引用原文 | 证据（命令/输出） | 状态 |
|------|------|------|-----------|----------|------------------|------|
| R1 | P1（blocking） | `prd.md` AC1 要求 11 个维度「每个维度写明 查什么 / 怎么查 / **命中级别**」，但 D1–D7 表没有「命中级别」列，只有 S1–S4 表有。AC1 按字面未满足；契约测试只断言编号存在，故不会报红 | `skills/_templates/doc-review.md:62`（D 表头）对比 `:33`（S 表头）；`prd.md:32` | `\| id \| 维度 \| 查什么 \| 怎么查 \|`（D 表） vs `\| id \| 查什么 \| 怎么查 \| 命中级别 \|`（S 表）；AC1 原文：「S1–S4 与 D1–D7 全部编号齐、每个维度写明「查什么 / 怎么查 / 命中级别」」 | `grep -n '^| id |' skills/_templates/doc-review.md` → 只输出 `33:` 与 `62:` 两行，62 行无「命中级别」；`test/skill-contract.test.js:217-222` 只做 `assert.match(doc, new RegExp('\\b'+id+'\\b'))`，不断言列 | open |
| R2 | P1（blocking） | `seam 2` 自称「in both directions」「两种都会红」，实测**只挡得住「磁盘多一个目录」**；「`SKILL_DIRS` 登记了但目录已不存在」这一方向**不报红**。原因是 `lib/skills.js:194` 对缺失目录 `continue`，使 `copied` 恰好等于 `SKILL_DIRS ∩ disk`，与 disk 做 `deepEqual` 永远看不到 `SKILL_DIRS ⊄ disk` | `test/doc-review-seam.test.js:85`（用例名）、`:89-91`（注释）；`lib/skills.js:194`；`CHANGELOG.md:37` / `:63`；`design.md:104` | 用例名「…in both directions」；注释「so `copied` is exactly SKILL_DIRS ∩ disk … catches both failure modes: an unlisted directory and a stale entry」；`lib/skills.js:194` `if (!fs.existsSync(srcDir)) continue`；`CHANGELOG.md:37`「两种都会红」；`design.md:104`「多一个少一个都红」 | 把 `skills/dsh-trellis-sun-meta` 整目录移出 `skills/`（磁盘 15 个，`SKILL_DIRS` 仍 16 项）后运行：`ok 2 - seam 2 …`、`# pass 2 / # fail 0`（绿）。对照：新建 `skills/dsh-trellis-sun-temp-mutation/` 后同一用例 `not ok 2`（红）。两个方向一红一绿，即证 | open |
| R3 | P1（blocking，证据缺口／环境） | `prd.md` AC7 要求「`node --test` 全绿，用例数 ≥ 355」，CHANGELOG 断言「349 → 356 全过」；**当前工作区实测 235 tests / 225 pass / 10 fail**，10 个测试文件在 import 阶段即失败。根因是 `node_modules` 依赖树不完整（多个 `.pnpm` 包目录为空），**不是本次改动引入**，但 AC7 因此无法勾选，356 这个数字在本机不可复现 | `prd.md:44`；`design.md:105`；`CHANGELOG.md:36` | 「`node --test` 全绿，用例数 ≥ 355（基线 349 + 新增 ≥ 6）」；「349 → **356** 全过」 | `node --test` → `# tests 235 / # pass 225 / # fail 10`，失败文件：assemble、doc-config-route、index、mount、native-steps、settings-projection、settings、skill-contract、spec-delta-seam、task-binding。首个错误：`Cannot find package '…\.pnpm\@deepseek-ai+dsh-tools@0.2._8b6…\node_modules\@deepseek-ai\cordis\index.js'`；该目录 `Get-ChildItem` 为空（0 项），而 `node_modules` 目录 `LastWriteTime = 2026/11/27 15:21:14` 晚于最后一个源码文件 `test/doc-review-seam.test.js` 的 `15:16:51`。`git diff` 未改任何 import，`lib/artifact.js` 未被改动，故依赖破损与本次改动无关 | open（需在依赖完整的机器上重跑一次全量，或修复 `node_modules` 后复测） |
| R4 | P3 | 同一触发条件在同一文件内两个口径：节奏表写「≥ 3 份**或合计 ≥ 800 行**」，子代理表只写「≥ 3 份」，`design.md` 与 feat 技能都带 800 行条件。照子代理表执行会漏掉「2 份但 900 行」的场景 | `skills/_templates/work-types.md:165` vs `:93` | `:165` `\| 文档小审 \| 主会话 inline（被审文档 ≥ 3 份时派子代理） \| S1–S4 → 阶段产物的一节 \|`；`:93` 「主会话 inline；被审文档 ≥ 3 份或合计 ≥ 800 行时派独立子代理」 | `Select-String -Path skills/_templates/work-types.md -Pattern '800 行\|≥ 3 份'` → 命中 2 行（93 / 165），仅 93 带 800 行；`design.md:90` 与 `skills/dsh-trellis-sun-feat/SKILL.md` 的文档 review 小节均为「≥ 3 份或合计 ≥ 800 行」 | open |
| R5 | P3（流程，需 owner 确认） | `design.md` 与 `spec-delta.md` 仍是 `status: draft`，且 design 自己的人审检查点未勾，而实现文件已全部落地。若 owner 已在会话中口头批准、只是文件未更新，则属记录滞后；若未批准，则 impl 越过了自己定的门禁。**我无法从仓库状态判定是哪一种** | `design.md:3`、`design.md:119`、`spec-delta.md:3` | `status: draft   # draft \| approved`；`- [ ] 设计已获用户确认（status=approved）后再进入实现` | `grep -n 'status:' design.md spec-delta.md` → 两处均为 `draft`；同时 `git status` 显示 13 个实现文件已改 | 未验证（需 owner 一句话确认） |

- 证据三要素（文件:行号 + 引用原文 + 复现命令/输出）缺一不可；证据不足的结论写「疑似 / 未验证」，**不许把猜测写成发现**。

### 疑似 / 未验证（不构成发现）

- **疑似：`CHANGELOG.md` 的「356」可能对不上真实用例数。** 静态清点 `^test(` 共 314 处，node 实跑口径 235（10 个文件各计 1）；若把 10 个坏文件按其静态条数补回约 352–356。缺的证据是：一台依赖完整的机器上跑一次 `node --test` 的 `# tests` 行。故只记「疑似」，不判 CHANGELOG 造假。
- **疑似：`docs/ref/dsh-0.2.0-rc.2-audit.md:141` 的「15 个技能目录」已过时。** 该文件是 DSH 0.2.0-rc.2 时点的审计快照，按其自述属历史记录，故不列为发现，仅提示：若它被当现行参考引用，需要补一句时点。
- **未验证：大审技能在真实项目上的可执行性。** `.trellis/reviews/` 目录当前不存在（`Test-Path` → `False`），技能文本写明「目录不存在则创建」（`SKILL.md:58`），口径一致；但本仓没有 `doc.json`，`$root` 回退路径只能从 `lib/spec.js:21-22` 的注释侧证（无配置 → 扫 `.trellis/spec/` Markdown 树），未实跑一次大审。

## 验证证据

### E1 事实核对（技能数 / 产物数 / 播种 / 分发）

```text
$ (Get-ChildItem skills -Directory | ? Name -like 'dsh-trellis-sun-*').Count
16
$ lib/skills.js SKILL_DIRS 条目数 → 16（:109-:124），含 'dsh-trellis-sun-doc-review'（:113）
$ README.md:324  「16 个内置工作流技能 + _templates/（… graph-queries 与 doc-review 协议）」
$ README_EN.md:328「16 bundled workflow skills + _templates/ (… graph-queries and doc-review protocols)」
$ lib/index.js:13「the 16 `dsh-trellis-sun-*` skills」；lib/skills.js:4 同
```

- **「16 个技能」四处 + CHANGELOG 一致，与磁盘一致**：`SKILL_DIRS` 16 = 磁盘 16 = README 16 = README_EN 16 = 两处 lib 注释 16。HEAD 侧为 15（`git diff` 显示四处均为 `15` → `16`）。
- **`CURRENT_ARTIFACTS` 仍是 10**：`lib/artifact.js:27-38` 逐条为 `prd.md / design.md / spec-delta.md / review.md / report.md / analysis.md / fix-note.md / scan.md / refactor-design.md / apply-notes.md` = 10；`LEGACY_ARTIFACTS` 4 个；`ALLOWED_ARTIFACTS` 不含 `doc-review.md`。`lib/artifact.js` 未出现在 `git status` 中。
- **`_templates/doc-review.md` 真的会被播种**：`lib/skills.js:215-224` 对 `_templates/` 逐文件复制（`collectFiles` 递归），seam 1 实跑断言 `existsSync(root/.agents/skills/_templates/doc-review.md) === true` → `ok 1`。
- **无运行时依赖引入**：`package.json` 的 `dependencies` 仍为 `null`（只有 `peerDependencies` / `devDependencies`），本次 diff 只改 `version`。
- **分发与抽正文**：`node scripts/extract-changelog.mjs v1.2.0` 正常输出双语正文，长度 6155 字符；CHANGELOG 的标题层级（`## vX` + `## 功能/文档/测试`）与 v1.1.2 / v1.1.3 历史条目同构。
- **「不卡门禁」是否真的不卡**：大审侧三处独立文本一致（`doc-review.md:18`、`SKILL.md:62`、`work-types.md` 节奏节「**大审不卡任何门禁**」）；小审侧一致地只让 S1/S2/S3 卡（`doc-review.md:18`、`feat/SKILL.md` 人卡点 3、`check/SKILL.md` 第 7 行）。**两处口径自洽，未发现「声称不卡却写进 blocking」的矛盾。**
- **check 矩阵第 5 行 vs 新增第 7 行**：矩阵实际 7 行，第 5 行「PRD 验收标准」、第 7 行「文档审查落定」，划界块引用自称「第 5 行与本表第 7 行」，与实际行序一致；`design.md:20`「不改现有六行矩阵语义，只追加一行」与 6 → 7 相符。
- **取材出处可核**：两个 URL 均 HTTP 200（`zircote-plugins/documentation-review`、`NeonSparklex/dsh-report-reviewer-zh-Hans`），GitHub API 返回 `license.spdx_id = "MIT"` 两份皆是；`prd.md:7-8` 点名的 `agents/doc-reviewer.md`、`skill/report-review.md`、`roles/*.md` 经 contents API 逐个确认存在。
- **`prd.md` 里可落地的引用**：`commit 2020faf` 在库内存在（`git cat-file -t 2020faf` → `commit`）；`.trellis/spec/trellis-workflow/task-engine/index.md` 存在；`spec-delta.md:13` 的目标文件正是该路径；`skills/dsh-trellis-sun-spec-bootstrap/SKILL.md:60,73` 确含「不修改业务文档正文」（`design.md:40` 的引用成立）；`doc_read` / `pdf_read` / `doc_ocr` 在 `lib/` 与 `skills/` 中均无命中（`prd.md:22` 的否定断言成立）。

### E2 `node --test` 实测

```text
$ cd C:\Code\projects\dsh-trellis-sun; node --test
# tests 235
# pass 225
# fail 10
[exit code: 1]

失败文件：assemble / doc-config-route / index / mount / native-steps /
          settings-projection / settings / skill-contract / spec-delta-seam / task-binding
首个错误：ERR_MODULE_NOT_FOUND  …\.pnpm\@deepseek-ai+dsh-tools@0.2._8b6…\node_modules\@deepseek-ai\cordis\index.js
```

- **这是环境破损，不是断言失败**：10 个文件都在 import 阶段就死，无一进入 `test()`。`git diff` 未触碰任何 import 语句，`lib/artifact.js` 未被改动，破损点在 `node_modules/.pnpm/` 内部（`@deepseek-ai/cordis`、`schemastery`、`cosmokit` 等多个包目录为空目录）。时间线：最后一个源码文件 15:16:51 → `node_modules` 与空包目录 `LastWriteTime` 15:21:14。
- **为把新测试跑到，我在仓库外建了一个 ESM loader 桩**（`%TEMP%\dshstub\loader.mjs`，仅把 `@deepseek-ai/dsh-tools` 映射到桩，仓库文件零改动）：
  - `node --test test/skill-contract.test.js` → `# tests 17 / # pass 17 / # fail 0`
  - `node --test test/doc-review-seam.test.js`（无需桩）→ `# tests 2 / # pass 2 / # fail 0`
  - 全量加桩后 `# tests 289 / # pass 282 / # fail 7`（仍有 7 个文件卡在别的空包上），**无法把全量跑绿**，故 AC7 只能判「未验证」。

### E3 变异测试（证明新测试不是永真）+ 还原证明

| 变异 | 内容 | 期望 | 实测 |
|------|------|------|------|
| M1 | `doc-review.md` 把「没有引用的意见直接删掉」改成「…应当删掉」 | 打红「protocol defines both tiers…」 | `not ok 13`（红） |
| M2 | `work-types.md` 删掉「**大审不卡任何门禁**」 | 打红「work-types wires both tiers…」 | `not ok 19`（红） |
| M3 | `check/SKILL.md` 第 7 行「文档审查落定」→「文档审查复核」 | 打红「the light doc review lands in existing artifacts…」 | `not ok 16`（红） |
| M4 | `doc-review/SKILL.md` 把「自证伪」全部改成「自我反驳」 | 打红「the heavy doc review is a standalone skill…」 | `not ok 15`（红） |
| M5 | 新建 `skills/dsh-trellis-sun-temp-mutation/`（有目录无登记） | 打红 seam 2 | `not ok 2`（红） |
| M6 | 把 `skills/_templates/doc-review.md` 移出 `skills/` | 打红 seam 1 | `not ok 1`（红），报 `missing provisioned file: _templates/doc-review.md` |

**结论：M1–M6 六个断言都能被打红，新契约测试与 seam 1、seam 2 的「多一个目录」方向都不是假绿灯**；唯一的假绿灯是 R2 指出的「少一个目录」方向。

还原证明（工作区回到原状，一字不差）：

```text
$ git status --porcelain          # 与开头 Diff 范围完全一致：13 M + 4 ??，无多余条目
 M CHANGELOG.md …（13 行同上）…
?? .trellis/tasks/feat-11-27-doc-review-two-tier/
?? skills/_templates/doc-review.md
?? skills/dsh-trellis-sun-doc-review/
?? test/doc-review-seam.test.js
$ Get-FileHash skills/_templates/doc-review.md, skills/dsh-trellis-sun-doc-review/SKILL.md, test/doc-review-seam.test.js
F062D3471CA5177E13558E6476920BFC059C7EA8FA8B4A70BD69ED183A9A4E04  doc-review.md
2A93D4365B90280998C33C8A23DA3EDF8E33523108035594607BC4E2B78951D3  doc-review/SKILL.md
89655B81435C44FB20FC1E78705EF2C47DB12648C08D6EDA48D5D2F7D74DDA5E  doc-review-seam.test.js
（三个哈希与变异前的备份逐位相同）
$ git diff --numstat -- skills/_templates/work-types.md skills/dsh-trellis-sun-check/SKILL.md
24	1	skills/_templates/work-types.md
6	0	skills/dsh-trellis-sun-check/SKILL.md
（与 `git diff --stat` 原始值「work-types.md 25 ++++++++-」「check 6 +++」一致）
$ (Get-ChildItem skills -Directory | ? Name -like 'dsh-trellis-sun-*').Count
16
```

> 过程留痕（自查，不隐藏）：还原 M2/M3 时我先用了 `git checkout --`，把这两个**已跟踪但未提交**的文件回退到了 HEAD 版本。随后按本会话早先抓到的原始 `git diff` 重建这两个文件的改动，用 `git apply --check` 通过后落盘，并用 `git diff --numstat` 逐文件比对（24/1 与 6/0）确认与原始改动逐行一致，再用 E3 的 M1–M5 复测（17+2 全绿）确认行为一致。工作区最终状态与开头 Diff 范围一致。这个坑本身值得记一笔：**脏工作区里不要用 `git checkout --` 还原变异，要用备份副本**。

## 文档审查（小审 S1–S4）

被审集合：`.trellis/tasks/feat-11-27-doc-review-two-tier/prd.md`（62 行）、`design.md`（119 行）。规则见 `skills/_templates/doc-review.md` 的 S1–S4；只比被审集合内部，不做跨文档对账。

| 文档 | S1 引用能落地 | S2 无占位与空洞 | S3 验收可测 | S4 文内自洽 | 结论 |
|------|---------------|-----------------|-------------|-------------|------|
| `prd.md` | 通过 | 通过 | 有问题 | 通过 | 需修（DR1） |
| `design.md` | 通过 | 通过 | 通过 | 有问题 | 需修（DR2） |

| 编号 | 维度 | 级别 | 问题 | 位置 | 引用原文 | 依据 | 处理 |
|------|------|------|------|------|----------|------|------|
| DR1 | S3 | P1 | AC1 的判定入口只断言「编号存在」，而 AC1 的判据还包含「每个维度写明 查什么 / 怎么查 / 命中级别」。判定窄于标准 ⇒ 该 AC 会**假通过**：实现里 D1–D7 恰好没有「命中级别」列（见 R1），测试仍然绿 | `prd.md:32-33` | AC1：「每个维度写明「查什么 / 怎么查 / 命中级别」」；判定：「`test/skill-contract.test.js` 对 11 个编号逐个断言。」 | 读 `test/skill-contract.test.js:217-222`：只有 `for (const id of [...]) assert.match(doc, new RegExp(...))`，无列/级别断言；读 `doc-review.md:62` 表头无「命中级别」 | open |
| DR2 | S4 | P3 | 同一事实（`test/skill-contract.test.js` 是**新增文件**还是**追加用例**）在 design 内部两处不一致：模块表把它和真正新增的 seam 文件并列标「**新增**」，验证计划里却只讲「追加断言」。事实是它在 HEAD 已存在（`git status` 为 ` M`），本次追加 5 个用例 | `design.md:37` vs `design.md:95-101` | `:37` 「`test/skill-contract.test.js`、`test/doc-review-seam.test.js` **新增**」 | `git status --porcelain` 对该文件显示 ` M test/skill-contract.test.js`（已跟踪、已修改），而 `?? test/doc-review-seam.test.js` 才是新增；`git diff --numstat` 为 92 行追加、0 删除 | open（措辞级；若「新增」是「新增用例」之意可判 wontfix） |

**S1 逐项核对记录（0 命中的依据）**

- `prd.md` 出现的 19 个可落地引用逐个核过：`_templates/feat/review.md`、`dsh-trellis-sun-check`、`skills/_templates/doc-review.md`、`lib/artifact.js`、`lib/skills.js`、`scripts/extract-changelog.mjs`、`.agents/skills/dsh-trellis-sun-doc-review/SKILL.md`、`test/skill-contract.test.js`、`test/doc-review-seam.test.js`、`CURRENT_ARTIFACTS`、`SKILL_DIRS`、`review.md` / `fix-note.md` / `apply-notes.md`、`.trellis/spec/trellis-workflow/task-engine/index.md`、`commit 2020faf`、两个外链仓库及 `agents/doc-reviewer.md` / `skill/report-review.md` / `roles/*.md`、`doc_read` / `pdf_read` / `doc_ocr`（否定断言）。**全部落地**（命令与输出见 E1）。
- 唯一「目标不存在」的是 `.trellis/reviews/`（`Test-Path` → `False`），但它在大审技能里是**输出路径**且明写「目录不存在则创建」，不算死引用。
- `design.md` 的引用同样逐个核过：`spec-bootstrap` 的「不修改业务文档正文」原句在 `skills/dsh-trellis-sun-spec-bootstrap/SKILL.md:60,73` 存在；`design.md:66` 声称「模板映射只扫 `_templates/<type>/` 子目录」与 `test/skill-contract.test.js:186` 的 `readdirSync(path.join(repoRoot,'skills','_templates',type))` 相符（新增的顶层 `_templates/doc-review.md` 不影响该用例）；`design.md:73` 称 check 已有「feat→review.md / issue→fix-note.md / refactor→apply-notes.md」三路先例，`check/SKILL.md:85-87` 确有三行。

**S2 逐项核对记录（0 命中的依据）**

- `Select-String -Pattern 'TODO|TBD|待补|待定|（略）|FIXME|XXX'` 对两份文件 → **0 命中**。
- 逐节看标题后第一段：`prd.md` 五节（背景 / 范围 / 验收标准 / 约束与风险 / 相关代码文档）与 `design.md` 五节（目标与非目标 / 需求拆解与实现方案 / 验证计划 / 风险与回滚 / 人审检查点）均有正文，无只有标题的空章节；表格无「声明了却空」的行。
- 文中出现的 `<yyyy-mm-dd>`、`<sha>`、`<原因>` 形态经逐个查看均为**格式占位说明**（如 `.trellis/reviews/<yyyy-mm-dd>-doc-review.md`），不是未填的待办，故不判 S2 命中。

**S3 逐条问「怎么判定通过」的记录**

- AC2/AC3/AC4/AC5/AC6/AC8/AC9 的判定都可执行（契约测试断言点、seam 实跑、读文件 + `extract-changelog.mjs`、review.md 四行表）。
- AC7 的判定（`node --test` 的 `pass` 计数）本身可执行，只是**当前环境跑不出**（R3），属证据缺口而非判据缺失，故 S3 判通过、把问题记在 R3。
- AC1 的判定与判据不等价 → DR1。

**S4 逐项交叉比对记录（prd ↔ design）**

- 测试基线：`prd.md:44`「基线 349」 = `design.md:105`「基线 349」 ✔
- 目标：`prd.md:44`「≥ 355」 = `design.md:105`「≥ 355」 ✔（且 349 + 新增 ≥ 6 与「新增 7 个用例」不冲突）
- 技能数：`prd.md:17`「第 16 个技能」 = `design.md:35`「第 16 个技能」 = `design.md:36`「15 skills → 16 skills」 ✔
- 产物数：`prd.md:26`「`CURRENT_ARTIFACTS` 仍是 10 个」 = `design.md:101`「大小仍为 10」 ✔
- 编号数：`prd.md:33`「11 个编号」 = `design.md:96`「共 11 个编号」 ✔（S1–S4 4 + D1–D7 7）
- 计数同步处：`prd.md:53`「四处同步（`lib/skills.js` 注释、`lib/index.js` 注释、`README.md`、`README_EN.md`）」与实际 diff 的四处一致 ✔
- 小审对象：`prd.md:16`「feat review 阶段、check 复核、issue / refactor 按需」 = `design.md:47`「prd/design/spec-delta 或 report/analysis、scan/refactor-design」 ✔
- 唯一不一致 → DR2。

## 结论（第 1 轮，已被第 2 轮取代——现行结论见文末「结论（第 2 轮）」）

- [ ] 通过（含 `dsh-trellis-sun-check` 与任务要求的验证）
- [x] 需修复后重审

**status: blocking**（第 1 轮判定），blocking 3 条：

1. **R1**：`doc-review.md` 的 D1–D7 表缺「命中级别」列，`prd.md` AC1 按字面未满足（修法：给 D 表加一列默认级别，或把 AC1 的措辞收窄到「S 表写级别、D 表在报告 §3 逐条给级别」——二选一，别让 AC 与产物各说一套）。
2. **R2**：`test/doc-review-seam.test.js:85` 的「both directions」与 `CHANGELOG.md:37`、`design.md:104` 的「两种都会红 / 多一个少一个都红」与实测不符；缺的那个方向是「`SKILL_DIRS` 登记了但目录已消失」。修法：断言里把 `SKILL_DIRS` 自身也拉进来比（导出它，或像 `skill-contract.test.js` 那样读源码取数组），或把三处文案改成「只保证磁盘目录都已登记」。
3. **R3**：AC7 的「全绿 ≥ 355」在本机不可复现（`node --test` = 235 / 225 / 10），根因是 `node_modules` 破损、与本次改动无关。修复动作在环境侧：修好依赖后跑一次全量，把 `# tests` / `# pass` 贴进 review 或 check 产物，AC7 才能勾。

非 blocking：R4（P3 口径不一致）、R5（P3 流程记录，需 owner 确认 design / spec-delta 的批准状态）、DR1（P1，随 R1 一起修）、DR2（P3 措辞）。

- 历轮状态（编号稳定，保留 open / fixed / wontfix；同一问题连续 3 轮 blocking 或总轮次超过 3 轮 → 转人工）：
  - 第 1 轮：R1–R5 / DR1–DR2 全部 `open`（其中 R1 / R2 / R3 为 blocking）。
  - 第 2 轮：R1 `fixed`、R2 `fixed`、R3 `fixed`、R4 `fixed`、R5 `fixed`、DR1 `fixed`、DR2 `fixed`；**0 条 blocking**；新增 N1（P3，不阻塞，见第 2 轮节）。

## 第 2 轮（增量复查）

第二轮是**增量复查**，不是重扫：只判定第一轮 7 条发现（R1–R5 / DR1–DR2）的处置是否真的到位，并扫这 9 个文件的增量有没有引入新问题。第一轮正文（含其 3 条 blocking 的原始证据）原样保留在上面，本节不重复其内容。

### 快照口径

- 复查对象：`aa7e485` + 工作区未提交改动，**无额外快照**；HEAD 未变。
- 与第一轮的差异：`git status --porcelain` 现为 **14 M + 4 ??**（第一轮为 13 M + 4 ??），多出来的是 `.trellis/journal/2026-11.md`（+30 行，实现方按大审技能「journal 记一笔」补的留痕，其中自述了 R3 的 `node_modules` 破损根因与修复）。该文件不在派单的 9 个文件内，只读未判。
- 本轮实际读过的增量：`skills/_templates/doc-review.md`、`skills/_templates/work-types.md`、`skills/dsh-trellis-sun-doc-review/SKILL.md`、`lib/skills.js`、`test/skill-contract.test.js`、`test/doc-review-seam.test.js`、`CHANGELOG.md`、`prd.md`、`design.md`、`spec-delta.md`；另只读核对了 `lib/index.js` / `README.md` / `README_EN.md` 的计数。
- 全量基线（本轮实测，见下文 V0）：**`# tests 356 / # pass 356 / # fail 0`**。第一轮同一命令为 `235 / 225 / 10`。

### 逐条判定

| 编号 | 第 1 轮级别 | 判定 | 证据（文件:行号 + 引用原文 + 命令输出） |
|------|------------|------|------------------------------------------|
| **R1** | P1 blocking | **fixed**（有残留 N1，P3） | `skills/_templates/doc-review.md:62` 表头现为 `\| id \| 维度 \| 查什么 \| 怎么查 \| 默认级别 \|`（第一轮此处只有 4 列）；`:64-70` 七行逐行带级别（D1/D2/D5=P1，D3/D4=P2，D6/D7=P3）；`:72` 新增「「默认级别」是起点不是结论：最终级别按影响面判定，**P1 必须先过自证伪**」。`test/skill-contract.test.js:228-233` 新增断言：`const dimensionHeader = …find((line) => line.includes('维度') && line.includes('怎么查'))` + `assert.match(dimensionHeader, /级别/, 'every dimension row must state a severity')`，S 表侧同构。`prd.md:33` AC1 判定同步为「**并断言两张维度表都带「级别」列**（判定不得窄于判据——第一轮曾因判定只查编号而放过了 D 表缺级别列）」。变异实测见 V1：删掉表头级别列 → `not ok 13` / `# fail 1`，报 `error: 'every dimension row must state a severity'`。 |
| **R2** | P1 blocking | **fixed** | `lib/skills.js:115` 现为 `export const SKILL_DIRS = [`，其上 `:107-114` 注释写明为何必须导出：「Exported because activation is presence-based: a directory that exists but is missing here is never provisioned, and an entry whose directory is gone is skipped silently (`ensureProjectSkills` continues). Only a test that compares this list against the packaged directories can catch either direction.」`test/doc-review-seam.test.js:98-102` 改为 `assert.deepEqual([...SKILL_DIRS].sort(), packagedSkillDirs(), '…(no unlisted dir, no stale entry)')`，`:103` 保留无重复断言，`:105-111` 保留「fresh project 全部 copied」；文件头 `:16-22` 写明旧写法为何只绿一个方向（「`copied` is by construction `SKILL_DIRS ∩ disk` … Removing a skill directory from `skills/` left the test green (round-2 review, R2)」）。两个方向都实测变红，见 V2 / V3。 |
| **R3** | P1 blocking | **fixed** | `node --test`（cwd = 仓库根）→ `# tests 356 / # pass 356 / # fail 0 / # cancelled 0 / # skipped 0 / # todo 0`，退出码 0（V0，且在全部变异还原后复跑一次仍是 356/356/0）。356 与 `CHANGELOG.md:36`「349 → **356** 全过」、`prd.md:44` AC7「≥ 355（基线 349 + 新增 ≥ 6）」相符；349 基线另有旁证：`CHANGELOG.md:89` v1.1.3 条目写「344 → **349** 全过」。新增用例数 7 也可核：静态 `^test(` 计数 HEAD=307 → 工作区=314（delta=7，即 `test/skill-contract.test.js` +5、新增 `test/doc-review-seam.test.js` +2）。根因与修复记录在 `.trellis/journal/2026-11.md`（worktree + junction 穿透删除 `node_modules`，`pnpm install --frozen-lockfile` 从 store 还原）。 |
| **R4** | P3 | **fixed** | `skills/_templates/work-types.md:165` 现为 `\| 文档小审 \| 主会话 inline（被审文档 ≥ 3 份或合计 ≥ 800 行时派子代理） \| S1–S4 → 阶段产物的一节 \|`，与 `:93`「主会话 inline；被审文档 ≥ 3 份或合计 ≥ 800 行时派独立子代理」同口径。`Select-String -Path skills\_templates\work-types.md -Pattern '800 行'` → 命中 2 行（`93:` 与 `165:`），第一轮只命中 1 行（93）。 |
| **R5** | P3 | **fixed**（记录补齐；owner 口头批准本身无法从仓库验证） | `design.md:3` `status: approved   # draft \| approved（owner 2026-11-27 会话内「开工」即批准：当时待批的是本文件的三个拍板项与推荐值）`；`design.md:118-119` 两个人审检查点均为 `[x]`，第 119 条写「设计已获用户确认（owner 2026-11-27 会话内「开工」；本文件随之改为 `status: approved`，属记录补齐而非事后追认）」；`spec-delta.md:3` `status: approved   # draft \| approved（与 design.md 同一批准，owner 2026-11-27「开工」）`。第一轮两处均为 `draft`。 |
| **DR1** | P1（随 R1） | **fixed** | `prd.md:32-33`：判据仍为「每个维度写明「查什么 / 怎么查 / 命中级别」」，判定改为「`test/skill-contract.test.js` 对 11 个编号逐个断言，**并断言两张维度表都带「级别」列**（判定不得窄于判据——第一轮曾因判定只查编号而放过了 D 表缺级别列）」。该判定与实际断言一致（`test/skill-contract.test.js:228-233`）。残余的粒度差见 N1。 |
| **DR2** | P3 | **fixed** | `design.md:37` 现为：\| 测试 \| `test/skill-contract.test.js`（追加用例）、`test/doc-review-seam.test.js` **新增** \| 编号齐、不采用项、落点、播种 \|——已把「已跟踪 + 追加」与「真正新增」分开，与 `git status --porcelain` 的 ` M test/skill-contract.test.js` / `?? test/doc-review-seam.test.js` 相符。 |

### 反向验证（变异实测，非读代码）

**V0 全量基线（变异前）**

```text
$ cd C:\Code\projects\dsh-trellis-sun; node --test
# tests 356
# pass 356
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 5959.2708
[exit code: 0]
```

**备份（仓库外，变异前先做）**

```text
$bk = "$env:TEMP\r2rev-20261127160330"
Copy-Item skills\_templates\doc-review.md            $bk\doc-review.md
Copy-Item -Recurse skills\dsh-trellis-sun-meta       $bk\dsh-trellis-sun-meta
BACKUP=C:\Users\sun\AppData\Local\Temp\r2rev-20261127160330
6F5872A54AB7915C7284E6BA61CA1229BD8E0DEA9703ADDB7BDAAA051288AB25  repo\skills\_templates\doc-review.md
621EAFDDEFBD4D9FE831D4A8BFB4707BC9A1F90721D78F7A2F084F7C0D5EBBED  repo\skills\dsh-trellis-sun-meta\SKILL.md
6F5872A54AB7915C7284E6BA61CA1229BD8E0DEA9703ADDB7BDAAA051288AB25  backup\doc-review.md
621EAFDDEFBD4D9FE831D4A8BFB4707BC9A1F90721D78F7A2F084F7C0D5EBBED  backup\dsh-trellis-sun-meta\SKILL.md
（备份与仓库逐位相同）
```

**V1 反向验证 A（R1）：把 D 表表头的级别列删掉 → 必须变红**

变异：`doc-review.md:62` `| id | 维度 | 查什么 | 怎么查 | 默认级别 |` → `| id | 维度 | 查什么 | 怎么查 |`（分隔行同步 5→4 段）。

```text
$ node --test test/skill-contract.test.js
ok 12 - the artifact whitelist separates current outputs from retired compatibility names
not ok 13 - the doc review protocol defines both tiers and the shared evidence rule
  error: 'every dimension row must state a severity'
ok 14 - the light doc review lands in existing artifacts instead of a new one
ok 15 - the heavy doc review is a standalone skill that touches neither the docs nor a gate
ok 16 - the protocol records its sources and the approaches deliberately not adopted
ok 17 - work-types wires both tiers into the review cadence
# tests 17
# pass 16
# fail 1
[exit code: 1]
```

**如期变红。** 还原（从备份副本，未用 `git checkout --` / `git restore`）：

```text
$ Copy-Item $bk\doc-review.md skills\_templates\doc-review.md -Force
$ Get-FileHash skills\_templates\doc-review.md, $bk\doc-review.md
6F5872A54AB7915C7284E6BA61CA1229BD8E0DEA9703ADDB7BDAAA051288AB25  repo
6F5872A54AB7915C7284E6BA61CA1229BD8E0DEA9703ADDB7BDAAA051288AB25  backup
$ node --test test/skill-contract.test.js
# tests 17
# pass 17
# fail 0
```

**V2 反向验证 B（R2）：把 `skills/dsh-trellis-sun-meta` 整目录移出仓库 → seam 2 必须变红**

```text
$ Move-Item skills\dsh-trellis-sun-meta "$env:TEMP\r2rev-20261127160330\moved-away-meta"
disk skill dirs now: 15
SKILL_DIRS entries: 16
$ node --test test/doc-review-seam.test.js
ok 1 - seam 1 — provisioning ships the big-review skill next to the checklist it cites
not ok 2 - seam 2 — SKILL_DIRS matches the packaged skill directories in both directions
    lib/skills.js SKILL_DIRS must list exactly the packaged skill directories (no unlisted dir, no stale entry)
# tests 2
# pass 1
# fail 1
[exit code: 1]
```

**如期变红** —— 正是第一轮报的那个「永远绿」的方向（登记了但目录已删），现在红了。

**V3 反向验证 B 的反方向（补证 CHANGELOG「两种都会红」）**

```text
$ New-Item -ItemType Directory skills\dsh-trellis-sun-temp-mutation; Set-Content …\SKILL.md '# temp'
$ node --test test/doc-review-seam.test.js
ok 1 - seam 1 — …
not ok 2 - seam 2 — SKILL_DIRS matches the packaged skill directories in both directions
# tests 2
# pass 1
# fail 1
$ Remove-Item -Recurse -Force skills\dsh-trellis-sun-temp-mutation
dirs after cleanup: 16
$ node --test test/doc-review-seam.test.js
# tests 2 / # pass 2 / # fail 0
```

两个方向都红 ⇒ `CHANGELOG.md:37`「新增了目录却忘了登记…或登记了目录却已不存在…两种都会红」与 `design.md:104`「多一个少一个都红」**现在与实测相符**。

**V4 还原证明（目录级，逐文件哈希）**

```text
$ Copy-Item -Recurse $bk\dsh-trellis-sun-meta skills\dsh-trellis-sun-meta
621EAFDDEFBD4D9FE831D4A8BFB4707BC9A1F90721D78F7A2F084F7C0D5EBBED  repo\SKILL.md
621EAFDDEFBD4D9FE831D4A8BFB4707BC9A1F90721D78F7A2F084F7C0D5EBBED  backup\SKILL.md
Compare-Object（repo 哈希集 vs backup 哈希集）→ IDENTICAL (0 differences)
disk skill dirs now: 16
$ node --test          # 全部还原后复跑
# tests 356
# pass 356
# fail 0
$ git status --porcelain   # 与本节「快照口径」完全一致（14 M + 4 ??，无多余条目）
```

本轮**未使用** `git checkout --` / `git restore`；两处变异（`doc-review.md`、`dsh-trellis-sun-meta/`）都从仓库外备份副本还原，还原后哈希与备份逐位相同。

### 新问题

| 编号 | 级别 | 问题 | 文件:行号 | 引用原文 | 依据 | 处理 |
|------|------|------|-----------|----------|------|------|
| **N1** | P3 | R1 新增的级别断言**只检查表头行**，不检查每个维度行；某行级别单元格被清空时仍然绿。断言消息写的是「every dimension row must state a severity」，与实际检查范围（表头是否含「级别」二字）不符。AC1 的判据是「每个维度写明…命中级别」，因此「行有列但值为空」这一形态仍可假通过——与 DR1 是同一类缺陷，只是粒度从「整列缺失」缩到「单元格为空」 | `test/skill-contract.test.js:230`、`:233` | `assert.match(dimensionHeader, /级别/, 'every dimension row must state a severity')` | 变异：把 `doc-review.md:66` D3 行的 `P2` 清空（表头不动）→ `node --test test/skill-contract.test.js` 得 `ok 13 - …`、`# tests 17 / # pass 17 / # fail 0`（**绿**）。对照 V1（删表头列）才红。还原后哈希仍为 `6F5872A5…AB25` | open（P3，不阻塞；建议补一条逐行断言：D 表 7 行每行末列匹配 `P[123]`，S 表 4 行同） |

- 另需说明（不构成发现）：`CHANGELOG.md` v1.2.0 条目的字数较第一轮增长（`node scripts/extract-changelog.mjs v1.2.0` 由 6155 → **6372** 字符），是随 R1 补入「每维带**默认级别**」措辞所致，与 `doc-review.md:62` 的实际列一致；`v1.2.0` 的「349 → 356」「7 个用例（5 契约 + 2 seam）」经 V0 与静态计数核对**均属实**。
- 「16 个技能」四处仍与磁盘一致：`lib/skills.js:4`「The 16 `dsh-trellis-sun-*` skills」、`lib/index.js:13`「provisions the 16 `dsh-trellis-sun-*` skills」、`README.md:324`「16 个内置工作流技能」、`README_EN.md:328`「16 bundled workflow skills」；磁盘 `(Get-ChildItem skills -Directory \| ? Name -like 'dsh-trellis-sun-*').Count` = 16，`SKILL_DIRS` 条目 = 16，`lib/skills.js:201` 的 `if (!fs.existsSync(srcDir)) continue` 仍在（seam 2 的注释描述与代码相符）。`SKILL_DIRS` 导出后无其他调用点变化（`:199` 内部使用，`test/doc-review-seam.test.js:31` 新引入），无命名冲突。

### 结论（第 2 轮）

- [x] 通过（含 `dsh-trellis-sun-check` 与任务要求的验证）
- [ ] 需修复后重审

**status: passed**。7 条处置逐条为 `fixed`，无 `wontfix`、无 `只改了说法`：

1. **R1 / DR1**：D 表已有「默认级别」列且七行都填了值，AC1 判定与断言同步；删表头级别列实测变红（V1）。
2. **R2**：`SKILL_DIRS` 已导出，seam 2 直接比两张清单；「登记了但目录已删」与「有目录没登记」两个方向都实测变红（V2 / V3），还原后哈希一致（V4）。
3. **R3**：`node --test` = **356 / 356 / 0**，与 CHANGELOG「349 → 356」、AC7「≥ 355」相符；349 基线有 v1.1.3 条目「344 → 349」旁证。
4. **R4 / R5 / DR2**：口径与状态记录均已对齐（`work-types.md:165` 补「或合计 ≥ 800 行」；`design.md:3` / `spec-delta.md:3` 改 `approved` 且检查点已勾；`design.md:37` 区分「追加用例」与「新增」）。

唯一遗留是 **N1（P3）**：级别断言只看表头、不看行，属测试守卫的粒度不足，当前产物本身没有缺值，**不阻塞**。

## 实现方补记（N1，2026-11-27）

第二轮判定 `status: passed` 之后，实现方处置了唯一的 P3 残留 **N1**（级别断言只查表头、不查每个维度行的单元格，属与 R1 同类的「断言窄于判据」）。本节只是修复留痕，**不改动 reviewer 的任何判定与 status**。

- 修复：`test/skill-contract.test.js` 的「protocol defines both tiers」用例改为**逐行**读表——D 表必须正好 7 行、S 表正好 4 行，且每行末列必须以 `P1`/`P2`/`P3` 开头；表头列断言保留。
- 反向验证（按第二轮同法：仓库外备份 + 变异 + 哈希还原，未用 `git checkout --` / `git restore`）：

```text
backup hash = 6F5872A54AB7915C7284E6BA61CA1229BD8E0DEA9703ADDB7BDAAA051288AB25
变异：skills/_templates/doc-review.md 的 D3 行级别单元格 "P2" 清空（表头不动）
$ node --test test/skill-contract.test.js
not ok 13 - the doc review protocol defines both tiers and the shared evidence rule
  error: 'every D row must state its level (P1/P2/P3): | **D3** 跨文档一致性 | 同一事实在多份文档里的表述一致；跨文档引用能'
# tests 17 / # pass 16 / # fail 1
还原（Copy-Item 备份）：
restored hash = 6F5872A54AB7915C7284E6BA61CA1229BD8E0DEA9703ADDB7BDAAA051288AB25  identical=True
$ node --test
# tests 356 / # pass 356 / # fail 0
```

- 结论：N1 关闭（P3，非阻塞），用例总数不变（断言内加严），全量仍 356。
