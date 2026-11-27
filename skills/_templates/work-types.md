# Work Type Workflows (feat / issue / refactor)

Trellis 核心三类工作流。
**载体**：`.trellis/tasks/{slug}/`
**入口**：由工作流路由表驱动，复用原生 Trellis skill（`dsh-trellis-sun-feat` / `dsh-trellis-sun-issue` / `dsh-trellis-sun-refactor`）
**模板**：`.trellis/templates/{feat,issue,refactor}/`（首次使用时由对应技能自动初始化）

> **slug 严格格式**（插件会在 breadcrumb / `dsh_trellis_sun_state` 校验并提示）：
> `<work-type>-<mm-dd>-<短名>`，如 `feat-01-15-billing-export`。`<mm-dd>` 为创建日期，
> `<work-type>` 取自 `work.type`（feat|issue|refactor）。不合规的目录名会收到警告。

## 通用约定

1. 新工作只建 Trellis task，各类产物只落 `.trellis/tasks/`。
2. **建 task 用内置工具 `dsh_trellis_sun_task_create`**：它会写 `.trellis/tasks/<slug>/task.json`
   （status=planning）、播种产物模板，并**同步写 `.trellis/.runtime/sessions/` 的
   `current_task`**，让面包屑/阶段/Web 徽标立即生效。不要手动建目录或手写 session 文件。
3. **更新 task 状态与阶段用内置工具 `dsh_trellis_sun_task_update`**：支持安全修改 `status`、`stage`、`mode`、`title` 与 `description`，自动校验工作流轨道并实时刷新 Web 状态徽标缓存（未指定 `slug` 时自动作用于当前会话绑定的活动任务）。
4. `task.json` 扩展字段结构（由 `dsh_trellis_sun_task_create` / `dsh_trellis_sun_task_update` 维护，不破坏原生 status）：
   ```json
   {
     "work": {
       "type": "feat",
       "mode": "standard",
       "stage": "design",
       "execution_lane": "standard"
     }
   }
   ```
5. 原生 `status` 仍只用：`planning` → `in_progress` → `completed`（archive）。
6. **归档用内置工具 `dsh_trellis_sun_task_archive`**：把 `.trellis/tasks/<slug>/` 原子移入
   `.trellis/tasks/archive/<yyyy-mm>/<slug>/`——月份键 `<yyyy-mm>` = slug 的 `mm` + 当年
   （与看板读取共用同一逻辑，写读永远一致；无 `mm-dd` 的遗留 slug 归 `other/`），并自动解绑
   指向该任务的会话指针（归档任务只读，不再可激活）。归档**只移动、不删除**记录。
   若工作区存在与本任务无关的未提交改动，可通过 `modified_files` 声明任务真实改动文件，
   局部 Git 校验（清单内文件须已提交；清单外改动放行并告警）。
7. 细阶段用 `work.stage` + 产物文件恢复；**仓库产物优先于聊天历史**。
8. 写代码前读项目配置的规范入口：有 `.trellis/doc.json` 时按 files 清单与导航阅读；无配置时按 root 默认目录读取对应规范与 `guides/`。
9. 规划/需求澄清加载 `dsh-trellis-sun-brainstorm`；实现前 `dsh-trellis-sun-before-dev`；质量门 `dsh-trellis-sun-check`；
   收工走原生 Trellis 生命周期（commit → `dsh-trellis-sun-finish-work` / `dsh_trellis_sun_task_archive`）；沉淀 `dsh-trellis-sun-update-spec`。
10. 人卡点未通过时，禁止写 `status=in_progress`（或禁止进入写码阶段）。
11. **slug 规范**：新任务目录名必须为 `<work-type>-<mm-dd>-<短名>`（如 `feat-01-15-billing-export`，
    mm-dd 为创建日期）；插件每轮在 breadcrumb / `dsh_trellis_sun_state` 校验，不合规会提示。
12. **spec-delta 是「改动本身的增量」**：feat 轨道在 design 阶段与 `design.md` 一起产出、一起批准，
    归档时由 `dsh-trellis-sun-finish-work` 逐条机械合并进常驻 spec；它与 `dsh-trellis-sun-update-spec`
    沉淀的「实施教训」不是一回事，不要混用。
13. **改动范围与检查结论都要有据**：`dsh-trellis-sun-check` 的改动集由 git 确定性算出，逐文件结论进覆盖清单；
    工具失败按错误上报（fail-closed）。
14. **文档审查分两级**：小审（S1–S4）随任务走、结论进阶段产物的一节；大审（D1–D7）在版本冻结时由
    `dsh-trellis-sun-doc-review` 出独立报告。维度、证据规则与不采用项见 `_templates/doc-review.md`，
    不要在别处复制第二份。

## Review 节奏（两级）

