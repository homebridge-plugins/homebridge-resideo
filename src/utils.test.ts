import { describe, expect, it, vi } from 'vitest'

import { createPlatformProxy, toCelsius } from './utils.js'

describe('toCelsius', () => {
  it('should return the same value if the unit is 0 (Celsius)', () => {
    expect(toCelsius(25, 0)).toBe(25)
  })

  it('should convert Fahrenheit to Celsius correctly', () => {
    expect(toCelsius(32, 1)).toBe(0) // 32°F is 0°C
    expect(toCelsius(68, 1)).toBe(20) // 68°F is 20°C
    expect(toCelsius(100, 1)).toBe(37.5) // 100°F is 37.5°C
  })

  it('should round to the nearest 0.5 degree', () => {
    expect(toCelsius(33, 1)).toBe(0.5) // 33°F is 0.5°C
    expect(toCelsius(34, 1)).toBe(1) // 34°F is 1°C
  })
})

describe('createPlatformProxy', () => {
  it('should instantiate HAPPlatform when Matter is not available', () => {
    const HAPPlatform = vi.fn()
    const MatterPlatform = vi.fn()

    const api = {
      isMatterAvailable: vi.fn().mockReturnValue(false),
      isMatterEnabled: vi.fn().mockReturnValue(false),
    }
    const Proxy = createPlatformProxy(HAPPlatform, MatterPlatform)
    // eslint-disable-next-line no-new
    new Proxy({}, {}, api)

    expect(HAPPlatform).toHaveBeenCalledTimes(1)
    expect(MatterPlatform).not.toHaveBeenCalled()
  })

  it('should instantiate MatterPlatform when Matter is available and enabled', () => {
    const HAPPlatform = vi.fn()
    const MatterPlatform = vi.fn()

    const api = {
      isMatterAvailable: vi.fn().mockReturnValue(true),
      isMatterEnabled: vi.fn().mockReturnValue(true),
    }
    const config = { options: { preferMatter: true, enableMatter: true } }
    const Proxy = createPlatformProxy(HAPPlatform, MatterPlatform)
    // eslint-disable-next-line no-new
    new Proxy({}, config, api)

    expect(MatterPlatform).toHaveBeenCalledTimes(1)
    expect(HAPPlatform).not.toHaveBeenCalled()
  })

  it('should fall back to HAPPlatform when enableMatter is false', () => {
    const HAPPlatform = vi.fn()
    const MatterPlatform = vi.fn()

    const api = {
      isMatterAvailable: vi.fn().mockReturnValue(true),
      isMatterEnabled: vi.fn().mockReturnValue(true),
    }
    const config = { options: { preferMatter: true, enableMatter: false } }
    const Proxy = createPlatformProxy(HAPPlatform, MatterPlatform)
    // eslint-disable-next-line no-new
    new Proxy({}, config, api)

    expect(HAPPlatform).toHaveBeenCalledTimes(1)
    expect(MatterPlatform).not.toHaveBeenCalled()
  })

  it('should fall back to HAPPlatform when preferMatter is false', () => {
    const HAPPlatform = vi.fn()
    const MatterPlatform = vi.fn()

    const api = {
      isMatterAvailable: vi.fn().mockReturnValue(true),
      isMatterEnabled: vi.fn().mockReturnValue(true),
    }
    const config = { options: { preferMatter: false, enableMatter: true } }
    const Proxy = createPlatformProxy(HAPPlatform, MatterPlatform)
    // eslint-disable-next-line no-new
    new Proxy({}, config, api)

    expect(HAPPlatform).toHaveBeenCalledTimes(1)
    expect(MatterPlatform).not.toHaveBeenCalled()
  })
})
