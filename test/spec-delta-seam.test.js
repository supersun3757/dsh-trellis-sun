/**
 * Seam test for the feat `spec-delta` track (issue #1).
 *
 * The delta is authored **inside the read-only planning window**, where the
 * generic `write` tool is masked and `sun_trellis_artifact_update` is the only
 * writable channel. This test pins the three seams that make that work:
 *
 *   1. authorization: planning trims `write` but keeps the artifact tool;
 *   2. authoring: the seeded `spec-delta.md` is whitelisted and writable;
 *   3. lifecycle: the delta survives the archive move so finish-work can fill
 *      in the merge record before the task dir is archived.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, statSync, readdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { createTaskRecord } from '../lib/task.js'
import { ALLOWED_ARTIFACTS, updateTaskArtifact } from '../lib/artifact.js'
import { archiveTaskRecord } from '../lib/archive.js'
import { ensureProjectSkills } from '../lib/skills.js'
import { PLANNING_TRIM, restrictDenyFor } from '../lib/readonly.js'
import { stagePhase } from '../lib/state.js'

function mockFs(root) {
  const target = (p) => ({ targetKey: path.resolve(p), displayPath: p })
  return {
    async resolve(p) {
      return target(p)
    },
    async stat(t) {
      try {
        const s = statSync(t.targetKey)
        return s.isFile() ? { type: 'file' } : s.isDirectory() ? { type: 'dir' } : { type: 'other' }
      } catch {
        return undefined
      }
    },
    async readText(t) {
      return readFileSync(t.targetKey, 'utf8')
    },
    async listDir(t) {
      return readdirSync(t.targetKey, { withFileTypes: true }).map((entry) => ({
        name: entry.name,
        target: target(path.join(t.targetKey, entry.name)),
      }))
    },
    async writeText(t, content) {
      mkdirSync(path.dirname(t.targetKey), { recursive: true })
      writeFileSync(t.targetKey, content)
    },
  }
}

test('seam 1 — planning keeps the artifact channel open and closes write', () => {
  assert.equal(stagePhase('feat', 'design'), 'planning', 'design must stay read-only')
  const deny = restrictDenyFor('planning')
  assert.ok(deny.includes('write'), 'planning must deny write')
  assert.ok(deny.includes('edit'), 'planning must deny edit')
  assert.ok(!deny.includes('sun_trellis_artifact_update'), 'planning must keep the artifact tool')
  assert.ok(PLANNING_TRIM instanceof Set)
  assert.ok(ALLOWED_ARTIFACTS.has('spec-delta.md'), 'the artifact whitelist must accept spec-delta.md')
})

test('seam 2 — a feat task seeds spec-delta.md and it is authored through the artifact tool', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'trellis-seam-author-'))
  try {
    const fs = mockFs(root)
    const slug = 'feat-11-25-spec-delta-seam'
    const created = await createTaskRecord(fs, root, { title: 'Spec delta seam', workType: 'feat', slug })
    assert.equal(created.ok, true)
    assert.ok(created.seeded.includes('spec-delta.md'))

    const deltaPath = path.join(root, '.trellis', 'tasks', slug, 'spec-delta.md')
    // Seeded as a draft — the design gate must not see it as approved.
    assert.match(readFileSync(deltaPath, 'utf8'), /^status: draft/m)

    const body = [
      '# Spec Delta',
      '',
      'status: approved',
      '',
      '## ADDED',
      '',
      '### A1',
      '- 目标文件：docs/guides/testing.md',
      '- 章节定位：## 质量门',
      '- 新文本：',
      '```text',
      '新增一条质量门说明。',
      '```',
      '',
      '## 合并记录（由 `sun-trellis-finish-work` 归档时填写，实施者不要预填）',
      '',
      '| 条目 | 结果 | 说明 |',
      '|------|------|------|',
      '| | applied / skipped / failed | |',
      '',
    ].join('\n')

    const res = await updateTaskArtifact(fs, root, { artifact: 'spec-delta.md', slug, content: body }, {})
    assert.equal(res.ok, true)
    assert.match(readFileSync(deltaPath, 'utf8'), /status: approved/)
    assert.match(readFileSync(deltaPath, 'utf8'), /合并记录/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('seam 3 — the delta and its merge record survive the archive move', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'trellis-seam-archive-'))
  const slug = 'feat-11-25-spec-delta-archive'
  try {
    const fs = mockFs(root)
    const created = await createTaskRecord(fs, root, { title: 'Spec delta archive', workType: 'feat', slug })
    assert.equal(created.ok, true)

    const taskDir = path.join(root, '.trellis', 'tasks', slug)
    // Simulate finish-work: delta approved, merged, merge record filled in, then
    // the task marked completed (archive refuses anything not completed).
    writeFileSync(
      path.join(taskDir, 'spec-delta.md'),
      '# Spec Delta\n\nstatus: approved\n\n## 合并记录\n\n| 条目 | 结果 | 说明 |\n|------|------|------|\n| A1 | applied | docs/guides/testing.md |\n',
    )
    writeFileSync(
      path.join(taskDir, 'task.json'),
      JSON.stringify({ title: 'Spec delta archive', status: 'completed', work: { type: 'feat', stage: 'check' } }),
    )

    const res = await archiveTaskRecord(fs, root, { slug }, {}, undefined, { now: new Date(2025, 10, 25) })
    assert.equal(res.ok, true)
    assert.equal(res.taskDir, `.trellis/tasks/archive/2025-11/${slug}`)

    const archived = path.join(root, '.trellis', 'tasks', 'archive', '2025-11', slug, 'spec-delta.md')
    assert.equal(existsSync(archived), true, 'spec-delta.md must move with the task')
    const text = readFileSync(archived, 'utf8')
    assert.match(text, /status: approved/)
    assert.match(text, /\| A1 \| applied \|/, 'the merge record must be archived as evidence')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('seam 4 — provisioning ships the shared graph protocol next to the skills that cite it', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'trellis-seam-provision-'))
  try {
    const res = await ensureProjectSkills(mockFs(root), root)
    assert.ok(res.copied.length > 0)

    // The three skills cite `_templates/graph-queries.md`; if provisioning did
    // not ship it, every one of those references would dangle.
    for (const rel of [
      '_templates/graph-queries.md',
      '_templates/work-types.md',
      '_templates/feat/spec-delta.md',
      'sun-trellis-feat/SKILL.md',
      'sun-trellis-check/SKILL.md',
      'sun-trellis-before-dev/SKILL.md',
      'sun-trellis-finish-work/SKILL.md',
    ]) {
      assert.equal(existsSync(path.join(root, '.agents', 'skills', rel)), true, `missing provisioned file: ${rel}`)
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
