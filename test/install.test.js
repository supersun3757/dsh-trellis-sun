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

import { buildRow } from '../scripts/install.mjs'

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
