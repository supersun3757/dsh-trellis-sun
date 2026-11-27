# dsh-trellis-sun

<div align="center">
  <b style="font-size: 1.3em;">Trellis 工作流扩展 · DeepSeek Harness</b><br />
  <sub>结构化阶段流转 · 步骤状态机 · 质量验收门禁 · spec 增量合并 · 证据型 review · 可选规划期只读保护</sub><br /><br />
  <a href="https://opensource.org/licenses/MIT"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" /></a>
  <img alt="Node Version" src="https://img.shields.io/badge/Node.js-≥20-green.svg" />
  <img alt="Step State Machine" src="https://img.shields.io/badge/Steps-5--State%20Machine-blue.svg" />
  <img alt="Verification Gate" src="https://img.shields.io/badge/Gate-Verified%20Check-success.svg" />
  <img alt="Spec Delta" src="https://img.shields.io/badge/Spec--Delta%20Merged-purple.svg" />
  <img alt="Evidence Review" src="https://img.shields.io/badge/Review-Evidence--Based-orange.svg" />
</div>

<div align="center">
  🌏 <a href="./README.md"><b>中文</b></a> · <a href="./README_EN.md">English</a>
</div>

---

> **sun-Trellis 分支** — 本仓库 fork 自上游 `@banana-peeljj12/dsh-trellis` v0.5.1，主线跟随 DSH 0.2.2-rc.5 / Cordis 4.1.0。包名改为 `dsh-trellis-sun`，内置技能统一为 `dsh-trellis-sun-*`，内置工具统一为 `dsh_trellis_sun_*`，可与项目中已有的 Trellis 技能并存而不互相覆盖。与上游的差异清单见 [FORK.md](./FORK.md)。

## 项目简介

