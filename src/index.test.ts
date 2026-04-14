import type { API } from 'homebridge'

import { describe, expect, it, vi } from 'vitest'

import registerPlatform from './index.js'
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js'

describe('index.ts', () => {
  it('should register the platform with homebridge using a proxy constructor', () => {
    const apiMock: API = {
      registerPlatform: vi.fn(),
    } as unknown as API

    registerPlatform(apiMock)

    expect(apiMock.registerPlatform).toHaveBeenCalledWith(PLUGIN_NAME, PLATFORM_NAME, expect.any(Function))
  })
})
