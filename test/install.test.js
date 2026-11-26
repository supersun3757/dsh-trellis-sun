/**
 * Regression tests for the installer's generated `cordis.patch.yml` row.
 *
 * The row is spliced into a YAML file, so every string goes through a
 * double-quoted scalar. Emitting a Windows path raw produced `C:\Users` ->
 * YAML escape `\U` -> "expected hexadecimal character", and the booted profile
 * refused to parse its overlay at all. The installer had no test coverage,
 * which is why the bug shipped and only showed up when a real profile booted.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildRow, nodeFsFileSystem, parseArgs, reseedProjectSkills } from '../scripts/install.mjs'
import { PACKAGE_VERSION, VERSION_FILE_NAME } from '../lib/skills.js'

/** The only escapes the installer emits, applied the way YAML would. */
function yamlUnquote(quoted) {
  return quoted.slice(1, -1).replace(/\\(["\\])/g, '$1')
}

/** Every double-quoted scalar in the row, in document order. */
function quotedScalars(row) {
  return [...row.matchAll(/- ("(?:[^"\\]|\\.)*")/g)].map((m) => yamlUnquote(m[1]))
}

/**
 * YAML allows exactly the escapes we emit (`\\`, `\"`) inside a double-quoted
 * scalar; anything else (`\U`, `\s`, `\t` from a raw path) is a parse error.
 */
function assertYamlSafeEscapes(row) {
  for (const m of row.matchAll(/"(?:[^"\\]|\\.)*"/g)) {
    const body = m[0].slice(1, -1)
    for (let i = 0; i < body.length; i++) {
      if (body[i] !== '\\') continue
      const next = body[i + 1]
      assert.ok(next === '\\' || next === '"', `invalid YAML escape "${body.slice(i, i + 2)}" in ${m[0]}`)
      i++
    }
  }
}

function rowFor(overrides = {}) {
  return buildRow({ allowlist: [], injectStep: null, skipKeywords: null, inline: null, ...overrides })
}

test('buildRow emits a Windows allowlist path that YAML can parse', () => {
  const win = 'C:\\Users\\sun\\AppData\\Local\\Temp\\trellis-e2e-proj'
  const row = rowFor({ allowlist: [win] })

  assertYamlSafeEscapes(row)
  assert.match(row, /^ {6}- "C:\\\\Users\\\\sun/m, 'backslashes must be doubled')
  assert.deepEqual(quotedScalars(row), [win], 'the parsed value must equal the original path')
})

test('buildRow escapes double quotes instead of closing the scalar early', () => {
  const weird = 'C:\\a "quoted" dir'
  const row = rowFor({ allowlist: [weird] })

  assertYamlSafeEscapes(row)
  assert.deepEqual(quotedScalars(row), [weird])
})

test('buildRow leaves forward-slash paths, numbers and booleans intact', () => {
  const row = rowFor({ allowlist: ['F:/Projects/FordProject'], injectStep: 0, inline: false })

  assert.match(row, /^- id: trellis-workflow$/m)
  assert.match(row, /^ {2}name: 'dsh-trellis-sun'$/m)
  assert.match(row, /^ {4}injectStep: 0$/m)
  assert.match(row, /^ {4}inline: false$/m)
  assert.deepEqual(quotedScalars(row), ['F:/Projects/FordProject'])
})

test('buildRow omits config keys that were not supplied', () => {
  const row = rowFor()
  assert.doesNotMatch(row, /config:/, 'an empty config must not emit a dangling block')
  assert.match(row, /^- id: trellis-workflow$/m)
})

// ---------------------------------------------------------------------------
// --reseed: the explicit entry point for project-level skill provisioning.
//
// Provisioning is version-gated (equal version -> skip, zero writes), so a
// skill-text fix that ships without a version bump never reaches an installed
// project. `--reseed` reuses lib/skills.js `ensureProjectSkills` with force, so
// there is no second provisioning logic to drift. These tests pin that reuse.
// ---------------------------------------------------------------------------

/** A project that already carries stale skill text plus a 1.1.0 marker. */
function staleProject() {
  const root = mkdtempSync(path.join(tmpdir(), 'trellis-reseed-'))
  const skillsDir = path.join(root, '.agents', 'skills')
  const staleDir = path.join(skillsDir, 'dsh-trellis-sun-finish-work')
  mkdirSync(staleDir, { recursive: true })
  const staleFile = path.join(staleDir, 'SKILL.md')
  writeFileSync(staleFile, 'stale skill text')
  const versionFile = path.join(skillsDir, VERSION_FILE_NAME)
  writeFileSync(versionFile, '1.1.0')
  return { root, skillsDir, staleFile, versionFile }
}

test('reseedProjectSkills overwrites stale skill text and stamps the package version', async () => {
  const { root, skillsDir, staleFile, versionFile } = staleProject()

  const res = await reseedProjectSkills(root)

  assert.equal(res.ok, true)
  assert.deepEqual(res.result.present, [], 'force must leave nothing on the skip path')
  assert.ok(res.result.updated.includes('dsh-trellis-sun-finish-work'))
  assert.notEqual(readFileSync(staleFile, 'utf8'), 'stale skill text')
  assert.equal(readFileSync(versionFile, 'utf8').trim(), PACKAGE_VERSION)
  assert.ok(existsSync(path.join(skillsDir, '_templates', 'feat', 'spec-delta.md')))
})

test('reseed --dry-run reports the work without writing anything', async () => {
  const { root, staleFile, versionFile } = staleProject()

  const res = await reseedProjectSkills(root, { dryRun: true })

  assert.equal(res.ok, true)
  assert.ok(res.result.updated.includes('dsh-trellis-sun-finish-work'), 'the stale skill is on the update path')
  assert.ok(res.result.copied.includes('dsh-trellis-sun-feat'), 'missing skills are still provisioned')
  assert.match(res.message, /^\[dry-run\] /)
  assert.equal(readFileSync(staleFile, 'utf8'), 'stale skill text', 'dry-run must not overwrite')
  assert.equal(readFileSync(versionFile, 'utf8').trim(), '1.1.0', 'dry-run must not bump the marker')
})

test('reseed --dry-run must not prune deprecated templates either', async () => {
  // The prune uses a bare node:fs unlink, which a write-suppressing adapter
  // cannot intercept — so `dryRun` has to be threaded into ensureProjectSkills
  // itself. Without it a "preview" would silently delete files.
  const root = mkdtempSync(path.join(tmpdir(), 'trellis-reseed-prune-'))
  const deprecated = path.join(root, '.agents', 'skills', '_templates', 'feat', 'implement.md')
  mkdirSync(path.dirname(deprecated), { recursive: true })
  writeFileSync(deprecated, 'deprecated template')

  const preview = await reseedProjectSkills(root, { dryRun: true })
  assert.equal(preview.ok, true)
  assert.ok(existsSync(deprecated), 'dry-run must leave the deprecated template in place')
  assert.equal(preview.result.pruned.length, 1, 'but it must be reported')
  assert.match(preview.message, /\[dry-run\] 清理:/)

  const real = await reseedProjectSkills(root)
  assert.equal(real.ok, true)
  assert.equal(existsSync(deprecated), false, 'a real reseed prunes it')
})

test('reseed provisions a project that has no .agents/skills yet', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'trellis-reseed-fresh-'))

  const res = await reseedProjectSkills(root)

  assert.equal(res.ok, true)
  assert.ok(res.result.copied.includes('dsh-trellis-sun-feat'))
  assert.ok(existsSync(path.join(root, '.agents', 'skills', VERSION_FILE_NAME)))
})

test('reseed refuses a project root that does not exist', async () => {
  const res = await reseedProjectSkills(path.join(tmpdir(), 'trellis-reseed-missing-does-not-exist'))
  assert.equal(res.ok, false)
  assert.match(res.message, /项目目录不存在/)
})

test('reseed refuses a project root that is a file', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'trellis-reseed-file-'))
  const file = path.join(root, 'not-a-dir.txt')
  writeFileSync(file, 'x')
  const res = await reseedProjectSkills(file)
  assert.equal(res.ok, false)
  assert.match(res.message, /不是目录/)
})