`dsh-trellis-sun` 是为 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) 开发的工程化工作流插件，借鉴了 [Trellis](https://github.com/mindfold-ai/trellis) 的阶段规范与状态机设计思想。

在大模型长程编程任务中，常见以下协作问题：
1. **未理清方案便直接修改代码**：容易引入方向性错误或破坏现有架构；
2. **任务待办散落各处**：需求文档、草稿文件与上下文记录多处待办，状态脱节；
3. **缺乏验收约束**：代码编写完成后直接标记完成，缺少自测验证或人工审核卡点。

`dsh-trellis-sun` 通过统一的步骤状态机、任务阶段流转和运行时工具过滤，帮助大模型在复杂任务中遵循“先方案后编码、验证后再完结”的工程规范。

---

## 核心特性

- **结构化阶段流转**：提供特性开发（feat）、缺陷修复（issue）与代码重构（refactor）三条标准阶段轨道，引导模型逐步推进。
- **统一执行清单**：以任务根目录下的 `task.json.steps` 作为唯一的执行状态依据，避免分散维护清单带来的状态不一致。
- **质量验收门禁**：细化步骤流转状态（`pending`、`in_progress`、`verifying`、`blocked`、`completed`），支持区分自动化测试（AI 验证）与人工审批卡点，并在任务完结时严格检查验收状态。
- **可选规划期只读保护**：开启配置项后，可在方案获批前于运行时过滤掉代码写工具（`write` / `edit`），仅开放文档受控修改通道，确保方案敲定后再动代码。
- **会话级状态隔离**：各会话的任务绑定关系独立存储在 `.trellis/.runtime/sessions/` 中，多会话与并发子代理并行工作时互不串扰。
- **双模态任务看板（视觉语言 v2）**：常态为极简紧凑弹窗（当前绑定任务置顶为焦点卡片，内置高亮步骤清单与折叠态；下方按状态分组列出任务流），可一键展开为全屏大看板（按「进行中 / 规划中 / 已完成」分组表格，支持 `⌘K` 实时搜索与工作流类型筛选）；右侧详情面板内置 **Step Tracker 步骤流水线**、阶段轨道节点与产物文件列表。看板遵循**单强调色设计**与**克制交互**——不直接改任务状态，仅提供「▶ 推进任务」将指令安全填入输入框交由 Agent 执行，产物点击生成 `@.trellis/tasks/...` 原生文件引用交给 DSH 原生查看。
- **Git 干净度校验（支持局部校验）**：任务完成和归档时自动检查 Git 工作区状态，防止遗留未提交的脏代码。若工作区存在与任务无关的未提交改动，可在 `dsh_trellis_sun_task_update` / `dsh_trellis_sun_task_archive` 中通过 `modified_files` 声明任务实际改动文件，校验将限缩到清单内文件（须已提交），清单外未提交改动仅告警、不再阻塞；未传该参数时保持全局严格校验。
- **spec 增量提案（spec-delta）**：feat 轨道的 `design` 阶段与 `design.md` 同时产出 `spec-delta.md`——按 ADDED / MODIFIED / REMOVED 写清「本次改动对常驻 spec 的增量」，**两者都批准后才进 impl**；归档时由 `dsh-trellis-sun-finish-work` 逐条机械合并进常驻 spec，旧文本必须与目标文件逐字一致、章节锚点必须存在且不重复，任何一条对不上就**停下询问**，禁止静默合并。它与「实施后复盘教训」（`update-spec`）是两件不同的事。
- **可核对的 check 与证据型 review**：check 的改动集由 `git diff` 确定性算出（不许凭记忆）、按路径查表取规则、逐文件覆盖清单漏一个不收工、工具失败一律按错误上报；review 固定在 Git 快照上，要求 file:line + 原文引用 + 实际输出三件套，证据不足降级为「疑似」，多轮不收敛转人工。节奏分两级——随任务的小 review 管深，版本冻结时的打板大 review 管广（调用外部 OCR 工具，机制抄进技能而工具不进插件）。
- **文档审查也分两级**：小审 S1–S4（引用能落地 / 无占位与空洞 / 验收可测 / 文内自洽）随任务跑，结论写进 `review.md` 的「文档审查」节，不新建产物文件，S1–S3 命中未处理不得判 review passed；大审 D1–D7 在版本冻结时由 `dsh-trellis-sun-doc-review` 跑，出覆盖图 + 七维发现 + 需外部核对清单，报告落 `.trellis/reviews/`、以 `draft` 开工待人复核，不卡任何门禁。维度与证据规则只在 `skills/_templates/doc-review.md` 一处定义。
- **图查询作外部依赖**：可选接入 `codebase-memory-mcp`（用 DSH 内置 MCP 客户端原生挂载），design 查分层与波及面、impl 前查模块图、check 枚举受影响包；共享协议写在 `skills/_templates/graph-queries.md`（索引纪律、有界重试、stale-daemon 与 Windows DACL 陷阱、降级口径）。未安装、无索引或查询失败时按降级口径退回文本检索；Qt 工程的解析精度尚未实测，不做承诺。
- **产物白名单分层**：交付文档写入通道只认当前流程产出的 10 个产物，另保留 4 个历史名（`implement.md` / `checklist.yaml` / `check.md` / `design-review.md`）供存量任务更新——工具描述把两者分开标注，新任务不会照着白名单写一个必然被播种剪除的文件。

---

## 快速上手

### 1. 安装插件

确保环境 Node.js ≥ 20。本分支通过 git 分发、**不发布到 npm**，因此用本地/克隆目录安装：

```sh
git clone https://github.com/supersun3757/dsh-trellis-sun
dsh plugin --profile web add link:<克隆目录绝对路径>
```

安装完成后**重启 DSH 服务**。

> **桌面版（DeepSeek Harness App）请用自带的 carrier CLI。** 普通 `dsh` CLI 会以
> `error: profile "desktop" is managed exclusively by the Electron application` 拒绝操作
> `desktop` profile（该名字被硬编码保护）。请改用桌面版自带的 CLI：
>
> ```sh
> & "F:\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add link:F:\dsh-plugins\dsh-trellis-sun
> ```
>
> 装的若是本地开发目录，用 `link:<仓库绝对路径>`；装完成后**完整退出并重启桌面版**
> （含托盘图标，确认任务管理器中不再有 `DeepSeek Harness.exe`）才会生效。

> **升级或改动了技能之后：项目里的技能副本不会自动跟着变。** 播种按项目内的
> `.agents/skills/.trellis-version` 标记判定——版本号没变就整体跳过（否则每次启动都会覆写一遍）。
> 所以换了包、或改了 `skills/**`，请二选一：
>
> ```sh
> # A) 对指定项目强制重播（覆写同名技能与模板，并清理废弃模板）
> node scripts/install.mjs --reseed --project <项目根目录>
> # 想先看会改什么：追加 --dry-run
> ```
>
> B) 抬 `package.json` 的 version 后重启宿主——已播过的项目会进入覆写分支。
> `--reseed` 不能与 `--uninstall` / `--fix-deps` / `--patch-harness` / `--auto` 同时使用。

