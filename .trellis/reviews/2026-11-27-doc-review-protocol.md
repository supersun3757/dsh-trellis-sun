# 文档审查报告 — dsh-trellis-sun 文档审查协议（冒烟运行）

status: draft      # draft | confirmed（人 或 dsh-trellis-sun-check 复核后才转 confirmed）
snapshot: aa7e4858703d1b8d45dba95d966320cb1018624f + 工作区未提交改动（v1.2.0 未提交）
round: 1
范围：**部分覆盖**（冒烟运行，只审本轮新增/改动的协议文档；未做全仓版本冻结审计 —— 见 §7）

## 1. 文档清单与定位

范围按 `dsh-trellis-sun-doc-review` 第一步算出（推导见 §8），清单与本轮是否审计：

| 文档 | 定位（Diátaxis） | 受众 | 行数 | 本轮审计 |
|---|---|---|---|---|
| `skills/_templates/doc-review.md` | reference（清单/协议） | 模型 + 维护者 | 146 | ✅ 逐节 |
| `skills/dsh-trellis-sun-doc-review/SKILL.md` | how-to（步骤流程） | 模型 | 84 | ✅ 逐节 |
| `skills/_templates/work-types.md` | reference（路由与节奏） | 模型 | 176 | ✅ 只审本轮新增节 |
| `skills/_templates/feat/review.md` | reference（产物模板） | 模型 | 54 | ✅ 只审本轮新增节 |
| `skills/dsh-trellis-sun-{feat,check,issue,refactor}/SKILL.md` | how-to | 模型 | 190/95/100/105 | 只看本轮新增行 |
| `.trellis/spec/trellis-workflow/{task-engine,web-ui}/index.md` | reference | 维护者 | 176/351 | ❌ 未读（见 §7） |
| `README.md` / `README_EN.md` / `CHANGELOG.md` | explanation / reference | 使用者 | 336/340/1127 | 只看 §6 与 v1.2.0 条目 |
| `.trellis/tasks/feat-11-27-doc-review-two-tier/{prd,design,spec-delta}.md` | reference（任务产物） | 维护者 | 62/119/47 | ✅（另见该任务 `review.md` 的小审节） |

## 2. 覆盖图

| 范围 | 状态 | 原因 |
|---|---|---|
| `_templates/doc-review.md` 全部 10 节 | 读到 | — |
| `dsh-trellis-sun-doc-review/SKILL.md` 六步 + 六卡点 | 读到 | — |
| `work-types.md` 的「文档审查节奏」「通用约定 14」「路由」「子代理」「Feature 阶段表」 | 读到 | 其余节本轮未改 |
| `feat/review.md` 的「文档审查（小审）」节 | 读到 | — |
| 四个轨道技能的文档审查段 | 读到 | — |
| 两份 `.trellis/spec/**/index.md` | **未读** | 冒烟运行只审协议；且 `web-ui` 与本轮无关 |
| README 全文 / CHANGELOG 全史 | **跳过** | 只核 §6 与本版本条目；全史属版本冻结审计 |
| 归档任务产物（`.trellis/tasks/archive/**`） | **跳过** | 历史只读，不在本轮范围 |

覆盖百分比：本轮**声明为部分运行**，按「协议文档」这一子集计 100%，按全仓计约 15%（不声称全仓结论）。

## 3. 七维发现

### D1 真实性

| 编号 | 级别 | 问题 | 位置 | 引用原文 | 依据 | 自证伪结论 |
|---|---|---|---|---|---|---|
| dR1 | **P1** | 技能把 legacy 扫描的函数名写错（凭空造了一个不存在的 `scanSpecTree`） | `skills/dsh-trellis-sun-doc-review/SKILL.md:27` | 「与 `lib/spec.js` 的 `scanSpecTree` 同源」 | `Select-String -Path lib/spec.js -Pattern 'function scanSpecTree'` → 无命中；`grep '^export function' lib/spec.js` 列出的真实扫描器是 `listProjectSpecs`（`lib/spec.js:302`，docblock「Walk `.trellis/spec/` and collect `.md` files」） | 尝试推翻：可能是内部/未导出函数 → 全文件搜 `scanSpec` 仍 0 命中，推翻失败，成立 |

