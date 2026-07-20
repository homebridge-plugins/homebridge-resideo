import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { AuthorizeURL, TokenURL } from '../settings.js'

const source = readFileSync(join(import.meta.dirname, 'server.ts'), 'utf8')

describe('setup server', () => {
  it('uses the same host as the rest of the plugin', () => {
    // api.honeywell.com served an expired certificate from 18 May 2026, which
    // broke the login flow for everyone while the plugin itself kept working
    // on api.honeywellhome.com (#927).
    expect(AuthorizeURL).toContain('api.honeywellhome.com')
    expect(TokenURL).toContain('api.honeywellhome.com')
  })

  it('does not hardcode an api host of its own', () => {
    expect(source).not.toContain('api.honeywell.com/')
    expect(source).not.toContain('https://api.honeywellhome.com')
  })

  it('exchanges the code without shelling out', () => {
    // curl is not installed everywhere, it trusts the system CA store rather
    // than the one Node ships, and a hand-built command line means query
    // string values end up inside it.
    expect(source).not.toContain('child_process')
    expect(source).not.toMatch(/\bexec\(/)
    expect(source).not.toContain('curlString')
    expect(source).toContain('await fetch(TokenURL')
  })

  it('never echoes the request back to the page', () => {
    // The token request carries the consumer secret in a Basic auth header, so
    // dumping the error object (which used to include the whole command) put
    // the user's own secret on screen.
    expect(source).not.toContain('JSON.stringify(err)')
  })

  it('escapes anything it writes into the page', () => {
    expect(source).toContain('escapeHtml')
  })
})
