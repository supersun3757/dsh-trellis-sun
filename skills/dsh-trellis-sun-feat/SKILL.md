---
name: dsh-trellis-sun-feat
description: "功能特性工作流：新功能开发或重大特性改造，按 quick/standard 推进 prd -> design -> impl -> review -> check。不可用于 Bug 修复（使用 dsh-trellis-sun-issue）或重构（使用 dsh-trellis-sun-refactor）。"
---

# dsh-trellis-sun-feat

在 Trellis task 上运行的 Feature 流程。
路由表与阶段机对照：`_templates/work-types.md`；产物模板：`_templates/feat/`。

## 核心理念：极简设计原则（Anti-Overengineering）

在推进 Feature 开发时，严防滑入“过度设计的深渊”：
1. **YAGNI 原则**：只解决当前明确提出的问题，严禁为了“未来假想扩展”提前堆砌抽象层、中间件或配置项。
2. **加尔定律（Gall's Law）**：复杂的有效系统必然是从简单的有效系统演化而来的。优先以最小侵入、最直接的代码起步，靠真实摩擦力驱动演进，而非空想架构。
3. **KISS 原则**：保持代码结构直观紧凑，追求最低认知负荷。如果 20 行直接逻辑能解决，坚决不新建工厂与策略类。
4. **把关 Non-goals**：方案把关的重点在于做减法，审查并剔除不必要的复杂度与假想需求。
5. **可测试性优先**：衡量方案好坏的标准是可测试性与改动成本，而非架构模式的复杂度。

## 启动

1. 若无 active task：加载 `dsh-trellis-sun-start`，**先征得用户同意**再建任务。建任务用内置工具
   **`dsh_trellis_sun_task_create`**（`workType=feat`，自动写 `.trellis/tasks/<slug>/task.json`
   （status=planning）、播种 `prd.md` 等产物模板、并**同步写 `.trellis/.runtime/sessions/`
   的 `current_task`**，面包屑/阶段/Web 徽标立即生效；不要手动写 session 文件）。
   slug 必须为 `<work-type>-<mm-dd>-<短名>`，如 `feat-01-15-xxx`；工具会自动校验/推导。
2. 若有 active task：用 `dsh_trellis_sun_state` 或读 `.trellis/.runtime/sessions/*.json` 的
   `current_task` 恢复；也可加载 `dsh-trellis-sun-continue`。
3. 更新阶段或状态使用内置工具 **`dsh_trellis_sun_task_update`**（如 `status=in_progress, stage=impl`；自动校验轨道并刷新 Web 徽标）：
   ```json
   "work": { "type": "feat", "mode": "standard", "stage": "prd", "execution_lane": "standard" }
   ```
4. 从 task 目录**产物事实**恢复 stage（优先于聊天历史与参数）。

## 模板初始化（首次使用）

若 `.trellis/templates/feat/` 不存在，把本技能资源目录的 `_templates/feat/*`（`prd.md` / `design.md` /
`spec-delta.md` / `review.md`）复制过去，并把 `_templates/work-types.md` 复制到
`.trellis/templates/work-types.md`。已存在则跳过。

## 参数意图（可选）

| 信号 | 含义 |
|------|------|
| `--mode quick` / 小改 / 流程太重且确实局部 | `execution_lane=quick` |
| `--mode standard` | `execution_lane=standard` |
| `--stage design|impl|review|check` | 偏好阶段（仍以产物为准） |

## Lane 选择

```text
quickEligible 需同时满足：
- 需求与验收行为明确
- 改动局部且挂载点已知
- 复用既有公开契约，不新增/改变跨系统协议
- 验证入口已知
- 不涉及 ADR/迁移/权限安全/高风险数据语义

否则 standard。
epic/多交付物 → parent + child tasks（父任务管集成验收）。
```

用户反馈"太重/是小改"时：重新评估；满足 quick 则降级并写回 design/prd；不满足则逐条说明原因。

## 阶段机（仓库事实优先）

| 条件 | stage | 下一步 |
|------|-------|--------|
| 无/空 `prd.md` | prd | 写 prd（可 `dsh-trellis-sun-brainstorm`） |
| 有 prd；standard 且无 design 或 design.status≠approved | design | 写/改 `design.md`（聚焦需求拆解与实现方案，按 YAGNI/KISS 保持精简）**与 `spec-delta.md`**（本次改动对常驻 spec 的增量），**等人同时确认两者** |
| design 与 spec-delta 均 approved；planning 产物齐 + 人卡通过 | 规划期用 `dsh_trellis_sun_task_update` 录入 `steps`（含验收与 `verification`）；写 `task.json.status=in_progress` | 进入 impl |
| in_progress；代码未完成 | impl | `dsh-trellis-sun-before-dev` → 按 `task.json.steps` 逐步实现（可派实现子代理） |
| 实现完成；review 非 passed | review | **派独立子代理**按「证据型 code review」写 `review.md`；机械自修可另用 `dsh-trellis-sun-check` |
| review 过；check 未通过 | check | 派 `dsh-trellis-sun-check`，按项目配置的规范文件与质量门验证；将结果写入 `review.md` |
| check 通过 | finish | `dsh-trellis-sun-update-spec`（教训）→ 应用 `spec-delta`（归档时机械合并，见 finish-work）→ commit → `dsh-trellis-sun-finish-work` / archive |

**Quick 路径**：prd（可轻）→（可选极简 design）→ 写 `status=in_progress` → impl → check/review 精简 → finish。
仍禁止无验收标准就开写。Quick 不涉及常驻 spec 时，`spec-delta.md` 写「无增量：<原因>」并随 design 一起确认
（文件由播种生成，不留空、不删除）。若任务目录里根本没有 `spec-delta.md`（1.1.0 之前创建的任务），
按无增量收尾：不补写、不因此停下。