> **版本兼容性**：插件声明的 `@deepseek-ai/dsh-*` peer 范围必须覆盖当前 DSH 运行时版本。
> DSH 会在安装前置检查（pnpm 运行之前）与 profile 启动时校验该范围，不匹配会直接
> `installation rejected` 并拒绝加载——这不是代码问题，而是声明问题：
> 例如上游曾把 `^0.1.7-rc.1`（= `>=0.1.7-rc.1 <0.2.0-0`）留在 `0.2.0-rc.2` 运行时上，
> 结果直接 `installation rejected`。升级 DSH 后若插件突然失效，请先核对 peer 范围。
> 本仓库面向 **DSH 0.2.2-rc.5 / Cordis 4.1.0**（Cordis 4.1.0 的 `waterfall` 尾参语义变更已在本分支修掉），
> 与上游的差异见 [FORK.md](./FORK.md)，上游 0.2.0-rc.2 的审计证据见
> [`docs/ref/dsh-0.2.0-rc.2-audit.md`](docs/ref/dsh-0.2.0-rc.2-audit.md)。

### 2. 配置白名单目录（重要）

为避免非预期介入，插件默认不会拦截未授权的目录。请在 Web 端或配置文件中添加生效路径：

1. 打开 DSH Web 客户端，点击左侧边栏的 **「插件」** 图标，在 **「已安装」** 分区点击 **dsh-trellis-sun** 进入详情页（配置表单直接位于详情页最外层，无需再展开「包含的组件」）；
2. 在 **白名单项目 (allowlist)** 中添加需要启用该工作流的项目根目录绝对路径——既可手动输入，
   也可点击 **浏览…** 按钮弹出系统文件夹选择器直接选取，保存后即时生效。

> **提示**：若希望在方案定稿前限制模型修改源码，可在该详情页同时开启 **规划期只读保护 (enforceReadonlyPlanning)** 开关。

### 3. 开始使用

在对话中提出较复杂的需求时，模型会引导创建或推进工作流任务：

- **新增功能**：创建 `feat-mm-dd-name`，推进 `prd` → `design` → `impl` → `review` → `check`；
- **修复问题**：创建 `issue-mm-dd-name`，推进 `report` → `analyze` → `fix` → `fix-note`；
- **重构优化**：创建 `refactor-mm-dd-name`，推进 `scan` → `design` → `apply` → `done`。

如需在某轮对话中临时跳过工作流拦截，在消息中包含 `no-trellis` 即可。

---

## 工作流与轨道规范

插件内置了三类标准工作流轨道，任务状态与当前所处阶段（`work.stage`）紧密挂钩：

| 工作流类型 | 命名规范 | 阶段推进顺序 | 说明 |
|---|---|---|---|
| **功能特性 (`feat`)** | `feat-MM-DD-name` | `prd` → `design` → `impl` → `review` → `check` | 适合从 0 到 1 开发新特性或重大功能调整 |
| **缺陷修复 (`issue`)** | `issue-MM-DD-name` | `report` → `analyze` → `fix` → `fix-note` | 适合排查和定位 bug、回归问题及异常情况 |
| **代码重构 (`refactor`)** | `refactor-MM-DD-name` | `scan` → `design` → `apply` → `done` | 保持对外行为不变的前提下进行架构或代码优化 |

