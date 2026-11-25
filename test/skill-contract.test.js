import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(path.join(repoRoot, rel), 'utf8')

test('bootstrap contract covers migration, initialization, root metadata and files whitelist', () => {
  const text = read('skills/sun-trellis-spec-bootstrap/SKILL.md')
  assert.match(text, /迁移分支/)
  assert.match(text, /初始化分支/)
  assert.match(text, /\.trellis\/doc\.json/)
  assert.match(text, /files.*运行时注入白名单/)
  assert.match(text, /root.*Skill 元数据/)
  assert.match(text, /root.*不拼接.*files/s)
  assert.match(text, /不修改业务文档正文/)
})

test('development and verification consumers read the configured files whitelist', () => {
  for (const rel of ['skills/sun-trellis-before-dev/SKILL.md', 'skills/sun-trellis-check/SKILL.md']) {
    const text = read(rel)
    assert.match(text, /\.trellis\/doc\.json/, rel)
    assert.match(text, /files/, rel)
    assert.match(text, /无配置/, rel)
  }
})

test('update-spec routes to configured docs and requires files maintenance for new injected docs', () => {
  const text = read('skills/sun-trellis-update-spec/SKILL.md')
  assert.match(text, /优先更新已有权威文档/)
  assert.match(text, /新增需要注入的文档必须同步 files/)
  assert.match(text, /归属不明就问/)
  assert.match(text, /不静默写回旧目录/)
})