test('--reseed and --project are parsed; unknown flags still fall back to help', () => {
  const args = parseArgs(['--reseed', '--project', 'D:/work/proj', '--dry-run'])
  assert.equal(args.reseed, true)
  assert.equal(args.project, 'D:/work/proj')
  assert.equal(args.dryRun, true)
  assert.equal(args.help, false)

  const unknown = parseArgs(['--reseed', '--nope'])
  assert.equal(unknown.help, true)
})

test('nodeFsFileSystem reports a missing path as a null stat instead of throwing', async () => {
  const adapter = nodeFsFileSystem()
  assert.equal(await adapter.stat(path.join(tmpdir(), 'trellis-nope-does-not-exist')), null)
  const { root } = staleProject()
  assert.ok(await adapter.stat(root))
})

// ---------------------------------------------------------------------------
// CLI seam: these spawn the real script, because the unit-level tests above
// cannot reach `if (args.reseed)` inside main() at all — without these the
// whole branch could be deleted with the rest of the suite still green.
// DSH_HOME is pointed at an empty temp dir so a real profile is never touched.
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function runInstaller(args) {
  const home = mkdtempSync(path.join(tmpdir(), 'trellis-home-'))
  const res = spawnSync(process.execPath, [path.join(REPO_ROOT, 'scripts', 'install.mjs'), ...args], {
    cwd: REPO_ROOT,
    stdio: 'ignore',
    env: { ...process.env, DSH_HOME: home, TRELLIS_SKIP_AUTO: '' },
  })
  return res
}

/** Sandboxes can refuse to spawn children at all; skip rather than fail. */
function skipIfNoSpawn(res) {
  return res.error && (res.error.code === 'EPERM' || res.error.code === 'EACCES')
}

test('the --reseed CLI path runs without any profile', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'trellis-cli-reseed-'))
  const res = runInstaller(['--reseed', '--project', root])
  if (skipIfNoSpawn(res)) return

  assert.equal(res.status, 0, 'reseed must not need or reject a profile')
  assert.equal(readFileSync(path.join(root, '.agents', 'skills', VERSION_FILE_NAME), 'utf8').trim(), PACKAGE_VERSION)
  assert.equal(existsSync(path.join(REPO_ROOT, '.agents')), false, 'cwd must be untouched')
})

test('--project with no value fails instead of writing into cwd', () => {
  const res = runInstaller(['--reseed', '--project'])
  if (skipIfNoSpawn(res)) return

  assert.notEqual(res.status, 0)
  assert.equal(existsSync(path.join(REPO_ROOT, '.agents')), false, 'a missing value must not default to cwd')
})

test('--reseed refuses to run next to another mode flag', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'trellis-cli-conflict-'))
  const res = runInstaller(['--reseed', '--uninstall', '--project', root])
  if (skipIfNoSpawn(res)) return

  assert.notEqual(res.status, 0, 'two modes in one invocation must be rejected')
  assert.equal(existsSync(path.join(root, '.agents')), false, 'nothing may be written')
})