> **spec 增量**：feat 轨道的 `design` 阶段同时产出 `design.md` 与 `spec-delta.md`，两者均 `approved` 才允许进入 `impl`；归档时先由 `dsh-trellis-sun-finish-work` 把增量逐条合并进常驻 spec，再做提交与归档。不涉及常驻 spec 的 quick 改动，写「无增量：<原因>」即可。

---

## 核心机制详解

### 1. 步骤状态机与验收门禁

任务的 `steps` 数组为执行清单，支持 5 种状态：

- `pending`：步骤待开始；
- `in_progress`：当前正在实施该步骤；
- `verifying`：代码实施完毕，等待验证；
- `blocked`：遇到外部阻塞，必须附带 `blockedReason`；
- `completed`：验证通过后完结。

#### 验证模式说明：
- **自动化验证 (`verification: 'ai'`)**：模型编写代码后，必须先运行测试并调用 `dsh_trellis_sun_task_update` 填入 `verified: true` 与 `verificationNotes` 测试记录，随后才允许将状态更新为 `completed`，防止单次调用跳过测试。
- **人工验收卡点 (`verification: 'human'`)**：用于涉及核心契约或高风险操作的步骤。只有在用户明确同意且记录 `verifiedBy: 'human'` 后，该步骤才被允许标记为 `completed`。
- **任务完结审计**：当任务标记为完成或发起归档时，系统会校验所有步骤是否均已完成并通过验证，同时校验 Git 工作区是否干净。
- **门禁只认已持久化的状态**：完结校验读的是**已写入磁盘**的 `verification` 与 `verified`——同一次调用里既降级 `verification` 又置 `completed`、或把 `verified` 在同一调用内写成 `true`，都会被拒绝（必须分两次调用）；`steps` 整体替换时按持久化列表校验，`{status: 'completed', steps: []}` 这类洗白不成立。

### 2. 双模态任务看板（紧凑浮层与全屏工作台）

在 DSH Web 客户端中，顶部阶段徽章支持交互式展开任务看板，具备以下双模态形态：

#### 紧凑浮层视图（常态）与全屏任务看板
常态下点击徽标展开紧凑弹窗：顶部将当前绑定任务展示为焦点卡片，内置 **Step Tracker 步骤清单**（加粗当前实施步骤、展示验收标准，并支持已完成步骤折叠），下方按生命周期状态清晰分组；点击右上角放大按钮可平滑展开为全屏大看板，支持 `⌘K` 实时搜索与右侧完整详情抽屉：

<p align="center">
  <img src="./docs/images/web-kanban-list.png" width="38%" alt="紧凑任务浮层与步骤清单卡片" />
  &nbsp;
  <img src="./docs/images/web-kanban-lanes.png" width="59%" alt="全屏任务看板与详情面板" />
</p>

#### 工作流分类过滤与多状态概览
大看板顶栏支持按「功能 / 缺陷 / 重构」分类药丸即时过滤。当选择特定工作流（如代码重构）时，视图聚焦当前分类任务，配合右侧详情抽屉呈现阶段流水线节点、完整步骤状态机与交付物文档：

<p align="center">
  <img src="./docs/images/web-kanban-refactor.png" width="85%" alt="重构工作流过滤与任务详情面板" />
</p>

- **单强调色设计**：类型采用清晰无彩文字，统一使用品牌蓝标识当前会话与进行中状态，红/黄色警告仅用于外部阻塞与待验证门禁，视觉层级干净克制。
- **克制交互原则**：看板保持纯粹的监控与导航定位，不直接在界面端篡改任务底层状态；仅通过右侧「▶ 推进任务」将规范提示词安全填入输入框，交由 Agent 按工作流状态机推进。
- **原生文件联动**：产物列表中点击「打开」会自动生成 `@.trellis/tasks/...` 原生文件引用，无缝调起 DSH 侧边栏文件预览。

### 3. 规划期只读保护（可选增强）

