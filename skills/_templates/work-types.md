# Work Type Workflows (feat / issue / refactor)

Trellis 核心三类工作流。
**载体**：`.trellis/tasks/{slug}/`
**入口**：由工作流路由表驱动，复用原生 Trellis skill（`sun-trellis-feat` / `sun-trellis-issue` / `sun-trellis-refactor`）
**模板**：`.trellis/templates/{feat,issue,refactor}/`（首次使用时由对应技能自动初始化）

> **slug 严格格式**（插件会在 breadcrumb / `sun_trellis_state` 校验并提示）：
> `<work-type>-<mm-dd>-<短名>`，如 `feat-01-15-billing-export`。`<mm-dd>` 为创建日期，
> `<work-type>` 取自 `work.type`（feat|issue|refactor）。不合规的目录名会收到警告。

## 通用约定

1. 新工作只建 Trellis task，各类产物只落 `.trellis/tasks/`。
2. **建 task 用内置工具 `sun_trellis_task_create`**：它会写 `.trellis/tasks/<slug>/task.json`
   （status=planning）、播种产物模板，并**同步写 `.trellis/.runtime/sessions/` 的
   `current_task`**，让面包屑/阶段/Web 徽标立即生效。不要手动建目录或手写 session 文件。
3. **更新 task 状态与阶段用内置工具 `sun_trellis_task_update`**：支持安全修改 `status`、`stage`、`mode`、`title` 与 `description`，自动校验工作流轨道并实时刷新 Web 状态徽标缓存（未指定 `slug` 时自动作用于当前会话绑定的活动任务）。
4. `task.json` 扩展字段结构（由 `sun_trellis_task_create` / `sun_trellis_task_update` 维护，不破坏原生 status）：
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
6. **归档用内置工具 `sun_trellis_task_archive`**：把 `.trellis/tasks/<slug>/` 原子移入
   `.trellis/tasks/archive/<yyyy-mm>/<slug>/`——月份键 `<yyyy-mm>` = slug 的 `mm` + 当年
   （与看板读取共用同一逻辑，写读永远一致；无 `mm-dd` 的遗留 slug 归 `other/`），并自动解绑
   指向该任务的会话指针（归档任务只读，不再可激活）。归档**只移动、不删除**记录。
   若工作区存在与本任务无关的未提交改动，可通过 `modified_files` 声明任务真实改动文件，
   局部 Git 校验（清单内文件须已提交；清单外改动放行并告警）。
5. 细阶段用 `work.stage` + 产物文件恢复；**仓库产物优先于聊天历史**。
6. 写代码前读项目配置的规范入口：有 `.trellis/doc.json` 时按 files 清单与导航阅读；无配置时按 root 默认目录读取对应规范与 `guides/`。
7. 规划/需求澄清加载 `sun-trellis-brainstorm`；实现前 `sun-trellis-before-dev`；质量门 `sun-trellis-check`；
   收工走原生 Trellis 生命周期（commit → `sun-trellis-finish-work` / `sun_trellis_task_archive`）；沉淀 `sun-trellis-update-spec`。
8. 人卡点未通过时，禁止写 `status=in_progress`（或禁止进入写码阶段）。
9. **slug 规范**：新任务目录名必须为 `<work-type>-<mm-dd>-<短名>`（如 `feat-01-15-billing-export`，
   mm-dd 为创建日期）；插件每轮在 breadcrumb / `sun_trellis_state` 校验，不合规会提示。
10. **spec-delta 是「改动本身的增量」**：feat 轨道在 design 阶段与 `design.md` 一起产出、一起批准，
    归档时由 `sun-trellis-finish-work` 逐条机械合并进常驻 spec；它与 `sun-trellis-update-spec`
    沉淀的「实施教训」不是一回事，不要混用。
11. **改动范围与检查结论都要有据**：`sun-trellis-check` 的改动集由 git 确定性算出，逐文件结论进覆盖清单；
    工具失败按错误上报（fail-closed）。

## Review 节奏（两级）

