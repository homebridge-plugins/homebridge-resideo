/**
 * What the plugin prints when nobody asked for debug output.
 *
 * Working `debugMode` out from `-D` in the plugin's own process arguments was
 * wrong in a child bridge, which never receives it — so that was dropped. But
 * `platformLogging` then became `'debugMode'` in every normal install, and
 * `loggingIsDebug()` treats that as "debug is on". Three of the debug helpers
 * were gated on it while writing through `log.warn`, `log.error` and
 * `log.success`, which Homebridge always prints — so they started appearing for
 * everyone, whether or not debug was enabled (homebridge-august#243).
 *
 * `log.debug` is the only level Homebridge itself gates, so in `debugMode`
 * these have to go out through it, exactly as `debugLog` already does.
 */
import type { Logging } from 'homebridge'

import { describe, expect, it, vi } from 'vitest'

import { ResideoPlatform } from './Platform.HAP.js'

function makeLog(): Logging {
  const log = vi.fn() as unknown as Logging
  log.info = vi.fn()
  log.success = vi.fn()
  log.warn = vi.fn()
  log.error = vi.fn()
  log.debug = vi.fn()
  return log
}

/**
 * The log helpers only read `platformLogging` and `this.log`, so they can be
 * exercised without standing a whole platform up.
 */
function makeLogger(platformLogging: string) {
  const log = makeLog()
  const host: any = Object.create(ResideoPlatform.prototype)
  host.log = log
  host.platformLogging = platformLogging
  return { host, log }
}

describe('debug logging when debug is not switched on', () => {
  it('does not print a debug warning as a warning', async () => {
    const { host, log } = makeLogger('debugMode')

    await host.debugWarnLog('a debug warning')

    expect(log.warn).not.toHaveBeenCalled()
    expect(log.debug).toHaveBeenCalled()
  })

  it('does not print a debug error as an error', async () => {
    const { host, log } = makeLogger('debugMode')

    await host.debugErrorLog('a debug error')

    expect(log.error).not.toHaveBeenCalled()
    expect(log.debug).toHaveBeenCalled()
  })

  it('does not print a debug success as a success', async () => {
    const { host, log } = makeLogger('debugMode')

    await host.debugSuccessLog('a debug success')

    expect(log.success).not.toHaveBeenCalled()
    expect(log.debug).toHaveBeenCalled()
  })

  it('still sends a plain debug line to the debug logger', async () => {
    const { host, log } = makeLogger('debugMode')

    await host.debugLog('an ordinary debug line')

    expect(log.debug).toHaveBeenCalled()
  })
})

describe('debug logging when the config asks for it explicitly', () => {
  /**
   * `logging: 'debug'` is a deliberate choice to see debug output regardless of
   * how Homebridge is running, so these stay on their visible levels.
   */
  it('still prints a debug warning as a marked warning', async () => {
    const { host, log } = makeLogger('debug')

    await host.debugWarnLog('a debug warning')

    expect(log.warn).toHaveBeenCalled()
    expect(log.debug).not.toHaveBeenCalled()
  })
})

describe('logging switched off entirely', () => {
  it('prints nothing at all', async () => {
    const { host, log } = makeLogger('none')

    await host.debugWarnLog('a debug warning')
    await host.debugLog('an ordinary debug line')

    expect(log.warn).not.toHaveBeenCalled()
    expect(log.debug).not.toHaveBeenCalled()
  })
})

/**
 * The tests above set `platformLogging` by hand, which pins the log helpers but
 * says nothing about what a real install ends up with. These two halves have to
 * be joined or the regression could come back through the other one: put
 * `'debugMode'` back into `getPlatformLogSettings` and the helper tests would
 * still pass while the log filled up again.
 */
describe('a default install, from the settings it actually works out', () => {
  function makeHost(configLogging?: string) {
    const log = makeLog()
    const host: any = Object.create(ResideoPlatform.prototype)
    host.log = log
    host.config = { options: configLogging ? { logging: configLogging } : {} }
    return { host, log }
  }

  it('resolves to debugMode when nothing is configured', async () => {
    const { host } = makeHost()

    await host.getPlatformLogSettings()

    expect(host.platformLogging).toBe('debugMode')
  })

  it('prints nothing visible on a normal launch, whatever it resolved to', async () => {
    const { host, log } = makeHost()

    await host.getPlatformLogSettings()
    await host.debugWarnLog('a debug line')
    await host.debugErrorLog('another debug line')

    expect(log.warn).not.toHaveBeenCalled()
    expect(log.error).not.toHaveBeenCalled()
    expect(log.info).not.toHaveBeenCalled()
  })

  it('still honours logging: debug from the config', async () => {
    const { host, log } = makeHost('debug')

    await host.getPlatformLogSettings()
    await host.debugWarnLog('a debug warning')

    expect(host.platformLogging).toBe('debug')
    expect(log.warn).toHaveBeenCalled()
  })
})
