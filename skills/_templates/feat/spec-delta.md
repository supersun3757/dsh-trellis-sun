# Spec Delta

status: draft   # draft | approved（与 design.md 同一套批准标记，owner 批准后才进 impl）

> 本文件记录**本次改动本身对常驻 spec 的增量**：事前写好、随 design 一起评审、归档时机械合并。
> 它与 `sun-trellis-update-spec` 不是一回事——那里沉淀的是实施中复盘出的教训（事后判断），
> 这里是改动的契约增量（事前提案）。
>
> 硬规则：
> - 目标文件必须是 `.trellis/doc.json` 的 `files` 列表里的文件，或 `$root` 文档下的文件；不要指向任务目录内的产物。
> - `MODIFIED` / `REMOVED` 的旧文本必须与目标文件**当前内容逐字一致**（含空白与标点）。
> - 无增量时不要留空：写「无增量：<原因>」，并同样走批准。
> - 规划期写入本文件必须走 `sun_trellis_artifact_update`（`write` 在只读守卫下不可用）。

## ADDED

### A1
- 目标文件：
- 章节定位：（父章节标题 / 插入位置）
- 新文本：
```text

```
- 依据：（对应本任务的哪个验收项或改动）

## MODIFIED

### M1
- 目标文件：
- 章节定位：
- 旧文本：（必须与目标文件当前内容逐字一致）
```text

```
- 新文本：
```text

```

## REMOVED

### R1
- 目标文件：
- 章节定位：
- 旧文本：（必须与目标文件当前内容逐字一致）
```text

```

## 合并记录（由 `sun-trellis-finish-work` 归档时填写，实施者不要预填）

| 条目 | 结果 | 说明 |
|------|------|------|
| | applied / skipped / failed | |