当在配置中启用 `enforceReadonlyPlanning: true` 时，插件会根据当前任务状态**仅裁剪指定的工具**（denylist，其余工具——包括其他插件注册的工具——原样保留）：

| 授权状态 | 触发条件 | 被裁剪的工具 | 说明 |
|---|---|---|---|
| `undecided` | 项目在白名单内、无活跃任务且未声明跳过 | `write` / `edit` + `dsh_trellis_sun_task_update` / `dsh_trellis_sun_artifact_update` / `dsh_trellis_sun_task_archive` / `dsh_trellis_sun_ui_update` | 移除代码写工具与任务写工具，避免盲目直接改写源码；`dsh_trellis_sun_task_create` / `dsh_trellis_sun_task_skip` 与所有其他工具（含其他插件工具）保留 |
| `planning` | 任务处于规划类阶段（`prd`, `design`, `scan`, `report` 等） | `write` / `edit` + `dsh_trellis_sun_task_create` / `dsh_trellis_sun_task_skip` / `dsh_trellis_sun_task_archive` / `dsh_trellis_sun_ui_update` | 移除通用 `write` / `edit` 工具与任务生命周期工具，仅放行受控的任务产物更新；`dsh_trellis_sun_task_update` / `dsh_trellis_sun_artifact_update` 与所有其他工具保留 |
| `authorized` | 任务进入实施阶段（`impl`, `fix`, `apply`）或用户已跳过 | 无（不裁剪） | 允许根据设计方案修改项目源码 |

> 注：`dsh_trellis_sun_artifact_update` 仅允许写入当前任务目录（`.trellis/tasks/<slug>/`）内的白名单文档，杜绝跨目录修改。

---

### 4. 交付文档与产物白名单

任务目录下的交付文档只能经 `dsh_trellis_sun_artifact_update` 写入，且受两层约束：文件名必须在白名单内，路径必须是当前任务目录的直接子文件（slug 字符集全仓唯一定义，`.`、`..` 与含分隔符的 slug 一律拒绝）。

白名单分两档：

| 档位 | 内容 | 用途 |
|---|---|---|
| 当前流程产物（10 个） | `prd.md`、`design.md`、`spec-delta.md`、`review.md`、`report.md`、`analysis.md`、`fix-note.md`、`scan.md`、`refactor-design.md`、`apply-notes.md` | 每个都有随包模板与所属阶段，工具描述把它们列为主目标 |
| 历史兼容名（4 个） | `implement.md`、`checklist.yaml`、`check.md`、`design-review.md` | 当前流程不再产出、模板也已剪除，但存量任务里确实存在，保留可写以免老任务变成只读 |

契约测试双向钉住：当前档每个名字必须随包带模板，历史档每个名字必须没有模板且仍在放行清单里。

### 5. spec-delta：改动的 spec 增量

`spec-delta.md` 与 `design.md` 同批产出、同批批准，内容分三类：

- **ADDED**：新增章节或条目，写清目标文件与插入锚点；
- **MODIFIED**：改哪一段、旧文本原文（须与目标文件逐字一致）、新文本原文；
- **REMOVED**：删哪一段、被删文本原文（同样须逐字一致）。

无增量时写「无增量：<原因>」，不留空、不删除文件。归档时 `dsh-trellis-sun-finish-work` 逐条机械合并，**不顺手改写、不「优化」措辞**；任一条对不上（目标文件在批准后被改过、锚点不存在或重复）就停下询问，把冲突点摊给用户，绝不静默合并。合并结果记入 delta 末尾的「合并记录」，并在研发日志里留一笔。

与 `update-spec` 的区别：delta 是**事前**提案 + 归档时机械合并（改动本身的 spec 增量）；`update-spec` 是**事后**复盘（实施中真正学到的教训）。

### 6. review 与 check：可核对的验证

**check**（`dsh-trellis-sun-check`）四步：① 定范围——改动集由 `git diff --name-only` 确定性算出，禁止凭记忆列举；② 取规则——路径 → 规则查表，查不到标「无适用规范」而不许现编；③ 覆盖清单——改动集里每个文件一行结论，漏一个不许收工；④ fail-closed——工具失败（无效输出、非零退出、取消、截断）一律按错误上报，绝不报「干净」。

