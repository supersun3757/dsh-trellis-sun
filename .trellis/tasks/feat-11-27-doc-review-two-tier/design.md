# Feature Design — 文档审查两级化

status: approved   # draft | approved（owner 2026-11-27 会话内「开工」即批准：当时待批的是本文件的三个拍板项与推荐值）
execution_lane: standard   # quick | standard

## 目标与非目标

### 目标（Goals）

- 给本仓补上文档审查通道，且**两级**：小审随任务（轻，4 维，落进现有产物）、大审随版本冻结（重，7 维，独立报告）。
- 与既有 code review 的两级节奏同构，不新增阶段、不改阶段机、不改产物白名单。
- 把 issue #4 的四种「维度与机制」抄成本仓文本，并写明不采用项。

### 非目标（Non-goals）

- 不引入 PDF / DOCX / OCR 管线（本插件无文档读取工具）。
- 不做多厂商评审团、不做批注 UI。
- 不做机械一致性对账（doc-guard）与口径钉扎（canon-keeper）。
- 不新增任务产物文件名；`lib/artifact.js` 保持不变。
- 不改 `dsh-trellis-sun-check` 的现有六行矩阵语义，只追加一行并划界。

## 需求拆解与实现方案

### 涉及模块与边界

| 层 | 文件 | 角色 |
|---|---|---|
| 协议文本（共享） | `skills/_templates/doc-review.md` **新增** | 两把尺子的唯一定义处（S1–S4 / D1–D7）+ 大审报告骨架 + 不采用清单 + 取材出处 |
| 流程编排 | `skills/_templates/work-types.md` | 「文档审查节奏（两级）」表 + 纪律；阶段表挂点 |
| 阶段产物 | `skills/_templates/feat/review.md` | 新增「文档审查」节（四行维度表 + 发现表） |
| 技能文本 | `dsh-trellis-sun-feat` | review 阶段行、文档 review 小节、人卡点、反模式 |
| 技能文本 | `dsh-trellis-sun-check` | 检查矩阵 +1 行「文档审查落定」+ 与第 5 行划界 |
| 技能文本 | `dsh-trellis-sun-issue` / `-refactor` | 各一句：小审结论追加到 `fix-note.md` / `apply-notes.md` 的同名节 |
| 技能（新） | `skills/dsh-trellis-sun-doc-review/SKILL.md` **新增** | 大审的执行流程（六步 + 硬卡点） |
| 登记 | `lib/skills.js` `SKILL_DIRS` | 第 16 个技能进入播种集合 |
| 登记 | `lib/index.js` 注释 | 「15 skills」→「16 skills」 |
| 测试 | `test/skill-contract.test.js`（追加用例）、`test/doc-review-seam.test.js` **新增** | 编号齐、不采用项、落点、播种 |
| 分发 | `README.md`、`README_EN.md`、`CHANGELOG.md`、`package.json` | 计数、review 章节、1.2.0 条目 |

**边界**：审查者只写自己的报告 / 阶段产物的一节，**一个字都不改被审文档**（对齐 `dsh-trellis-sun-spec-bootstrap` 的「不修改业务文档正文」）。

### 核心数据流与逻辑拆解

```text
小审（随任务，轻）
  feat review 阶段
    → 定对象：本任务 2~4 份产物（prd/design/spec-delta 或 report/analysis、scan/refactor-design）
    → 逐维过 S1..S4，每条命中给「位置 + 逐字引用 + 依据」
    → 写进 review.md 的「文档审查」节（四行表 + 发现表，编号 DR1..）
    → check 复核：S1/S3 命中未处理 → 不放行 finish
    → 大审不重扫这些条目

大审（版本冻结，重）
  dsh-trellis-sun-doc-review 技能
    → §1 定范围：.trellis/doc.json 的 files（无配置则 $root 目录树）+ README/CHANGELOG + 本版本任务产物
    → §2 清点与 Diátaxis 定位 + 覆盖图（每文件 × 章节，读到/跳过 + 原因）
    → §3 七维审查 D1..D7，判定权分离成三张表（事实 / 语言 / 结构）
    → §4 自证伪：拟判 P1 的发现先写「什么证据能推翻它」并试推翻
    → §5 出报告 .trellis/reviews/<yyyy-mm-dd>-doc-review.md（8 节，status: draft）
    → §6 人 / check 复核后才转 confirmed；journal 记一笔；不改任何门禁
```

### 契约变更

- **无公开接口变更**，无配置项变更，无存储结构变更。
- 唯一「集合类契约」变化：`lib/skills.js` 的 `SKILL_DIRS` 由 15 项变 16 项；`_templates/` 新增一个**协议文件**（非产物模板，`test/skill-contract.test.js` 的模板映射只扫 `_templates/<type>/` 子目录，故不受影响）。
- `lib/artifact.js` 的 `CURRENT_ARTIFACTS` / `ALLOWED_ARTIFACTS` 不变——这是本轮刻意的取舍，见下。

