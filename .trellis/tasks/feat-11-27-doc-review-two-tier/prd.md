# 文档审查两级化（小审 / 大审）

## 背景

- **空白**：本仓的 review 机制全部面向代码（`_templates/feat/review.md` 的证据型 code review、`dsh-trellis-sun-check` 的检查矩阵），对 PRD / design / spec 这类文档没有任何审查通道。issue #4 要求的正是一件事：把文档审查补上。
- **原材料**（已核对存在，均 MIT）：
  - [`zircote-plugins/documentation-review`](https://github.com/zircote-plugins/documentation-review)：`agents/doc-reviewer.md` 给出准确性 / 完整性 / 清晰度 / 格式 / 一致性五维 + Diátaxis 四象限定位审计 + 分级报告。
  - [`NeonSparklex/dsh-report-reviewer-zh-Hans`](https://github.com/NeonSparklex/dsh-report-reviewer-zh-Hans)：`skill/report-review.md` + `roles/*.md` 给出「每条意见带页码引用」「需外部核对标记」「覆盖图」「草案→人复核」与**判定权分离**（事实 / 语言 / 结构互不越界）。
- **为什么拆两级**：七维全套放进每次任务太重。仓库已有现成范式——code review 本来就是两级：**小 review** 写在 `dsh-trellis-sun-feat` 里随任务走，**大 review** 写在 `work-types.md` 里、版本冻结时调外部 `ocr` 取规则。文档审查照抄这个骨架，而不是另造一套节奏。

## 范围

### In Scope

- 两级文档审查的可执行定义：小审 **S1–S4**（随任务）、大审 **D1–D7**（版本冻结），集中写在 `skills/_templates/doc-review.md`。
- 小审接入点：feat `review` 阶段（与 code review 同轮）、`check` 复核、issue / refactor 按需；结论**落进现有阶段产物的一节**，不新建任务产物文件。
- 大审落点：新增第 16 个技能 `dsh-trellis-sun-doc-review`，独立报告 `.trellis/reviews/<yyyy-mm-dd>-doc-review.md`，状态 `draft` → `confirmed`。
- 契约测试、README（中英）、CHANGELOG、版本 1.2.0。

### Out of Scope

- **PDF / DOCX / OCR 管线**：本插件没有 `doc_read` / `pdf_read` / `doc_ocr`，只审仓库内 Markdown。
- **多厂商评审团**（issue 原文已明确不看好）。
- **批注 UI**（人审类插件）。
- **机械一致性对账（doc-guard 方向）、口径钉扎（canon-keeper 方向）**：issue 划为「未定，另行处理」。
- `lib/artifact.js` 产物白名单**不变**（不新增产物名），`CURRENT_ARTIFACTS` 仍是 10 个。

## 验收标准

每条都给出可判定方式，验收时逐条对账（本任务自己也要过小审 S3）：

- [ ] **AC1** `skills/_templates/doc-review.md` 存在，且 S1–S4 与 D1–D7 全部编号齐、每个维度写明「查什么 / 怎么查 / 命中级别」。
      *判定*：`test/skill-contract.test.js` 对 11 个编号逐个断言，**并断言两张维度表都带「级别」列**（判定不得窄于判据——第一轮曾因判定只查编号而放过了 D 表缺级别列）。
- [ ] **AC2** 小审的落点是现有产物的一节，不是新文件：`_templates/feat/review.md` 含「文档审查」节，`dsh-trellis-sun-feat` 的 review 阶段行点名它。
      *判定*：契约测试断言 `feat/review.md` 含 `文档审查` 与 S1–S4 编号；`lib/artifact.js` 的 `CURRENT_ARTIFACTS` 集合大小仍为 10。
- [ ] **AC3** `dsh-trellis-sun-check` 检查矩阵含「文档审查落定」行，并写明与矩阵第 5 行（PRD 验收逐条核对）的边界。
      *判定*：契约测试断言 check 技能同时出现 `文档审查落定` 与 `可测` 两个词。
- [ ] **AC4** 新增技能 `dsh-trellis-sun-doc-review` 登记进 `lib/skills.js` 的 `SKILL_DIRS`，播种后真实存在。
      *判定*：seam 测试跑 `ensureProjectSkills`，断言 `.agents/skills/dsh-trellis-sun-doc-review/SKILL.md` 与 `_templates/doc-review.md` 都落地。
- [ ] **AC5** 大审技能写明：报告落点 `.trellis/reviews/<yyyy-mm-dd>-doc-review.md`、8 节骨架、`draft`→`confirmed`、不改被审文档、不卡任何门禁。
      *判定*：契约测试对上述五个要素逐个断言。
- [ ] **AC6** 明确不抄项逐条列出（PDF/OCR、评审团、批注 UI、机械一致性 / canon-keeper）。
      *判定*：契约测试断言 `doc-review.md` 同时出现 `不采用` 与 `机械一致性`。
- [ ] **AC7** `node --test` 全绿，用例数 ≥ 355（基线 349 + 新增 ≥ 6）。
      *判定*：`node --test` 的 `pass` 计数。
- [ ] **AC8** `package.json` version = `1.2.0`；`CHANGELOG.md` 有 v1.2.0 中英双语条目；两份 README 的技能计数与 review 章节同步。
      *判定*：读文件核对，且 `scripts/extract-changelog.mjs v1.2.0` 能抽出正文。
- [ ] **AC9**（dogfood）用本 `prd.md` 与 `design.md` 跑一遍小审 S1–S4，结论落进本任务 `review.md` 的「文档审查」节，且**要么暴露真实问题、要么写明 0 命中的核对证据**。
      *判定*：`review.md` 该节四行俱全且每行带依据。

## 约束与风险

- **技能计数四处同步**：`lib/skills.js` 注释、`lib/index.js` 注释、`README.md`、`README_EN.md` 都写死「15 个」。漏一处就与 `SKILL_DIRS` 自相矛盾。本轮改为「16 个」并逐个核对。
- **噪声**：小审只留 4 维，且只有 S1 / S2 / S3 命中算 P1；语言润色不进小审（那是校对，收益低于成本）。
- **与 check 撞车**：check 矩阵第 5 行已核「PRD 验收标准逐条满足」，小审 S3 核「验收标准本身可不可测」。两者必须在文本里显式分工，否则模型会各跑一遍。
- **大审过度**：文档很少的项目跑七维是浪费，所以大审**不设为门禁**，只在版本冻结时按需。

## 相关代码/文档

- 上游：issue #4（本任务来源）、issue #2（code review 机制落地的范式，commit `2020faf`）。
- 改动面：`skills/_templates/{doc-review.md,work-types.md,feat/review.md}`、`skills/dsh-trellis-sun-{feat,check,issue,refactor,doc-review}/`、`lib/{skills.js,index.js}`、`test/*`、两份 README、`CHANGELOG.md`、`package.json`。
- 上游项目文档：`.trellis/spec/trellis-workflow/task-engine/index.md`（本轮通过 `spec-delta.md` 追加约定）。