**review**（feat 的 review 阶段 + 独立子代理）是证据型工作流：固定在 Git 快照上、file:line + 引用原文 + 实际输出三件套、证据不足降级为「疑似」、问题用稳定编号并保留历轮状态、3 轮不收敛转人工。

**两级节奏**：随任务的小 review 管深（有 prd / design / spec-delta 上下文）；版本冻结时的打板大 review 管广（跨模块一致性与残渣，调用外部 OCR 工具跑全量——机制抄进技能，工具不进插件）。

**文档审查同构，也是两级**（维度、证据规则与不采用项只在 `skills/_templates/doc-review.md` 一处）：

- **小审 S1–S4**（随任务，feat review 阶段与 code review 同轮）：S1 引用能落地（路径 / 工具名 / 版本号逐个核对）、S2 没有占位与空洞、S3 验收可测、S4 文内自洽。结论写进 `review.md` 的「文档审查」节（issue → `fix-note.md`、refactor → `apply-notes.md`），**不新建产物文件**；S1 / S2 / S3 命中未处理，不得判 review passed。
- **大审 D1–D7**（版本冻结）：由 `dsh-trellis-sun-doc-review` 执行，范围由 `.trellis/doc.json` 的 `files` 与文件树**算出**（不许凭印象列文件），产出覆盖图 + 七维发现 + 需外部核对清单，报告落 `.trellis/reviews/<yyyy-mm-dd>-doc-review.md`，以 `status: draft` 开工、经人或 `dsh-trellis-sun-check` 复核才转 `confirmed`，**不卡任何门禁**。
- **与 check 的分工**：check 核「实现是否满足验收标准」，小审 S3 核「验收标准本身可不可测」，两者不互相替代。
- **刻意不采用**：PDF / DOCX / OCR 管线（本插件没有文档读取工具）、多厂商评审团、批注 UI、机械一致性对账（doc-guard）与口径钉扎（canon-keeper）。

### 7. 图查询（外部依赖，可选）

图服务本体（`codebase-memory-mcp`）是**外部依赖**，不进插件、不随包分发；插件只带行为层——何时查、查什么、查不到怎么办，写在共享的 `skills/_templates/graph-queries.md` 里，design / before-dev / check 三个技能各自只写本阶段要点：

- **design**：写 `design.md` 与 `spec-delta.md` 之前先查分层与波及面，把影响到的模块写进方案；
- **before-dev**：impl 前对涉及模块查一次图，把相关文件与调用边作为上下文交给实现；
- **check**：跨包一致性检查用图枚举受影响包，替代 grep 猜范围。

连接方式只用 DSH 内置 `@deepseek-ai/dsh-mcp-client` 原生挂载（stdio 直接指向二进制）。前置检查：`codebase-memory-mcp --version` 打得出版本才算装了；`cli list_projects` 能起、`index_status --project` 的 `indexed_at` 是近期的、重建索引后时间戳前移。未安装、无索引、查询失败一律按文档里的降级口径退回 `grep` / `glob` / `read`，并在产物里写明「图服务未安装 / 未验证」。Qt 工程的解析精度还没有实测，Qt 层的关键结论必须另有文本或运行时证据支撑。

---

## 扩展工具 (Tools) 说明

插件向运行时注册了以下专用工具：