**处置**：已修 —— 改为「即 `lib/spec.js` 的 `listProjectSpecs`（`index.md` 优先，深度与数量有界）」；并在契约测试里钉死 `assert.match(skill, /listProjectSpecs/)` + `assert.doesNotMatch(skill, /scanSpecTree/)`，防止再退化。全量 `node --test` = 356/356。

### D2 完整性

| 编号 | 级别 | 问题 | 位置 | 引用原文 | 依据 | 自证伪结论 |
|---|---|---|---|---|---|---|
| dR2 | **P2** | 新增的大审技能没有进 `work-types.md` 的「路由」表，模型按路由表找不到它的入口 | `skills/_templates/work-types.md:107-113`（原路由表 5 行） | 路由表原有 5 行：feat / issue / refactor / 会话开工 / brainstorm，**无 doc-review** | `Select-String -Path skills/_templates/work-types.md -Pattern 'dsh-trellis-sun-doc-review'` 在本轮修复前只命中「文档审查节奏」与「子代理」两处，路由表 0 命中 | 尝试推翻：技能 description 已写「版本冻结打板/文档定稿」，模型可自行加载 → 但仓库既有约定是「入口由工作流路由表驱动」（`work-types.md:5`），缺行即缺入口，不足以推翻，成立 |

**处置**：已修 —— 路由表新增一行：「文档大审 / 版本冻结文档体检 / 接手陌生文档 → `dsh-trellis-sun-doc-review` → 出 `draft` 报告待复核，**不卡门禁**、不建任务」。

### D3 跨文档一致性（核对通过，无发现）

| 同一事实 | 各处表述 | 判定 |
|---|---|---|
| 技能数 | `lib/skills.js:4` 与 `lib/index.js:13` 注释 = 16；`README.md:324` / `README_EN.md:328` = 16；磁盘 `skills/dsh-trellis-sun-*` = 16 | 一致 |
| 小审派子代理的门槛 | `work-types.md:93`「≥ 3 份或合计 ≥ 800 行」；`work-types.md:165` 同；`feat/SKILL.md:119` 同 | 一致（第二轮审查已消除 93/165 的分歧） |
| 维度编号 | 协议 S1–S4 / D1–D7 共 11 个（`Select-String '\*\*S\d\*\*'`=4、`'\*\*D\d\*\*'`=7） | 一致 |
| 大审不卡门禁 | `doc-review.md:18`、`SKILL.md` 第五/六步、`work-types.md` 节奏节、feat 人卡点 3（只管小审） | 一致 |
| 报告落点 | 协议、技能、work-types 三处均为 `.trellis/reviews/<yyyy-mm-dd>-doc-review.md` | 一致 |

### D4 结构逻辑（核对通过）

`doc-review.md` 的顺序是「分级 → 证据规则 → 小审 → 小审落法 → 大审 → 报告骨架 → 纪律 → 与 check 分工 → 不采用 → 取材」：证据规则在使用之前、落点在维度之后、边界在最后，论证依赖不倒置。

### D5 可验证性

作用于任务产物 `prd.md` 的 9 条验收标准：8 条带可执行判定入口（测试断言 / 文件核对 / 命令），1 条（AC7 用例数）判定入口可执行但依赖环境完整；该条在第二轮由独立审查实测 **356/356** 通过。**本轮无新增发现**（细节见该任务 `review.md` 的小审节）。

### D6 语言质量

| 编号 | 级别 | 问题 | 位置 | 引用原文 | 依据 |
|---|---|---|---|---|---|
| — | — | 0 命中 | — | — | 只抽读协议与技能全文，未发现改义级歧义；术语「小审/大审」在 6 处均指同一对象 |

### D7 文档定位

