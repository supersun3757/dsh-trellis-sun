import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ALLOWED_ARTIFACTS, CURRENT_ARTIFACTS, LEGACY_ARTIFACTS } from '../lib/artifact.js'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(path.join(repoRoot, rel), 'utf8')

test('bootstrap contract covers migration, initialization, root metadata and files whitelist', () => {
  const text = read('skills/dsh-trellis-sun-spec-bootstrap/SKILL.md')
  assert.match(text, /迁移分支/)
  assert.match(text, /初始化分支/)
  assert.match(text, /\.trellis\/doc\.json/)
  assert.match(text, /files.*运行时注入白名单/)
  assert.match(text, /root.*Skill 元数据/)
  assert.match(text, /root.*不拼接.*files/s)
  assert.match(text, /不修改业务文档正文/)
})

test('development and verification consumers read the configured files whitelist', () => {
  for (const rel of ['skills/dsh-trellis-sun-before-dev/SKILL.md', 'skills/dsh-trellis-sun-check/SKILL.md']) {
    const text = read(rel)
    assert.match(text, /\.trellis\/doc\.json/, rel)
    assert.match(text, /files/, rel)
    assert.match(text, /无配置/, rel)
  }
})

test('update-spec routes to configured docs and requires files maintenance for new injected docs', () => {
  const text = read('skills/dsh-trellis-sun-update-spec/SKILL.md')
  assert.match(text, /优先更新已有权威文档/)
  assert.match(text, /新增需要注入的文档必须同步 files/)
  assert.match(text, /归属不明就问/)
  assert.match(text, /不静默写回旧目录/)
})