- **`dsh_trellis_sun_task_create`**：创建新的工作流任务，生成初始 `task.json` 与阶段交付物模板，并自动绑定当前会话。
- **`dsh_trellis_sun_task_update`**：推进任务阶段、更新步骤进度、记录验证证据或更新任务信息，不改变当前会话绑定。显式传入 `slug` 只选择更新目标；切换任务请使用看板的激活按钮。
- **`dsh_trellis_sun_artifact_update`**：安全更新任务交付文档。当前流程产物为 `prd.md` / `design.md` / `spec-delta.md` / `review.md` / `report.md` / `analysis.md` / `fix-note.md` / `scan.md` / `refactor-design.md` / `apply-notes.md`；`implement.md` / `checklist.yaml` / `check.md` / `design-review.md` 标为历史兼容名，仅供存量任务更新。路径限定在当前任务目录内。
- **`dsh_trellis_sun_task_archive`**：将已完成的任务归档至 `.trellis/tasks/archive/YYYY-MM/` 目录下，并解除当前会话绑定。
- **`dsh_trellis_sun_task_skip`**：经用户同意后，在当前会话跳过 Trellis 工作流约束，直接放行全量工具权限。
- **`dsh_trellis_sun_state`**：诊断并返回当前项目的 Trellis 运行时状态与任务信息。
- **`dsh_trellis_sun_ui_update`**：主动刷新 Web 界面顶部的阶段徽章状态。

---

## 配置项参考

可在左侧 **「插件」** 页（进入 **dsh-trellis-sun** 详情页最外层即可见）或 `~/.dsh/settings.yaml` 中进行配置：

| 配置项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `allowlist` | `string[]` | `[]` | **生效白名单**：允许插件接入的项目根目录绝对路径列表。为空时不介入任何项目 |
| `enforceReadonlyPlanning` | `boolean` | `false` | **规划期只读保护**：开启后，方案定稿前在运行时移除代码修改工具 |
| `injectSpecIndex` | `boolean` | `true` | **注入项目文档**：项目配置 `.trellis/doc.json` 时注入 `files` 列出的文档**正文**（上限由下面的注入预算控制，超出部分截断并标注路径）；未配置时兼容扫描 `.trellis/spec/` 只注入索引 |
| `docFileBudgetKB` | `number` | `8` | **单文件注入预算（KB）**：单个文档正文最多注入多少 KB，硬顶 128KB；项目可在 `.trellis/doc.json` 的 `budgets.fileKB` 逐项目覆盖 |
| `docTotalBudgetKB` | `number` | `32` | **正文合计注入预算（KB）**：全部文档正文合计最多注入多少 KB，硬顶 512KB；项目可在 `.trellis/doc.json` 的 `budgets.totalKB` 逐项目覆盖 |
| `skipKeywords` | `string[]` | `['no-trellis']` | **跳过关键词**：用户消息包含这些词时，该轮跳过面包屑注入与拦截（系统提示词段的 `injectSpecIndex` / `enforceReadonlyPlanning` 属会话级，不受单轮关键词抑制，请用各自开关关闭） |
| `injectStep` | `number` | `1` | 面包屑提示词的注入步数，默认仅在每轮交互第 1 步注入 |
| `inline` | `boolean` | `false` | 是否开启 codex-inline 风格的阶段解析模式 |

---

## 项目文档入口配置

项目可用 `.trellis/doc.json` 显式声明 Trellis 应读取的 Markdown 文件：

```json
{
  "root": ".trellis/spec",
  "files": [
    ".trellis/spec/guides/index.md",
    ".trellis/spec/trellis-workflow/task-engine/index.md"
  ],
  "budgets": { "fileKB": 16, "totalKB": 64 }
}
```