test('workflow skills and templates no longer present the legacy directory as the only quality gate', () => {
  const files = [
    'skills/sun-trellis-feat/SKILL.md',
    'skills/sun-trellis-refactor/SKILL.md',
    'skills/_templates/feat/design.md',
    'skills/_templates/feat/review.md',
    'skills/_templates/issue/fix-note.md',
    'skills/_templates/refactor/apply-notes.md',
    'skills/_templates/refactor/refactor-design.md',
    'skills/_templates/work-types.md',
  ]
  for (const rel of files) {
    const text = read(rel)
    assert.doesNotMatch(text, /按项目 `\.trellis\/spec\/` 质量门/, rel)
    assert.doesNotMatch(text, /写入 `\.trellis\/spec\/`（含 `decisions\/`）/, rel)
    assert.doesNotMatch(text, /严格遵循 `\.trellis\/spec\/` 声明的/, rel)
  }
})
test('skill path templates use $root instead of a hardcoded spec package root', () => {
  const files = [
    'skills/sun-trellis-spec-bootstrap/SKILL.md',
    'skills/sun-trellis-update-spec/SKILL.md',
    'skills/sun-trellis-before-dev/SKILL.md',
    'skills/sun-trellis-check/SKILL.md',
  ]
  for (const rel of files) {
    const text = read(rel)
    assert.doesNotMatch(text, /\.trellis\/spec\/<package>\/<layer>\//, rel)
    assert.match(text, /\$root\/<package>\/<layer>\//, rel)
  }
})
test('consumer skills do not retain a second hardcoded spec root', () => {
  const files = [
    'skills/sun-trellis-update-spec/SKILL.md',
    'skills/sun-trellis-before-dev/SKILL.md',
    'skills/sun-trellis-check/SKILL.md',
    'skills/sun-trellis-feat/SKILL.md',
    'skills/sun-trellis-refactor/SKILL.md',
    'skills/_templates/work-types.md',
    'skills/_templates/feat/review.md',
  ]
  for (const rel of files) {
    assert.doesNotMatch(read(rel), /\.trellis\/spec\//, rel)
  }
})
test('spec skills carry a complete and valid doc.json context', () => {
  for (const rel of [
    'skills/sun-trellis-spec-bootstrap/SKILL.md',
    'skills/sun-trellis-before-dev/SKILL.md',
    'skills/sun-trellis-check/SKILL.md',
    'skills/sun-trellis-update-spec/SKILL.md',
  ]) {
    const text = read(rel)
    assert.match(text, /\.trellis\/doc\.json/, rel)
    assert.match(text, /root/, rel)
    assert.match(text, /files/, rel)
    assert.match(text, /完整.*路径/, rel)
  }

  const before = read('skills/sun-trellis-before-dev/SKILL.md')
  assert.match(before, /读取顺序/)
  const update = read('skills/sun-trellis-update-spec/SKILL.md')
  assert.match(update, /读取与写入顺序/)
  assert.match(update, /docs\/guides\/index\.md/)

  const bootstrap = read('skills/sun-trellis-spec-bootstrap/SKILL.md')
  assert.doesNotMatch(bootstrap, /"files"\s*:\s*\[\s*"\$root\//)
  assert.ok(!bootstrap.includes('$root/`n'), 'directory tree must not contain a literal `n')
})

test('feat track wires spec-delta into the design gate and the archive merge', () => {
  const feat = read('skills/sun-trellis-feat/SKILL.md')
  assert.match(feat, /spec-delta\.md/, 'feat skill must name spec-delta.md')
  assert.match(feat, /design 与 spec-delta 均 approved/, 'the design gate must cover both artifacts')
  assert.match(feat, /无增量/, 'the empty-delta convention must be stated')
  assert.match(feat, /update-spec/, 'spec-delta must be distinguished from update-spec')
  assert.match(feat, /sun_trellis_artifact_update/, 'planning writes must route through the artifact tool')

  const finish = read('skills/sun-trellis-finish-work/SKILL.md')
  assert.match(finish, /应用 spec-delta/, 'finish-work must apply the delta')
  assert.match(finish, /逐字一致/, 'the merge must verify the old text verbatim')
  assert.match(finish, /禁止合并/, 'an unapproved delta must never be merged')
  assert.match(finish, /停下询问/, 'a failed check must stop and ask instead of merging silently')

  const types = read('skills/_templates/work-types.md')
  assert.match(types, /spec-delta\.md/, 'the feat stage table must list spec-delta.md')
})

test('check skill states scope, rule lookup, coverage and fail-closed', () => {
  const text = read('skills/sun-trellis-check/SKILL.md')
  assert.match(text, /第一步：定范围/, 'the scope step must be explicit')
  assert.match(text, /git diff --name-only/, 'the change set must come from git, not from memory')
  assert.match(text, /第二步：取规则/, 'rules must be resolved from paths')
  assert.match(text, /覆盖清单/, 'every changed file needs a verdict')
  assert.match(text, /fail-closed/, 'tool failures must be reported as errors')
  assert.match(text, /无适用规范/, 'unmatched paths must be labelled, not invented')
})

test('review stage carries the evidence-based workflow and the two-level cadence', () => {
  const feat = read('skills/sun-trellis-feat/SKILL.md')
  assert.match(feat, /证据型工作流/, 'the review stage must be evidence-based')
  assert.match(feat, /固定快照/, 'reviews must pin a git snapshot')
  assert.match(feat, /引用原文/, 'findings must quote the source text')
  assert.match(feat, /疑似/, 'weak evidence must be downgraded, not asserted')
  assert.match(feat, /3 轮/, 'non-convergence must escalate to a human')

  const types = read('skills/_templates/work-types.md')
  assert.match(types, /Review 节奏/, 'the two-level cadence must be documented')
  assert.match(types, /delegate/, 'OCR must run in delegate mode (no code exfiltration)')
})

test('graph queries are an external dependency with an explicit degradation path', () => {
  const doc = read('skills/_templates/graph-queries.md')
  assert.match(doc, /外部依赖/, 'the graph service must be declared external')
  assert.match(doc, /索引纪律/)
  assert.match(doc, /cbm-mcp-preflight/, 'the stale-daemon trap must be documented')
  assert.match(doc, /换参重试 2 次/, 'retry budget must be bounded')
  assert.match(doc, /降级/, 'there must be a degradation path')
  assert.match(doc, /Qt/, 'the Qt precision gate must be documented')

  for (const rel of [
    'skills/sun-trellis-feat/SKILL.md',
    'skills/sun-trellis-before-dev/SKILL.md',
    'skills/sun-trellis-check/SKILL.md',
  ]) {
    assert.match(read(rel), /_templates\/graph-queries\.md/, `${rel} must point at the shared protocol`)
  }
})
