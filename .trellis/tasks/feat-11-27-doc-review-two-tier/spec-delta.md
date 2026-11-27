# Spec Delta

status: approved   # draft | approved（与 design.md 同一批准，owner 2026-11-27「开工」）

> 本文件记录**本次改动本身对常驻 spec 的增量**：事前写好、随 design 一起评审、归档时机械合并。
> 它与 `dsh-trellis-sun-update-spec` 不是一回事——那里沉淀的是实施中复盘出的教训（事后判断），
> 这里是改动的契约增量（事前提案）。

## ADDED

### A1

- 目标文件：`.trellis/spec/trellis-workflow/task-engine/index.md`
- 章节定位：父章节 `# dsh-trellis-sun / task-engine — 质量检查与约定`；插入位置在 `## 已知坑（防复发）` 之前（即 `## 任务执行引擎约定` 一节之后）
- 新文本：

```markdown
## 文档审查（两级）

代码审查有大小两级（`skills/_templates/work-types.md` 的「Review 节奏」），文档审查与它同构：

- **小审 S1–S4（随任务，不新建产物）**：`S1 引用能落地`（路径、文件名、工具名、命令、版本号逐个核对目标存在且名字对得上）、
  `S2 没有占位与空洞`（TODO / 待补 / `<...>` / 只有标题的章节）、`S3 验收可测`（每条验收标准都写得出验证入口：
  命令、质量门或人工确认）、`S4 文内自洽`（同一数字/版本/名字在被审文件集内部一致）。feat 轨道在 review 阶段与
  code review 同轮执行，结论落 `review.md` 的「文档审查」节；issue 轨道落 `fix-note.md`、refactor 轨道落 `apply-notes.md`。
  **S1 / S2 / S3 命中未处理，即禁止宣称 review passed。**
- **大审 D1–D7（版本冻结，独立报告）**：由 `dsh-trellis-sun-doc-review` 执行。范围由 `.trellis/doc.json` 的 `files`
  （无配置时 `$root` 目录树）加 README / CHANGELOG 与本版本任务产物**算出**，不许凭印象列文件。报告落
  `.trellis/reviews/<yyyy-mm-dd>-doc-review.md`，状态 `draft`，经人或 `dsh-trellis-sun-check` 复核后转 `confirmed`；
  **不卡任何门禁**。
- 两级的维度定义、证据规则（位置 + 逐字引用 + 依据，无引用不成立）与明确不采用项，集中在
  `skills/_templates/doc-review.md`，不要在别处复制第二份。
- **边界**：`dsh-trellis-sun-check` 的检查矩阵核「实现是否满足验收标准」，小审 S3 核「验收标准本身可不可测」，
  两者不互相替代；机械一致性对账（版本号 / 计数 / 结构树的跨文档对账，doc-guard 方向）与口径钉扎（canon-keeper 方向）
  **不在**本机制范围内。
- 审查者只写自己的报告或阶段产物的一节，**不修改被审文档正文**。
```

- 依据：本任务 AC1–AC6；对应 `skills/_templates/doc-review.md`、`skills/_templates/work-types.md` 与 `skills/dsh-trellis-sun-doc-review/SKILL.md` 的落地文本。

## MODIFIED

无增量：本轮不改 `CURRENT_ARTIFACTS` / `ALLOWED_ARTIFACTS`（不新增产物名），也不改 `SKILL_DIRS` 之外的任何 `lib/` 契约，故 task-engine spec 的产物白名单与播种条款无旧文本需要改写。

## REMOVED

无。