## design 阶段的图查询

写 `design.md` 与 `spec-delta.md` 之前先查图，把波及面写进 design，而不是凭印象列模块：

- `get_architecture`：看分层与模块骨架，确认改动该落在哪一层。
- `detect_changes`（`--scope impact`）/ `trace_path`：看改动上下游与受影响包，结论写进「涉及模块与边界」。
- 索引纪律、换参重试上限、旧 daemon 坑、Qt 仓库门禁与降级口径见 `_templates/graph-queries.md`。
- 图服务不可用时退回文本检索，并在 design 里写明「图服务不可用，改用文本检索」与未覆盖范围。

## spec-delta 与 update-spec 的区分

| | `spec-delta.md`（本技能 design 阶段） | `dsh-trellis-sun-update-spec`（收尾阶段） |
|---|---|---|
| 对象 | **改动本身**对常驻 spec 的增量 | 实施中复盘出的**教训与经验** |
| 时机 | 事前写、随 design 一起批准 | 事后判断，可结论为「无需更新」 |
| 落地 | 归档时由 finish-work **逐条机械合并** | 由 update-spec 判断归属后写入 |
| 禁止 | 编造增量、未批准就合并 | 把零碎业务实现当规范抄录 |

两者不互相替代：delta 负责「改动要改规范」，lesson 负责「踩过的坑要留档」。

## code review（证据型工作流）

review 阶段由**独立子代理**执行，按下面的证据型流程写 `review.md`：

1. **固定快照**：先 `git rev-parse HEAD` 记入 `review.md` 的「Diff 范围」；评审基于该快照的 `git diff`，不看工作区漂移状态。工作区有未提交改动时，先提交或在产物里标注「未纳入快照」。
2. **证据三要素**：每条发现必须给「文件:行号 + 引用原文 + 复现命令/输出」；三者缺一不能当证据，引用对不上就不能写成发现。
3. **证据不足降级表述**：只有间接线索的结论写「疑似 / 未验证」并说明缺什么证据；**不许把猜测写成发现**。
4. **增量复查**：上一轮之后只扫新增变化（`git diff <上轮快照>..HEAD`），不重扫全量；问题用稳定编号（R1、R2…）并保留历轮状态（open / fixed / wontfix）。
5. **多轮不收敛转人工**：同一问题连续 3 轮仍 blocking，或总轮次超过 3 轮仍不收敛，停下交人工裁决，不无限循环。

两级节奏：**开发中走小 review**（本阶段，管深，有 prd/design/spec-delta 上下文）；**版本冻结打板时另跑一次 OCR 大 review**（管广，跨模块一致性、规则型问题与残渣）——见 `_templates/work-types.md` 的「Review 节奏」。

## 人卡点（硬）

1. **design 与 spec-delta 未 approved**（standard）→ 禁止写 `status=in_progress`、禁止改业务代码。
2. **code review = blocking**（`review.md`）→ 禁止 archive；应回到 impl 修复后重审。
3. **`dsh-trellis-sun-check` 或任务要求的验证未通过** → 禁止宣称完成 / archive。
4. **spec-delta 未 approved 或核对失败** → 禁止合并进常驻 spec（见 `dsh-trellis-sun-finish-work`）。
5. 用户对 design 的确认必须是**本回合之后**的明确回复；创建 task ≠ 批准实现。

## 产物

从 `_templates/feat/` 复制（若 task 目录不存在；`dsh_trellis_sun_task_create` 会按目录通配播种）：

```text
prd.md
design.md
spec-delta.md
review.md
```

> 执行步骤清单不设独立文件：一律由 `task.json.steps` 承载（规划期录入、执行期单步推进）。
> 规划期写 `design.md` / `spec-delta.md` 必须走 `dsh_trellis_sun_artifact_update`（`write` 在只读守卫下不可用）。

## 子代理调度

| 阶段 | 子代理 | 写入 | 说明 |
|------|--------|------|------|
| impl | 实现子代理（可选） | 业务代码 | 按 prd/design 实现 |
| review | 独立子代理 | `review.md` | 独立代码审查（证据型，见上节） |
| 自修/验证 | `dsh-trellis-sun-check` | 可改代码 | 对照 spec 自修 + 项目验证门；与独立审查互补，不互相替代 |

调度要求：
1. dispatch prompt 必须以 `Active task: <task 目录路径>` 开头。
2. code-review **必须由主会话派发**，实现主会话不得"自己写个 review 冒充独立审查"。
3. reviewer 返回 `blocking` → 停在该 stage，修复后重派。

## 实现期规则

- 实现前：`dsh-trellis-sun-before-dev`（读项目 spec 与已评审产物）。
- 实现后：`dsh-trellis-sun-check`（对照 prd 验收 + 相关 spec）。
- 新约定：`dsh-trellis-sun-update-spec`，按 `.trellis/doc.json` 的 files/root 找到权威文档；无配置时按 root 默认目录，新增需注入文档同步 files。

## 退出

| 结果 | 动作 |
|------|------|
| NeedsHuman | 停在当前 stage，只提 1 个最高价值问题或等待确认 |
| Routed | 若实为 bug/重构 → 转 `dsh-trellis-sun-issue` / `dsh-trellis-sun-refactor` |
| Completed | review/check 通过、已 archive |

## 反模式

- 未批准 design 就写 `status=in_progress`
- 未批准 `spec-delta` 就合并进常驻 spec，或核对失败时「差不多」匹配
- 把猜测写成 review 发现，或拿工作区漂移状态当评审基线
- 为了“预留未来需求”引入不必要的抽象与接口（违背 YAGNI）
- Quick 名义下改跨模块契约
- 用实现细节充当验收标准，跳过 prd 验收