- `files`：运行时注入白名单。每项必须是项目根相对的 Markdown 完整路径；支持多个文件，按配置顺序注入并去重。**注入的是正文**，不是路径。
- `budgets`（可选）：本项目自己的注入预算，单位 KB，只写想覆盖的那一项即可。优先级 **`doc.json` 的 `budgets` > 插件设置 `docFileBudgetKB` / `docTotalBudgetKB` > 内置默认 8KB / 32KB**；单文件硬顶 128KB、合计硬顶 512KB，超出的值会被夹紧。写 `0`、负数或非数字视为未设置，自动回退上一级。
- **注入预算**：单文件与合计各有一档上限（默认 8KB / 32KB，UTF-8 字节）。超出的部分会截断，并标注「已截断 / 超出预算，请 read <路径>」，模型可据此补读；读取失败的文件同样标注路径。提示词头会回显本次真实生效的两个上限。
- `root`：仅供 `dsh-trellis-sun-spec-bootstrap`、`dsh-trellis-sun-update-spec` 等 Skill 作为文档发现与沉淀的默认根目录，不拼接或过滤 `files`，也不改变运行时注入结果。
- 未配置 `.trellis/doc.json` 时继续扫描 `.trellis/spec/`（只注入索引，不注入正文）；显式配置后未列入 `files` 的旧 Spec 不再注入。
- 显式配置无效时不会静默回退旧 Spec，而是注入一条简短修复提示。
- 新增需长期注入的文档时，必须同步加入 `files`。已有 Docs 的项目可运行 `dsh-trellis-sun-spec-bootstrap` 的迁移分支；新项目使用其初始化分支。
- **可视化配置**：在会话顶部视图栏切到 **「项目文档」**（与「对话 / 轨迹 / Git」同级），即可查看和编辑当前项目的 `.trellis/doc.json`：增删/排序文件、在「注入预算」里直接改本项目的单文件 / 合计上限（留空 = 继承插件设置，非法值就地标红且不能保存）、查看每个文件的注入状态（完整 / 将截断至 生效上限 / 仅保留路径）与预算占用；未配置时可一键载入现有 `.trellis/spec` 索引作为初稿。保存后下一次注入立即生效，无需重启。

---

## 项目结构

```text
dsh-trellis-sun/
├── lib/
│   ├── index.js            # 插件入口：注册 pre-step 钩子、运行时工具过滤与 API 路由
│   ├── task.js             # 任务执行逻辑：步骤流转、验证门禁检查与状态校验
│   ├── skills.js           # 技能供给：向项目注入工作流技能与产物模板，含废弃模板自愈修剪
│   ├── breadcrumb.js       # 上下文提示：提取焦点步骤与构建面包屑
│   ├── readonly.js         # 只读策略：推导 undecided / planning / authorized 授权状态
│   ├── spec.js             # 规范索引：读取 .trellis/doc.json files 白名单并按预算注入正文
│   ├── state.js            # 状态解析：阶段推断、会话指针与 slug 字符集校验
│   ├── artifact.js         # 产物写入：白名单分层（当前产物 / 历史兼容名）与路径安全限制
│   ├── archive.js          # 归档处理：任务完结检查、目录归档迁移与 Git 干净度校验
│   ├── git.js              # Git 校验：工作区干净度与固定快照（只读，非仓库环境安全降级）
│   ├── board.js            # 看板数据：任务记录（含 steps 聚合）、阶段轨道与归档列表
│   ├── client.js           # 前端界面：阶段徽章、双模态看板（紧凑浮层 + 全屏工作台）与设置项
│   ├── meta.js             # 插件身份、配置 schema 与默认白名单
│   ├── resolve.js          # 项目解析：由会话 cwd 判定 .trellis/ 项目（纯路径，不碰 IO）
│   ├── settings.js         # 设置接线：Loader 条目驱动的 Config 表单读写
│   ├── trust.js            # Web 只读 API 的本地浏览器信任围栏（非鉴权层）
│   └── types/index.d.ts    # TypeScript 类型定义
├── scripts/
│   ├── install.mjs         # 安装/接线 CLI：--reseed 重播技能、--project 指定项目、--fix-deps、--patch-harness
│   └── extract-changelog.mjs  # 从 CHANGELOG 抽取某版本的双语正文
├── skills/                 # 16 个内置工作流技能 + _templates/（阶段模板、work-types、graph-queries 与 doc-review 协议）
├── docs/images/            # 界面截图与架构图素材
└── test/                   # 自动化单元测试套件（node --test）
```

---

## 开源协议与致谢

- 本项目基于 [MIT 许可证](./LICENSE) 开源；
- 致谢 [Trellis](https://github.com/mindfold-ai/trellis)（Mindfold）：阶段规范与面包屑设计的灵感来源；
- 致谢 [CodeStable](https://github.com/codestable/CodeStable)：优秀的三大工作流路由划分思路；
- 致谢 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)：灵活可靠的 Agent 运行时环境。