### 关键技术选型与取舍

1. **小审不新建产物，写进现有产物的一节**。
   - 备选：新增 `doc-review.md` 产物名 + 模板 + 白名单条目。
   - 否决理由：白名单一改就要动 `lib/artifact.js`、三处契约测试、播种与 spec；而小审的产出本来就只是「四行表 + 几条发现」，一个独立文件对它过重。`dsh-trellis-sun-check` 已经有多路写产物的先例（feat→`review.md`、issue→`fix-note.md`、refactor→`apply-notes.md`），小审沿用同一模式。

2. **大审单独成技能（第 16 个）而不是塞进 feat 技能**。
   - 备选：只写进 `work-types.md`（像大 code review 那样靠外部 `ocr` 取规则，不需要多少文本）。
   - 否决理由：大审没有外部工具可依赖，它的规则就是那七维 + 六步流程，文本量达到技能级；而且它要能在**没有 active task 的项目**上被点名跑（跨版本、跨任务），feat 技能加载不到那个场景。

3. **大审报告落 `.trellis/reviews/`**。
   - 备选 A：写进 journal——七维长报告塞不进滚动日志，且 journal 是流水不是档案。
   - 备选 B：当成任务产物——它不是任何任务的产物，进白名单会污染「任务产物 = 流程产出」的语义。
   - 落 `.trellis/reviews/<yyyy-mm-dd>-doc-review.md`：不进注入白名单（`doc.json` 的 `files` 由用户控制）、不进产物白名单、journal 只留一行指针。

4. **小审砍掉语言质量与 Diátaxis**。
   - 理由：润色级意见在每次任务里重复出现会把小审变成噪声源；Diátaxis 定位是「文档定稿」问题，不是「本次改动对不对」问题。两者都归大审。

5. **只有 S1/S2/S3 命中算 P1，卡 finish；S4 与所有大审发现不卡门禁**。
   - 理由：小审必须便宜且必须挡得住真错（死引用、验收不可测、留占位）；大审是版本级体检，卡门禁会让「文档写得好不好」变成阻塞发布的理由。

6. **小审默认主会话 inline**，仅当被审文档 ≥ 3 份或合计 ≥ 800 行时派独立子代理。
   - 理由：2 份文档 4 个维度不值得一次子代理往返；但文档一多，主会话容易只读开头就下结论。

## 验证计划

1. 契约测试（`node --test test/skill-contract.test.js`）
   - `doc-review.md` 含 S1/S2/S3/S4 与 D1..D7 共 11 个编号；
   - 含「不采用」与「机械一致性」；含取材出处两个 URL；
   - `feat/review.md` 含「文档审查」且含 S1..S4；
   - `check` 技能含「文档审查落定」与「可测」；
   - 大审技能含 `.trellis/reviews/`、`draft`、`confirmed`、`不修改`、`不卡`；
   - `CURRENT_ARTIFACTS` 大小仍为 10（钉住「不新增产物」）。
2. 播种 seam（`node --test test/doc-review-seam.test.js`）
   - `ensureProjectSkills` 后 `.agents/skills/dsh-trellis-sun-doc-review/SKILL.md` 与 `.agents/skills/_templates/doc-review.md` 存在；
   - `SKILL_DIRS` 与磁盘上的 `skills/dsh-trellis-sun-*` 目录**双向一致**（多一个少一个都红）。
3. 全量回归：`node --test`，基线 349 → ≥ 355 全绿。
4. 版本与分发：`node scripts/extract-changelog.mjs v1.2.0` 能抽出双语正文。
5. dogfood：用本任务的 `prd.md` + `design.md` 跑小审 S1–S4，结论写进 `review.md` 的「文档审查」节（AC9）。

## 风险与回滚

- **风险 1 计数漂移**：技能数写在 4 个文件里，靠新 seam 测试（`SKILL_DIRS` ↔ 磁盘目录双向一致）兜住，而不是靠人记。
- **风险 2 噪声**：S1/S2/S3 才卡 finish；S4 与大审全部不卡。
- **风险 3 与 check 撞车**：check 矩阵新增行显式写「管标准本身可不可测」，第 5 行保留「管实现满没满足」。
- **回滚**：全部改动集中在 `skills/**` + 两行 `lib/` 注释 + 测试与文档，`git revert` 单提交即可；无数据迁移、无配置迁移。已播种的项目靠 `--reseed`（版本 1.2.0 > 1.1.3 触发覆写分支）。

## 人审检查点

- [x] 需求拆解完整，实现方案清晰
- [x] 设计已获用户确认（owner 2026-11-27 会话内「开工」；本文件随之改为 `status: approved`，属记录补齐而非事后追认）
