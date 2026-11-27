/**
 * Seam test for the two-tier document review (issue #4).
 *
 * The light tier (S1–S4) deliberately adds **no** new artifact: its conclusions
 * live in a section of the existing stage artifacts. The heavy tier (D1–D7) is a
 * real 16th skill, so it has to survive provisioning — otherwise it exists only
 * in the package and `SKILL_DIRS` drifts from the disk layout without any test
 * noticing.
 *
 * Two seams are pinned here:
 *
 *   1. provisioning ships both the new skill and the shared checklist it cites;
 *   2. `SKILL_DIRS` and the packaged skill directories stay in sync in **both**
 *      directions.
 *
 * Seam 2's first version compared the provisioning result against the disk and
 * claimed both directions — it only ever caught one. `ensureProjectSkills`
 * `continue`s past a missing source directory, so `copied` is by construction
 * `SKILL_DIRS ∩ disk`: a stale entry (listed but deleted) disappeared from both
 * sides of the comparison. Removing a skill directory from `skills/` left the
 * test green (round-2 review, R2). It now imports `SKILL_DIRS` and compares the
 * lists themselves; keep it that way.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, statSync, readdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { ensureProjectSkills, skillsRoot, SKILL_DIRS } from '../lib/skills.js'

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

/** Directory names under the packaged `skills/` that look like bundled skills. */
function packagedSkillDirs() {
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('dsh-trellis-sun-'))
    .map((entry) => entry.name)
    .sort()
}

test('seam 1 — provisioning ships the big-review skill next to the checklist it cites', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'trellis-doc-review-'))
  try {
    const res = await ensureProjectSkills(mockFs(root), root)
    assert.ok(res.copied.length > 0)

    // The skill's whole procedure defers to `_templates/doc-review.md`; if
    // provisioning dropped that file every dimension citation would dangle.
    for (const rel of [
      'dsh-trellis-sun-doc-review/SKILL.md',
      '_templates/doc-review.md',
      '_templates/work-types.md',
      '_templates/feat/review.md',
    ]) {
      assert.equal(existsSync(path.join(root, '.agents', 'skills', rel)), true, `missing provisioned file: ${rel}`)
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('seam 2 — SKILL_DIRS matches the packaged skill directories in both directions', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'trellis-skill-sync-'))
  try {
    // Compare the lists, not the provisioning result: `copied` cannot express
    // "listed but missing" (see the file header). This direction is the one that
    // used to stay green.
    assert.deepEqual(
      [...SKILL_DIRS].sort(),
      packagedSkillDirs(),
      'lib/skills.js SKILL_DIRS must list exactly the packaged skill directories (no unlisted dir, no stale entry)',
    )
    assert.equal(new Set(SKILL_DIRS).size, SKILL_DIRS.length, 'SKILL_DIRS must not contain duplicates')

    const res = await ensureProjectSkills(mockFs(root), root)
    assert.deepEqual(
      [...res.copied].sort(),
      packagedSkillDirs(),
      'a fresh project must receive every packaged skill directory',
    )
    assert.equal(res.copied.includes('dsh-trellis-sun-doc-review'), true, 'the doc-review skill must be provisioned')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