test('workflow skills and templates no longer present the legacy directory as the only quality gate', () => {
  const files = [
    'skills/dsh-trellis-sun-feat/SKILL.md',
    'skills/dsh-trellis-sun-refactor/SKILL.md',
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
    'skills/dsh-trellis-sun-spec-bootstrap/SKILL.md',
    'skills/dsh-trellis-sun-update-spec/SKILL.md',
    'skills/dsh-trellis-sun-before-dev/SKILL.md',
    'skills/dsh-trellis-sun-check/SKILL.md',
  ]
  for (const rel of files) {
    const text = read(rel)
    assert.doesNotMatch(text, /\.trellis\/spec\/<package>\/<layer>\//, rel)
    assert.match(text, /\$root\/<package>\/<layer>\//, rel)
  }
})
test('consumer skills do not retain a second hardcoded spec root', () => {
  const files = [
    'skills/dsh-trellis-sun-update-spec/SKILL.md',
    'skills/dsh-trellis-sun-before-dev/SKILL.md',
    'skills/dsh-trellis-sun-check/SKILL.md',
    'skills/dsh-trellis-sun-feat/SKILL.md',
    'skills/dsh-trellis-sun-refactor/SKILL.md',
    'skills/_templates/work-types.md',
    'skills/_templates/feat/review.md',
  ]
  for (const rel of files) {
    assert.doesNotMatch(read(rel), /\.trellis\/spec\//, rel)
  }
})
test('spec skills carry a complete and valid doc.json context', () => {
  for (const rel of [
    'skills/dsh-trellis-sun-spec-bootstrap/SKILL.md',
    'skills/dsh-trellis-sun-before-dev/SKILL.md',
    'skills/dsh-trellis-sun-check/SKILL.md',
    'skills/dsh-trellis-sun-update-spec/SKILL.md',
  ]) {
    const text = read(rel)
    assert.match(text, /\.trellis\/doc\.json/, rel)
    assert.match(text, /root/, rel)
    assert.match(text, /files/, rel)
    assert.match(text, /完整.*路径/, rel)
  }

  const before = read('skills/dsh-trellis-sun-before-dev/SKILL.md')
  assert.match(before, /读取顺序/)
  const update = read('skills/dsh-trellis-sun-update-spec/SKILL.md')
  assert.match(update, /读取与写入顺序/)
  assert.match(update, /docs\/guides\/index\.md/)

  const bootstrap = read('skills/dsh-trellis-sun-spec-bootstrap/SKILL.md')
  assert.doesNotMatch(bootstrap, /"files"\s*:\s*\[\s*"\$root\//)
  assert.ok(!bootstrap.includes('$root/`n'), 'directory tree must not contain a literal `n')
})

test('feat track wires spec-delta into the design gate and the archive merge', () => {
  const feat = read('skills/dsh-trellis-sun-feat/SKILL.md')
  assert.match(feat, /spec-delta\.md/, 'feat skill must name spec-delta.md')
  assert.match(feat, /design 与 spec-delta 均 approved/, 'the design gate must cover both artifacts')
  assert.match(feat, /无增量/, 'the empty-delta convention must be stated')
  assert.match(feat, /update-spec/, 'spec-delta must be distinguished from update-spec')
  assert.match(feat, /dsh_trellis_sun_artifact_update/, 'planning writes must route through the artifact tool')

  const finish = read('skills/dsh-trellis-sun-finish-work/SKILL.md')
  assert.match(finish, /应用 spec-delta/, 'finish-work must apply the delta')
  assert.match(finish, /逐字一致/, 'the merge must verify the old text verbatim')
  assert.match(finish, /禁止合并/, 'an unapproved delta must never be merged')
  assert.match(finish, /停下询问/, 'a failed check must stop and ask instead of merging silently')

  // Upgrade continuity: tasks created before the template existed have no
  // delta at all. If step 0 only said "status must be approved", every legacy
  // task would stall at finish. The missing-file branch must be explicit.
  assert.match(finish, /视为无增量，直接继续收尾/, 'a missing delta must not block finish')
  assert.match(finish, /文件不存在不算未批准/, 'the hard gate must not read "missing" as "unapproved"')
  assert.match(feat, /按无增量收尾/, 'the quick path must cover a task with no delta file')

  const types = read('skills/_templates/work-types.md')
  assert.match(types, /spec-delta\.md/, 'the feat stage table must list spec-delta.md')
  assert.match(types, /没有 delta 文件/, 'the stage table must state the missing-file branch')
})

test('check skill states scope, rule lookup, coverage and fail-closed', () => {
  const text = read('skills/dsh-trellis-sun-check/SKILL.md')
  assert.match(text, /第一步：定范围/, 'the scope step must be explicit')
  assert.match(text, /git diff --name-only/, 'the change set must come from git, not from memory')
  assert.match(text, /第二步：取规则/, 'rules must be resolved from paths')
  assert.match(text, /覆盖清单/, 'every changed file needs a verdict')
  assert.match(text, /fail-closed/, 'tool failures must be reported as errors')
  assert.match(text, /无适用规范/, 'unmatched paths must be labelled, not invented')
})

test('review stage carries the evidence-based workflow and the two-level cadence', () => {
  const feat = read('skills/dsh-trellis-sun-feat/SKILL.md')
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
  assert.match(doc, /daemon/, 'the stale-daemon trap must be documented')
  assert.match(doc, /indexed_at/, 'the write self-check must be observable, not a fake probe')
  assert.match(doc, /DACL/, 'the Windows environment prerequisite must be documented')
  assert.doesNotMatch(doc, /cbm-mcp-preflight/, 'do not cite a probe binary that does not exist')
  assert.match(doc, /换参重试 2 次/, 'retry budget must be bounded')
  assert.match(doc, /降级/, 'there must be a degradation path')
  assert.match(doc, /Qt/, 'the Qt precision gate must be documented')
  assert.match(doc, /detect_changes/, 'impact analysis is detect_changes, not a tool named impact')
  assert.doesNotMatch(doc, /`impact`/, 'there is no tool named impact')
  assert.match(doc, /dsh-mcp-client/, 'the connection method must be the built-in MCP client')
  assert.match(doc, /已证否/, 'the disproved third-party bridge must be recorded as a dead end')

  for (const rel of [
    'skills/dsh-trellis-sun-feat/SKILL.md',
    'skills/dsh-trellis-sun-before-dev/SKILL.md',
    'skills/dsh-trellis-sun-check/SKILL.md',
  ]) {
    assert.match(read(rel), /_templates\/graph-queries\.md/, `${rel} must point at the shared protocol`)
  }
})

test('the artifact whitelist separates current outputs from retired compatibility names', () => {
  const templateNames = new Set(
    ['feat', 'issue', 'refactor'].flatMap((type) =>
      readdirSync(path.join(repoRoot, 'skills', '_templates', type)),
    ),
  )

  // Every advertised name must ship a template. Advertising one that seeding
  // prunes makes the write a dead end instead of an error (the M1 defect).
  for (const name of CURRENT_ARTIFACTS) {
    assert.ok(templateNames.has(name), `${name} is advertised but ships no template`)
  }

  // Retired names must not ship a template, yet must stay writable: historical
  // tasks under tasks/ still hold them (feat-09-06 boundary clause).
  for (const name of LEGACY_ARTIFACTS) {
    assert.ok(!templateNames.has(name), `${name} is retired but still ships a template`)
    assert.ok(!CURRENT_ARTIFACTS.has(name), `${name} must not be advertised as a current output`)
    assert.ok(ALLOWED_ARTIFACTS.has(name), `${name} must stay writable for historical tasks`)
  }

  assert.deepEqual(
    [...ALLOWED_ARTIFACTS].sort(),
    [...CURRENT_ARTIFACTS, ...LEGACY_ARTIFACTS].sort(),
    'the sandbox must accept exactly the current outputs plus the retired names',
  )
})

test('the doc review protocol defines both tiers and the shared evidence rule', () => {
  const doc = read('skills/_templates/doc-review.md')

  // Stable ids: the exit checklist is reconciled id by id, so a renumbering or
  // a dropped dimension must turn this test red rather than silently shrinking
  // the checklist.
  for (const id of ['S1', 'S2', 'S3', 'S4']) {
    assert.match(doc, new RegExp(`\\b${id}\\b`), `the light tier must define ${id}`)
  }
  for (const id of ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']) {
    assert.match(doc, new RegExp(`\\b${id}\\b`), `the heavy tier must define ${id}`)
  }

  // Both tiers must state a severity per dimension: a checklist item without a
  // default level cannot be reconciled as pass/fail at exit time. The heavy
  // table was missing the column once (R1) while this test stayed green, so the
  // column is asserted here rather than left to the reviewer's eye.
  const dimensionHeader = doc.split('\n').find((line) => line.includes('维度') && line.includes('怎么查'))
  assert.ok(dimensionHeader, 'the heavy tier must carry a dimension table')
  assert.match(dimensionHeader, /级别/, 'the dimension table must carry a severity column')
  const lightHeader = doc.split('\n').find((line) => line.includes('查什么') && line.includes('怎么查') && !line.includes('维度'))
  assert.ok(lightHeader, 'the light tier must carry a dimension table')
  assert.match(lightHeader, /级别/, 'the light dimension table must carry a severity column')

  // Checking the header alone still lets a row ship with an empty level cell
  // (N1), which is the same "assertion narrower than the criterion" defect as
  // R1 one level down. Read the rows: each one's last cell must open with P1..P3.
  for (const [prefix, expected] of [['D', 7], ['S', 4]]) {
    const rows = doc.split('\n').filter((line) => new RegExp(`^\\| \\*\\*${prefix}\\d\\*\\*`).test(line))
    assert.equal(rows.length, expected, `the ${prefix} tier must define exactly ${prefix}1–${prefix}${expected} rows`)
    for (const row of rows) {
      const cells = row.split('|').map((cell) => cell.trim()).filter(Boolean)
      const level = cells[cells.length - 1]
      assert.match(level, /^P[123]/, `every ${prefix} row must state its level (P1/P2/P3): ${row.slice(0, 40)}`)
    }
  }

  // The evidence triple is what separates a finding from an opinion.
  assert.match(doc, /位置/, 'a finding must carry a location')
  assert.match(doc, /逐字/, 'a finding must quote the source verbatim')
  assert.match(doc, /依据/, 'a finding must carry checkable evidence')
  assert.match(doc, /没有引用的意见直接删掉/, 'an uncited opinion is not a finding')

  // Tiers must stay distinguishable, and the light one must name its carrier.
  assert.match(doc, /小审/, 'the light tier must be named')
  assert.match(doc, /大审/, 'the heavy tier must be named')
  assert.match(doc, /\.trellis\/reviews\//, 'the heavy tier must name its report location')
  assert.match(doc, /draft/, 'the heavy report must be a draft until confirmed')
  assert.match(doc, /confirmed/, 'the draft must have a settling state')
})

test('the light doc review lands in existing artifacts instead of a new one', () => {
  // A new artifact would drag in the whitelist, seeding, both contract tiers and
  // the task-engine spec. The light tier is a section, and this pins that.
  assert.equal(CURRENT_ARTIFACTS.size, 10, 'the light tier must not add an artifact name')
  assert.equal(ALLOWED_ARTIFACTS.has('doc-review.md'), false, 'doc-review.md must not become a task artifact')

  const review = read('skills/_templates/feat/review.md')
  assert.match(review, /文档审查/, 'the feat review artifact must carry the doc-review section')
  for (const id of ['S1', 'S2', 'S3', 'S4']) {
    assert.match(review, new RegExp(`\\b${id}\\b`), `the review artifact must expose ${id}`)
  }

  const feat = read('skills/dsh-trellis-sun-feat/SKILL.md')
  assert.match(feat, /文档审查/, 'the feat skill must point at the doc-review section')
  assert.match(feat, /小审/, 'the feat skill must run the light tier')
  assert.match(feat, /_templates\/doc-review\.md/, 'the feat skill must cite the shared protocol')

  // The check matrix owns the light tier's settling gate and must state the
  // boundary against its own PRD-acceptance row, or both rows get run twice.
  const check = read('skills/dsh-trellis-sun-check/SKILL.md')
  assert.match(check, /文档审查落定/, 'check must settle the doc review')
  assert.match(check, /可测/, 'check must state the S3 boundary')
  assert.match(check, /_templates\/doc-review\.md/, 'check must cite the shared protocol')

  for (const rel of ['skills/dsh-trellis-sun-issue/SKILL.md', 'skills/dsh-trellis-sun-refactor/SKILL.md']) {
    assert.match(read(rel), /_templates\/doc-review\.md/, `${rel} must cite the shared protocol`)
  }
})

test('the heavy doc review is a standalone skill that touches neither the docs nor a gate', () => {
  const skill = read('skills/dsh-trellis-sun-doc-review/SKILL.md')

  assert.match(skill, /\.trellis\/reviews\//, 'the report location must be explicit')
  assert.match(skill, /status: draft/, 'the report must open as a draft')
  assert.match(skill, /confirmed/, 'a human or check must be able to settle it')
  assert.match(skill, /不修改被审文档正文/, 'the reviewer must never edit the reviewed docs')
  assert.match(skill, /不卡任何门禁/, 'the heavy tier must not gate anything')
  assert.match(skill, /覆盖图/, 'a coverage map must exist or the review is incomplete')
  assert.match(skill, /自证伪/, 'P1 findings must survive an attempt to refute them')
  assert.match(skill, /不许.*编造|禁止编造|编造/, 'invention must be forbidden')
  assert.match(skill, /doc-review\.md/, 'the skill must defer its dimensions to the shared protocol')
  // The big review's first real run found this one the hard way: the skill cited
  // a scanner (`scanSpecTree`) that does not exist. Pin the real symbol.
  assert.match(skill, /listProjectSpecs/, 'the legacy scope fallback must name the real scanner')
  assert.doesNotMatch(skill, /scanSpecTree/, 'do not cite a scanner that does not exist')
})

test('the protocol records its sources and the approaches deliberately not adopted', () => {
  const doc = read('skills/_templates/doc-review.md')

  assert.match(doc, /github\.com\/zircote-plugins\/documentation-review/, 'source 1 must be cited')
  assert.match(doc, /github\.com\/NeonSparklex\/dsh-report-reviewer-zh-Hans/, 'source 2 must be cited')
  assert.match(doc, /不采用/, 'the rejected approaches must be listed, not implied')
  assert.match(doc, /机械一致性/, 'doc-guard scope must be excluded explicitly')
  assert.match(doc, /canon-keeper/, 'canon-keeper scope must be excluded explicitly')
  assert.match(doc, /评审团/, 'the multi-vendor panel must be excluded explicitly')
  assert.match(doc, /批注/, 'annotation UI must be excluded explicitly')
  assert.match(doc, /OCR/, 'the PDF/OCR pipeline must be excluded explicitly')
})

test('work-types wires both tiers into the review cadence', () => {
  const types = read('skills/_templates/work-types.md')
  assert.match(types, /文档审查节奏/, 'the doc cadence must be a first-class section')
  assert.match(types, /S1–S4/, 'the light tier must be listed')
  assert.match(types, /D1–D7/, 'the heavy tier must be listed')
  assert.match(types, /不卡任何门禁/, 'the heavy tier must not gate')
  assert.match(types, /_templates\/doc-review\.md/, 'the cadence must cite the shared protocol')
})