| 级别 | 时机 | 范围 | 执行 |
|------|------|------|------|
| 小 review | 开发中，随任务走（review / check 阶段） | 深：业务逻辑对不对、验收标准满没满足、spec-delta 是否落地 | 独立子代理按证据型工作流写 `review.md` + `dsh-trellis-sun-check` |
| 大 review（打板） | 开发完成、版本冻结时 | 广：跨模块一致性、积累的规则型问题与残渣 | 入口检查 → `ocr delegate rule` 取规则 → 会话模型审（见下） |

- 小 review 不攒问题：类型、风格、明显 bug 顺手清掉，不等打板。

### 大 review 怎么跑（可执行定义）

大 review 是**外部依赖**：OCR（npm 包 `@alibaba-group/open-code-review`，CLI 名 `ocr`）不进本插件。
按三步走，每一步都有可判定的结果：

1. **入口检查**（只判「有没有」，不负责安装）：
   `npx --yes @alibaba-group/open-code-review --version`——能打印版本号才算可用；本机全局装过就直接 `ocr --version`。
2. **取值再评审**（delegate 模式，代码不外发）：
   `ocr delegate rule <改动文件...>` 取出这批文件的规则与检查项，**由本会话模型**逐条执行、定位、写结论。
   跑之前**不要**配置 OCR 自己的 provider——那是 native 模式（`ocr review` / `ocr scan`）的前置，
   会把代码发给 OCR 侧配置的模型，与本项目「代码不外发」的取舍冲突。
   确需 native 模式时，必须由用户显式授权，并把授权记在版本记录里。
3. **落结论**：结论写进版本记录（journal / release notes），**不改本插件的验证门禁**（verified / human 两档）。

**工具不可用时的降级**（不许空转，也不许假装跑过）：第 1 步失败即按下面固定清单用文本检索过一遍，
并在版本记录里写明「大 review 未执行（ocr 不可用：<原因>）」+ 未覆盖范围（与 `graph-queries.md` 的降级口径一致）：

| 固定检查项 | 怎么查 |
|---|---|
| 跨模块契约一致（同名工具 / 字段 / 错误码两边定义一致） | 按符号名全仓检索，逐个比对签名与文档描述 |
| 技能文本与实现不矛盾（写了没做 / 做了没写） | 对照 `lib/**` 的导出与 `skills/**` 的表述 |
| 版本与分发一致（`package.json` / `.trellis-version` / tag / CHANGELOG） | 比对四处版本号与 CHANGELOG 条目 |
| 死引用与残渣（指向已删除文件或下线接口） | 检索路径与工具名，逐个确认目标仍存在 |
| 零依赖约束（是否引入运行时 dep） | 查 `dependencies` 与实际 `import` 来源 |

## 文档审查节奏（两级）

维度、证据规则与不采用项集中在 `_templates/doc-review.md`（两把尺子）；这里只定节奏与挂点。

| 级别 | 时机 | 范围 | 维度 | 执行 | 产物 |
|------|------|------|------|------|------|
| 小审 | 随任务：feat `review` 阶段与 code review 同轮；`check` 复核 | 本任务 2–4 份产物（prd/design/spec-delta，或 report/analysis、scan/refactor-design） | S1–S4 | 主会话 inline；被审文档 ≥ 3 份或合计 ≥ 800 行时派独立子代理 | 阶段产物的一节：feat → `review.md`；issue → `fix-note.md`；refactor → `apply-notes.md` |
| 大审 | 版本冻结 / 文档定稿 | 由 `.trellis/doc.json` 的 `files`（无配置时 `$root` 目录树）加 README / CHANGELOG 与本版本任务产物算出 | D1–D7 | `dsh-trellis-sun-doc-review` 技能 | `.trellis/reviews/<yyyy-mm-dd>-doc-review.md` + journal 一笔 |

- 小审不攒问题等大审；大审不重扫小审已逐条过完的内容，只做跨文档与深度维度。
- 只有小审的 S1 / S2 / S3 命中未处理才卡门禁（禁止宣称 review passed）；**大审不卡任何门禁**。
- 审查者只写自己的报告或阶段产物的一节，**不改被审文档正文**。
- 与 `dsh-trellis-sun-check` 的分工：check 核「实现是否满足验收标准」，小审 S3 核「验收标准本身可不可测」。

## 路由

