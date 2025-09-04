/* Copyright(C) 2022-2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * fanModeMapping.test.ts: homebridge-resideo.
 */
import { describe, expect, it } from 'vitest'
import type { fanModeMapping } from './settings.js'

describe('fanModeMapping', () => {
  it('should have correct interface structure', () => {
    const mapping: fanModeMapping = {
      auto_mode: 'Auto',
      on_mode: 'On',
      off_mode: 'Circulate',
    }

    expect(mapping.auto_mode).toBe('Auto')
    expect(mapping.on_mode).toBe('On')
    expect(mapping.off_mode).toBe('Circulate')
  })

  it('should allow valid fan mode values', () => {
    const mapping: fanModeMapping = {
      auto_mode: 'On',
      on_mode: 'Circulate',
      off_mode: 'Auto',
    }

    expect(['Auto', 'On', 'Circulate']).toContain(mapping.auto_mode)
    expect(['Auto', 'On', 'Circulate']).toContain(mapping.on_mode)
    expect(['Auto', 'On', 'Circulate']).toContain(mapping.off_mode)
  })

  it('should allow optional properties', () => {
    const mapping: fanModeMapping = {
      auto_mode: 'Auto',
    }

    expect(mapping.auto_mode).toBe('Auto')
    expect(mapping.on_mode).toBeUndefined()
    expect(mapping.off_mode).toBeUndefined()
  })
})