| 级别 | 时机 | 范围 | 执行 |
|------|------|------|------|
| 小 review | 开发中，随任务走（review / check 阶段） | 深：业务逻辑对不对、验收标准满没满足、spec-delta 是否落地 | 独立子代理按证据型工作流写 `review.md` + `sun-trellis-check` |
| 大 review（打板） | 开发完成、版本冻结时 | 广：跨模块一致性、积累的规则型问题与残渣 | OCR（`@alibaba-group/open-code-review`）全量扫，`delegate` 模式 |

- 小 review 不攒问题：类型、风格、明显 bug 顺手清掉，不等打板。
- 大 review 是**外部依赖**（OCR 二进制不进本插件）；默认 `delegate` 模式由会话模型审，**禁用 managed 模式**（代码不外发端点）。
- 大 review 结论落版本记录（journal / release notes），**不改本插件的验证门禁**（verified / human 两档）。

## 路由

| 用户意图 | 入口 skill | 说明 | slug 前缀建议 |
|----------|------------|------|----------------|
| 新功能 / 功能改造 | `sun-trellis-feat` | 按 quick/standard 推进 prd→design→impl→review→check | `feat-<mm-dd>-...` |
| Bug / 异常 / 回归 | `sun-trellis-issue` | 推进 report→analyze→fix→fix-note；反复调试时配合 `sun-trellis-break-loop` | `issue-<mm-dd>-...` |
| 行为等价重构 / 拆分 / 优化 | `sun-trellis-refactor` | 推进 scan→design→apply；行为变更转 feat/issue | `refactor-<mm-dd>-...` |
| 会话开工 / 恢复上下文 | 原生 Trellis（Active Task） | `sun_trellis_state` / `sun-trellis-continue` | — |
| 需求澄清（feat/issue 规划期） | `sun-trellis-brainstorm` | 由对应流程在规划期加载 | — |

## Feature 阶段

`mode/lane`：`quick` | `standard`（goal/长程用 parent+child task）

| stage | 产物 | 人卡点 |
|-------|------|--------|
| prd | `prd.md` | Quick 可较轻 |
| design | `design.md`（落实 YAGNI 与 Non-goals，防过度设计）+ `spec-delta.md`（改动对常驻 spec 的增量；无则写「无增量：<原因>」） | Standard：用户 approve **两者** |
| impl | 代码；步骤清单以 `task.json.steps` 为准 | 需先写 `status=in_progress`；`verification: human` 步骤须用户确认 |
| review | `review.md`（独立子代理，证据型） | blocking 需修复；可选 `sun-trellis-check` 自修 |
| check | `sun-trellis-check` 结果与验证证据（写入 `review.md`） | 必须通过后 archive |
| finish | `spec-delta.md` 的合并记录 + `.trellis/journal/` 记录 | delta 未 approved 或核对失败 → 停下询问 |

Quick：`prd` 清晰且局部、无新跨系统契约时可精简 design；仍建议最小 prd + 实现后 check。

## Issue 阶段

| stage | 产物 | 人卡点/跳过 |
|-------|------|-------------|
| report | `report.md` | |
| analyze | `analysis.md` | 根因一眼确定可跳过 |
| fix | 代码 | 写 `status=in_progress` 后 |
| fix-note | `fix-note.md` | archive 前必需 |

## Refactor 阶段

底线：**行为等价**。会改外部可观察行为 → 转 feat/issue。

| stage | 产物 | 人卡点 |
|-------|------|--------|
| scan | `scan.md` | 用户勾选纳入项 |
| design | `refactor-design.md`（步骤清单在规划期录入 `task.json.steps`） | 用户 approve |
| apply | 代码 + `apply-notes.md`；步骤推进以 `task.json.steps` 为准 | `verification: human` 验证步需确认 |
| done | 全量验证 | 用户最终确认后 archive |

`mode: fastforward`：范围极小、可回滚、行为等价；可压缩 scan/design，但仍需 apply-notes + check。

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
| 实现 | 主会话派实现子代理（可选） | 按 prd/design 实现 |
| 规范自修/验证 | `sun-trellis-check` | 规范对照 + 自修/验证 |
| 打板大 review | 版本冻结时调外部 OCR 工具 | 跨模块一致性与残渣 → 版本记录 |

派发协议：每个派发 prompt 以 `Active task: <task 目录路径>` 开头；reviewer 返回 `blocking` 时停在该 stage。
