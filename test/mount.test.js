import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, statSync, readdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Context } from '@deepseek-ai/cordis'

import plugin from '../lib/index.js'

/** dsh-fs stand-in over a real temp directory. */
function mockFs() {
  const target = (p) => ({ targetKey: path.resolve(p), displayPath: p })
  return {
    sandboxMode: undefined,
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
      try {
        return readdirSync(t.targetKey, { withFileTypes: true }).map((entry) => ({
          name: entry.name,
          target: target(path.join(t.targetKey, entry.name)),
        }))
      } catch {
        return []
      }
    },
    async writeText(t, content) {
      mkdirSync(path.dirname(t.targetKey), { recursive: true })
      writeFileSync(t.targetKey, content)
    },
  }
}

/**
 * Mount the host half on a real cordis Context with stub services.
 *
 * This is the check that catches activation failures: the 0.1.7 break came
 * from `apply` throwing (`cannot get property "config" without inject`), which
 * left the loader entry un-activated while every unit test still passed.
 * It also proves the real `defineTool` accepts every tool spec.
 *
 * @returns {Promise<{ registered: string[] }>} the tool names registered.
 */
async function mountPlugin() {
  const root = new Context()
  const registered = []

  // The services the plugin injects. `ctx.fs` is the real surface it uses.
  root.provide('fs', {
    sandboxMode: undefined,
    async resolve(p) {
      return { path: p }
    },
    async stat() {
      return undefined
    },
    async readText() {
      return ''
    },
    async listDir() {
      return []
    },
    async writeText() {
      return { ok: true }
    },
  })
  root.provide('skills', {})
  root.provide('tools', {
    register(definition) {
      registered.push(definition.name)
      return () => {}
    },
  })
  root.provide('agents', { currentInitiator: () => undefined })

  const fork = root.plugin(plugin, { allowlist: [] })
  // Let the injection graph settle.
  await new Promise((resolve) => setTimeout(resolve, 250))
  return { registered, fork }
}

/**
 * dsh-settings' `describe()` reads `entry.fiber.runtime.Config` and skips any
 * entry whose schema it cannot find. Cordis only exposes the schema under the
 * capitalised `Config` key — with a lowercase `config: SCHEMA` the entry was
 * never listed, so the Plugins-page form silently vanished (rendered the
 * "unavailable" line) while everything else kept working.
 */
test('the schema is exposed at runtime.Config, which dsh-settings reads', async () => {
  const { fork } = await mountPlugin()
  const runtime = fork && fork.runtime
  assert.ok(runtime, 'the plugin fiber has no runtime')
  assert.ok(runtime.Config, 'runtime.Config is missing — the Plugins-page form would never be listed')
  assert.equal(typeof runtime.Config.toJSON, 'function', 'runtime.Config must be a schemastery schema')
  assert.equal(plugin.config, undefined, 'a lowercase `config` key is not read as the schema')
})

test('host plugin mounts on a real cordis context and registers its tools', async () => {
  const { registered } = await mountPlugin()
  assert.ok(registered.length > 0, 'no tools were registered — apply likely threw')
  for (const name of ['dsh_trellis_sun_state', 'dsh_trellis_sun_task_create', 'dsh_trellis_sun_task_update', 'dsh_trellis_sun_task_archive']) {
    assert.ok(registered.includes(name), `missing tool ${name} (registered: ${registered.join(', ')})`)
  }
})

test('the mounted plugin exposes a working effective config', async () => {
  // Re-mount and drive the registered diagnostic tool end-to-end: it resolves
  // the project state through `effectiveConfig.get()`, so a throwing config
  // getter surfaces here rather than only in a live DSH session.
  const root = new Context()
  const tools = new Map()
  root.provide('fs', {
    sandboxMode: undefined,
    async resolve(p) {
      return { path: p }
    },
    async stat() {
      return undefined
    },
    async readText() {
      return ''
    },
    async listDir() {
      return []
    },
    async writeText() {
      return { ok: true }
    },
  })
  root.provide('skills', {})
  root.provide('tools', {
    register(definition) {
      tools.set(definition.name, definition)
      return () => {}
    },
  })
  root.provide('agents', { currentInitiator: () => undefined })

  root.plugin(plugin, { allowlist: ['F:/proj'] })
  await new Promise((resolve) => setTimeout(resolve, 250))

  const stateTool = tools.get('dsh_trellis_sun_state')
  assert.ok(stateTool, 'dsh_trellis_sun_state was not registered')

  const value = await stateTool.execute(
    { cwd: 'F:/proj/sub' },
    { agent: { session: { id: 's1', header: { cwd: 'F:/proj/sub' } } } },
  )
  assert.equal(value.project, 'F:/proj', 'the allowlist from config did not resolve')
  assert.equal(value.matched, true)
})

/**
 * The seam that only shows up through the model-facing surface: a feat task is
 * created by the `dsh_trellis_sun_task_create` tool, the planning window masks
 * `write`, and the seeded `spec-delta.md` is then authored through
 * `dsh_trellis_sun_artifact_update` — the only channel the model has in planning.
 */
test('the mounted tools carry a feat task through spec-delta authoring', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'trellis-mount-seam-'))
  try {
    const root = new Context()
    const tools = new Map()
    root.provide('fs', mockFs())
    root.provide('skills', {})
    root.provide('tools', {
      register(definition) {
        tools.set(definition.name, definition)
        return () => {}
      },
    })
    root.provide('agents', { currentInitiator: () => undefined })

    root.plugin(plugin, { allowlist: [dir] })
    await new Promise((resolve) => setTimeout(resolve, 250))

    const exec = { agent: { session: { id: 'seam-session', header: { cwd: dir } } } }
    const slug = 'feat-11-25-mount-seam'

    const createTool = tools.get('dsh_trellis_sun_task_create')
    assert.ok(createTool, 'dsh_trellis_sun_task_create was not registered')
    const created = await createTool.execute({ cwd: dir, workType: 'feat', title: 'Mount seam', slug }, exec)
    assert.equal(created.ok, true, `create failed: ${created.error}`)
    assert.ok(created.seeded.includes('spec-delta.md'), `seeded: ${created.seeded.join(', ')}`)
    assert.equal(created.stage, 'prd')

    const deltaPath = path.join(dir, '.trellis', 'tasks', slug, 'spec-delta.md')
    assert.equal(existsSync(deltaPath), true, 'spec-delta.md was not seeded into the task dir')

    const artifactTool = tools.get('dsh_trellis_sun_artifact_update')
    assert.ok(artifactTool, 'dsh_trellis_sun_artifact_update was not registered')
    const written = await artifactTool.execute(
      {
        cwd: dir,
        slug,
        artifact: 'spec-delta.md',
        content: '# Spec Delta\n\nstatus: approved\n\n无增量：本任务不触及常驻 spec\n',
      },
      exec,
    )
    assert.equal(written.ok, true, `artifact write failed: ${written.error}`)
    assert.match(readFileSync(deltaPath, 'utf8'), /无增量：本任务不触及常驻 spec/)

    // A non-feat artifact stays rejected: the whitelist is not a blanket pass.
    const rejected = await artifactTool.execute({ cwd: dir, slug, artifact: 'gossip.md', content: 'x' }, exec)
    assert.equal(rejected.ok, false)
    assert.match(rejected.error, /不允许更新非标准产物/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
