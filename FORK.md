# sun-Trellis — 与上游的差异

- **上游**：`@banana-peeljj12/dsh-trellis` v0.5.1（[1264459640/dsh-trellis](https://github.com/1264459640/dsh-trellis)）
- **本仓库**：`dsh-trellis-sun`（[supersun3757/dsh-trellis-sun](https://github.com/supersun3757/dsh-trellis-sun)）

取 banana 为主线的原因：它是按 DSH 原生机制（loader 条目、pre-step 钩子、`configForms`、`dsh-skill-filesystem`）重写的一版，对现版本 DSH 的对接面最完整；上游 0.2.0-rc.2 的基线需要抬到 0.2.2-rc.5。

本文只记录**分叉后**的改动；分叉前的历史见 `CHANGELOG.md` 与上游仓库。

## 1. 对齐 DSH 0.2.2-rc.5 / Cordis 4.1.0

| 项 | 上游 (v0.5.1) | 本仓库 |
| --- | --- | --- |
| `devDependencies` | `@deepseek-ai/dsh-*` 0.2.0-rc.2 | 0.2.2-rc.5 |
| Cordis | 隐含 4.0.x | 4.1.0（显式 devDep） |
| `peerDependencies` | 未声明 DSH（隐式为基线） | 显式 `>=0.2.2-rc.5 <0.3.0-0` |
| `engines` | 无 `dsh` 字段 | `dsh: ">=0.2.2-rc.5 <0.3.0-0"` + `node: ">=20"` |
| Schemastery | 3.18.4 | 3.19.0 |
| `peerDependenciesMeta` | 仅 `dsh-settings` optional | 8 条全部 optional（宿主提供） |

**唯一一处 breaking change**：Cordis 4.1.0 的 `waterfall` 改写了尾参语义——fallback 不再收到
dispatch 参数，而是被裸调用。`test/doc-config-route.test.js` 里的 6 处
`(base) => base` 因此恒返回 `undefined`，改为 `() => ({ tools: [], sections: [] })`。
生产代码不受影响（同一文件里 `test/assemble.test.js` 原本就是正确写法）。

**peer 全部标记 optional**：DSH 的 `@deepseek-ai/*` 由运行时宿主提供，profile 里通常
`autoInstallPeers: false`，因此上游那 8 条非 optional 的 peer 声明会让每次
`pnpm install` 都报一屏 `missing peer`。平台侧同类插件（`dsh-trellis` 0.1.25）把 peers
全标 optional 就是为了这个。实测：标完之后 `pnpm peers check` 输出
`No peer dependency issues found`。

证据：整套 317 个测试在 0.2.2-rc.5 / Cordis 4.1.0 上全绿。

## 2. 身份

| 面 | 上游 | 本仓库 |
| --- | --- | --- |
| 包名 | `@banana-peeljj12/dsh-trellis` | `dsh-trellis-sun` |
| 内置技能（15） | `trellis-start` … `trellis-refactor` | `sun-trellis-start` … `sun-trellis-refactor` |
| 内置工具（7） | `trellis_state`、`trellis_task_create` 等 | `sun_trellis_state`、`sun_trellis_task_create` 等 |
| CLI | `trellis-install` | `sun-trellis-install` |
| 仓库 | `1264459640/dsh-trellis` | `supersun3757/dsh-trellis-sun` |

**技能前缀不只是换个名字**：`lib/skills.js` 的 `ensureProjectSkills` 在版本变化时会
**覆盖**它负责的技能目录。上游用 `trellis-*` 命名，一旦项目里已经有真正的 Trellis
技能（`.agents/skills/trellis-*`），升级就会把它们替换成本插件的重写版。改成
`sun-trellis-*` 之后两套技能可以并存，各自的目录互不相干。

**刻意不改**的部分：

- loader 条目 id `trellis-workflow` —— 它同时是设置命名空间，改名会让已保存的配置失联；
- `.trellis/` 协议目录、`.trellis/doc.json`、`trellis:spec-index` 等 section 标记 —— 这些是和真实 Trellis 共用的协议面；
- 任务名 `trellis-right-phase-panel`、上游 CHANGELOG / 审计文档里的历史包名与旧工具名 —— 历史记录不重写。

## 3. 不做的部分

- **不引入子智能体机制，不做 `trellis_wait`**。该工具属于平台侧的 `dsh-trellis`
  （SajoLuo）插件；sun-Trellis 保持为单会话工作流层，不与它抢同一件事。
- 不 vendor 任何 Trellis AGPL 代码：工作流语义是重写的，本仓库保持 MIT。