| 文档 | 判定 | 说明 |
|---|---|---|
| `_templates/doc-review.md` | reference ✅ | 清单式、无教学叙述 |
| `dsh-trellis-sun-doc-review/SKILL.md` | how-to ✅ | 六步 + 卡点，无象限混装 |
| `feat/review.md` | reference（模板）✅ | 空表骨架 |

## 4. 跨文档一致性对照

见 D3 表（5 项全部一致）。附一处**刻意的不一致**：`docs/ref/dsh-0.2.0-rc.2-audit.md` 仍写「15 个技能目录」——那是 0.2.0-rc.2 时点的审计快照，按其自述属历史记录，本轮不修改、不判为缺陷。

## 5. 需外部核对清单

| 断言 | 位置 | 要核对什么 | 谁能核 | 状态 |
|---|---|---|---|---|
| 两家原材料仓库存在且为 MIT | `_templates/doc-review.md` 末节两个 URL | HTTP 200 + `license.spdx_id = MIT` | 任何人 | 已核（2026-11-27，GitHub API） |
| `documentation-review` 的 `agents/doc-reviewer.md` 确含五维 | 同上 | 文件内容与「准确性/完整性/清晰度/格式/一致性」对应 | 任何人 | 已核（2026-11-27，raw 拉取） |
| `dsh-report-reviewer-zh-Hans` 的 `skill/report-review.md` 与 `roles/*.md` 确含「需外部核对 / 覆盖图 / 判定权分离」 | 同上 | 同上 | 任何人 | 已核（2026-11-27，raw 拉取） |

## 6. 优先级与整改建议

| 级别 | 条目 | 改法 | 工作量 | 状态 |
|---|---|---|---|---|
| P1 | dR1 造函数名 | 改为 `listProjectSpecs` + 契约测试钉住 | 5 分钟 | 已完成 |
| P2 | dR2 路由表缺入口 | 路由表补一行 | 5 分钟 | 已完成 |
| P3 | 若将来把大审设为门禁 | 不要：协议已写明不卡门禁，改它会与两处文本冲突 | — | 不需动作 |

## 7. 限制与未覆盖

- **本轮是冒烟运行，不是版本冻结审计**：只读了 4 份协议文档全文 + 4 个轨道技能的新增段 + 任务产物；两份 `.trellis/spec/**/index.md`、README 全文、CHANGELOG 全史、归档任务产物**未读**。因此本报告的结论**只对「文档审查协议本身」成立**，不构成「全仓文档没问题」的结论。
- **D5 只覆盖了任务产物**：仓库级文档里没有验收标准，故 D5 在本轮等价于空集。
- **D6 抽读而非全读**：未逐行校对 README 与 CHANGELOG。
- **未做 PDF / 图片内容**：仓库内无此类文档（也不在机制范围内）。

## 8. 运行信息

- 快照：`aa7e4858703d1b8d45dba95d966320cb1018624f` + 未提交改动（v1.2.0 未提交，`git status` 为 15 M + 4 ??）。
- 审查者：实现会话本人（**冒烟验证机制可执行性**，不是独立审查）；`draft` 状态、未经人复核。
- 轮次：第 1 轮。
- 范围推导（第一步的实际命令与输出）：

```text
$ Test-Path .trellis/doc.json          -> False        # 无配置，退回 legacy 口径
$ Get-ChildItem .trellis/spec -Recurse -Filter *.md
  .trellis\spec\trellis-workflow\task-engine\index.md
  .trellis\spec\trellis-workflow\web-ui\index.md
$ README.md 336 行 / README_EN.md 340 行 / CHANGELOG.md 1127 行
$ Get-ChildItem .trellis/tasks/feat-11-27-doc-review-two-tier -File
  design.md 119 / prd.md 62 / review.md 403 / spec-delta.md 47 / task.json 110
```

- 机制自检（本报告同时是对 8 节骨架可填充性的实测）：`.trellis/reviews/` 运行前不存在，本文件写出时创建，与技能第五步「目录不存在则创建」一致。
