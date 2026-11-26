# Feature Code Review

status: missing   # missing | passed | blocking
snapshot: (git rev-parse HEAD，评审基于该快照)
base: (任务起点提交)
round: 1   # 增量复查轮次；只扫上一轮快照之后的新增变化

## Diff 范围

- 快照：`<sha>`
- base：`<sha>`
- 改动文件（`git diff --name-only <base>...<snapshot>` 与 `git status --porcelain` 的并集）：
  -

## 覆盖清单（改动集里每个文件都要有结论）

| 文件 | 结论 | 依据 |
|------|------|------|
| | 通过 / 有问题 / 无适用规范 | |

## 发现

| 编号 | 级别 | 问题 | 文件:行号 | 引用原文 | 证据（命令/输出） | 状态 |
|------|------|------|-----------|----------|------------------|------|
| R1 | | | | | | open |

- 证据三要素（文件:行号 + 引用原文 + 复现命令/输出）缺一不可；证据不足的结论写「疑似 / 未验证」，**不许把猜测写成发现**。

## 验证证据

- `dsh-trellis-sun-check`：
- 项目质量门（编译/测试/运行验证，按项目配置的规范文件（`.trellis/doc.json` 的 files；无配置时使用 root 默认目录））：

## 结论

- [ ] 通过（含 `dsh-trellis-sun-check` 与任务要求的验证）
- [ ] 需修复后重审
- 历轮状态（编号稳定，保留 open / fixed / wontfix；同一问题连续 3 轮 blocking 或总轮次超过 3 轮 → 转人工）：