| 用户意图 | 入口 skill | 说明 | slug 前缀建议 |
|----------|------------|------|----------------|
| 新功能 / 功能改造 | `dsh-trellis-sun-feat` | 按 quick/standard 推进 prd→design→impl→review→check | `feat-<mm-dd>-...` |
| Bug / 异常 / 回归 | `dsh-trellis-sun-issue` | 推进 report→analyze→fix→fix-note；反复调试时配合 `dsh-trellis-sun-break-loop` | `issue-<mm-dd>-...` |
| 行为等价重构 / 拆分 / 优化 | `dsh-trellis-sun-refactor` | 推进 scan→design→apply；行为变更转 feat/issue | `refactor-<mm-dd>-...` |
| 会话开工 / 恢复上下文 | 原生 Trellis（Active Task） | `dsh_trellis_sun_state` / `dsh-trellis-sun-continue` | — |
| 需求澄清（feat/issue 规划期） | `dsh-trellis-sun-brainstorm` | 由对应流程在规划期加载 | — |
| 文档大审 / 版本冻结文档体检 / 接手陌生文档 | `dsh-trellis-sun-doc-review` | 出 `draft` 报告待复核，**不卡门禁**、不建任务 | — |

## Feature 阶段

`mode/lane`：`quick` | `standard`（goal/长程用 parent+child task）

| stage | 产物 | 人卡点 |
|-------|------|--------|
| prd | `prd.md` | Quick 可较轻 |
| design | `design.md`（落实 YAGNI 与 Non-goals，防过度设计）+ `spec-delta.md`（改动对常驻 spec 的增量；无则写「无增量：<原因>」） | Standard：用户 approve **两者** |
| impl | 代码；步骤清单以 `task.json.steps` 为准 | 需先写 `status=in_progress`；`verification: human` 步骤须用户确认 |
| review | `review.md`（独立子代理，证据型 code review）+「文档审查（小审）」节 | blocking 需修复；S1/S2/S3 命中未处理不得判 passed；可选 `dsh-trellis-sun-check` 自修 |
| check | `dsh-trellis-sun-check` 结果与验证证据（写入 `review.md`） | 必须通过后 archive |
| finish | `spec-delta.md` 的合并记录 + `.trellis/journal/` 记录 | delta 未 approved 或核对失败 → 停下询问；**没有 delta 文件 → 按无增量继续**（老任务 / 非 feat 轨道） |

Quick：`prd` 清晰且局部、无新跨系统契约时可精简 design；仍建议最小 prd + 实现后 check。

## Issue 阶段

| stage | 产物 | 人卡点/跳过 |
|-------|------|-------------|
| report | `report.md` | |
| analyze | `analysis.md` | 根因一眼确定可跳过 |
| fix | 代码 | 写 `status=in_progress` 后 |
| fix-note | `fix-note.md` | archive 前必需 |

> 文档小审（按需）：结论以「文档审查（小审）」节追加进 `fix-note.md`，不新建产物文件；维度与规则见「文档审查节奏（两级）」。

## Refactor 阶段

底线：**行为等价**。会改外部可观察行为 → 转 feat/issue。

| stage | 产物 | 人卡点 |
|-------|------|--------|
| scan | `scan.md` | 用户勾选纳入项 |
| design | `refactor-design.md`（步骤清单在规划期录入 `task.json.steps`） | 用户 approve |
| apply | 代码 + `apply-notes.md`；步骤推进以 `task.json.steps` 为准 | `verification: human` 验证步需确认 |
| done | 全量验证 | 用户最终确认后 archive |

`mode: fastforward`：范围极小、可回滚、行为等价；可压缩 scan/design，但仍需 apply-notes + check。

> 文档小审（按需）：结论以「文档审查（小审）」节追加进 `apply-notes.md`，不新建产物文件；维度与规则见「文档审查节奏（两级）」。

## 与原生 Trellis 相位映射

| Trellis status | 典型 work.stage |
|----------------|-----------------|
| planning | feat: prd/design；issue: report/analyze；refactor: scan/design |
| in_progress | feat: impl/review/check；issue: fix/fix-note；refactor: apply |
| completed | archived（`.trellis/tasks/archive/<yyyy-mm>/<slug>`） |

## 子代理

| 角色 | 派发方式 | 用途 |
|------|----------|------|
| 代码审查 | 主会话派独立子代理 | 证据型 code review → `review.md` |
| 文档小审 | 主会话 inline（被审文档 ≥ 3 份或合计 ≥ 800 行时派子代理） | S1–S4 → 阶段产物的一节 |
| 文档大审 | 主会话派独立子代理（`dsh-trellis-sun-doc-review`） | D1–D7 → `.trellis/reviews/`，不卡门禁 |
| 实现 | 主会话派实现子代理（可选） | 按 prd/design 实现 |
| 规范自修/验证 | `dsh-trellis-sun-check` | 规范对照 + 自修/验证 |
| 打板大 review | 版本冻结时调外部 OCR 工具 | 跨模块一致性与残渣 → 版本记录 |

派发协议：每个派发 prompt 以 `Active task: <task 目录路径>` 开头；reviewer 返回 `blocking` 时停在该 stage。
