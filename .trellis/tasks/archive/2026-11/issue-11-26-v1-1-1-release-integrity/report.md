# Issue Report

## 现象

v1.1.0 交付后做了一轮独立审计，发现四处「改了但送不到 / 写了但跑不起来」的缺陷：

1. **版本标记把修复挡在门外**：`d26cb1c` 修改了 `skills/sun-trellis-finish-work/SKILL.md`、
   `skills/sun-trellis-feat/SKILL.md`、`skills/_templates/work-types.md`，但 **没有抬
   `package.json` 版本**（仍是 `1.1.0`）。播种按 `isUpgrade = installedVersion !== PACKAGE_VERSION`
   判定，已播种到 `.trellis-version = 1.1.0` 的项目永远走 `present.push` 跳过分支，
   收不到「无 `spec-delta.md` 也继续收尾」这个修复。
2. **没有强制重播种入口**：`scripts/install.mjs` 从未调用 `ensureProjectSkills`，
   也没有 `--force` / `--reseed` 之类开关。唯一的自救办法是手工删除项目的
   `.agents/skills/.trellis-version`。
3. **大 review 只有名字，没有可执行定义**：`skills/_templates/work-types.md` 的
   「Review 节奏」只写「OCR（`@alibaba-group/open-code-review`）全量扫，`delegate` 模式」，
   没有入口检查、没有调用命令、没有产物契约，也没有 `graph-queries.md` 那种降级口径；
   本机 `ocr` / `open-code-review` 均 `NOT FOUND`。
4. **记录缺口**：`aeabf38` 的安装器修复与 4 个测试**没有任何 CHANGELOG 条目**（v1.1.0 条目写于该修复之前），
   于是 HEAD 实测 333 而文档停在 329；`CHANGELOG.md` 也不在 `files` 白名单里
   （`FORK.md`、两个 README 都在），`npm pack` 54 个文件不含它。

## 复现步骤

1. 抬版本前后各跑一次播种，观察是否覆写技能正文：

   ```powershell
   node -e "import('./lib/skills.js').then(async (m) => {
     const fs = await import('node:fs')
     // 项目已有 .trellis-version=1.1.0 且技能文本为旧版
   })"
   ```

   实际：`isUpgrade === false` → 15 个技能目录全部进 `present`，一个 `updated` 都没有。

2. 想手工触发重播种：

   ```powershell
   node scripts/install.mjs --reseed
   ```

   实际：`未知参数: --reseed`，随后打印帮助并退出（`parseArgs` 的 default 分支）。

3. 查 OCR 是否可用：

   ```powershell
   Get-Command ocr, open-code-review
   ```

   实际：两者都 `NOT FOUND`；skill 文本没有给出缺失时的降级口径。

## 期望 vs 实际

| 项 | 期望 | 实际 |
|---|---|---|
| 技能文本修复 | 装了 1.1.0 的项目下次运行即拿到 | 版本号没动 → 永远拿不到 |
| 重播种 | 安装器提供显式入口（含 dry-run） | 无入口，只能删 marker 文件 |
| 大 review | 给出可执行定义 + 缺工具时的降级 | 只给出一个工具名 |
| 记录 | HEAD 的测试数与安装器修复都有条目可追 | 333 与安装器修复无条目（文档停在 329）；`CHANGELOG.md` 不进包 |

## 影响范围

- 影响「升级衔接」这条主线：缺陷 1 让 `d26cb1c` 的保护对**存量项目**完全失效——
  而存量项目正是该修复唯一的目标人群（本仓库 18/18 个在飞任务 `work.type` 为空）。
- 不影响新建任务路径（新项目播种直接写入 1.1.0 文本）。
- 缺陷 2/3 是运维与流程可执行性问题，不改变已通过的 333 项测试。

## 证据

- `lib/skills.js:168` `const isUpgrade = force || (installedVersion !== PACKAGE_VERSION)`；
  `:186-189` 同版本走 `present.push` 跳过。
- `package.json:3` `"version": "1.1.0"`；`git show --stat d26cb1c` 含 `skills/**` 不含 `package.json`。
- `scripts/install.mjs:108-111` 未知参数 → 打印帮助；`install.mjs` 全文无 `ensureProjectSkills`。
- `skills/_templates/work-types.md:55`、`:58`。
- `node --test`：`# tests 333 / # pass 333 / # fail 0`；`npm pack --dry-run` 的文件清单无 `CHANGELOG.md`。
- `v1.1.0` tag 指向 `d26cb1c`，main 在 `aeabf38`（安装器 YAML 转义修复不在 tag 内）。
