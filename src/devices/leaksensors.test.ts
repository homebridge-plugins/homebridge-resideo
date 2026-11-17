import { describe, expect, it, vi } from 'vitest'

import { hasHumidityReading, LeakSensor } from './leaksensors.js'

/**
 * Some leak detectors, like the L1 set up in the First Alert app, get a 404
 * from their own status request, while the account's location list carries
 * the same readings (#946).
 */

const listed = {
  deviceID: 'leak-1',
  deviceClass: 'LeakDetector',
  waterPresent: false,
  batteryRemaining: 100,
  currentSensorReadings: { temperature: 22.02, humidity: 53.2 },
}

function notFound() {
  return Object.assign(new Error('Request failed with status code 404'), { status: 404 })
}

/** A leak sensor with only what refreshStatus uses. */
function sensor(get: ReturnType<typeof vi.fn>) {
  const leak = Object.create(LeakSensor.prototype) as LeakSensor & Record<string, any>
  Object.assign(leak, {
    accessory: { displayName: 'Leak Detector Bathroom' },
    device: {
      deviceID: 'leak-1',
      deviceClass: 'LeakDetector',
      leaksensor: { hide_humidity: true },
    },
    location: { locationID: 1 },
    platform: {
      httpClient: { get },
      discoverlocations: vi.fn().mockResolvedValue([
        {
          locationID: 1,
          name: 'Home',
          devices: [
            { deviceID: 'other' },
            listed,
          ],
        },
      ]),
    },
    statusFromLocations: false,
    debugLog: vi.fn(),
    parseStatus: vi.fn(),
    updateHomeKitCharacteristics: vi.fn(),
    resideoAPIError: vi.fn(),
    apiError: vi.fn(),
  })
  return leak
}

describe('a leak detector with no status of its own', () => {
  it('reads its readings from the location list instead', async () => {
    const leak = sensor(vi.fn().mockRejectedValue(notFound()))

    await leak.refreshStatus()

    expect(leak.device.currentSensorReadings).toEqual({ temperature: 22.02, humidity: 53.2 })
    expect(leak.device.batteryRemaining).toBe(100)
    expect(leak.parseStatus).toHaveBeenCalled()
    expect(leak.apiError).not.toHaveBeenCalled()
  })

  it('keeps its own settings from the config', async () => {
    // The API's copy of the device has none of the config, like hidden sensors
    const leak = sensor(vi.fn().mockResolvedValue({ data: listed }))

    await leak.refreshStatus()

    expect(leak.device.leaksensor).toEqual({ hide_humidity: true })
    expect(leak.device.batteryRemaining).toBe(100)
  })

  it('stops asking for its own status after the first 404', async () => {
    const get = vi.fn().mockRejectedValue(notFound())
    const leak = sensor(get)

    await leak.refreshStatus()
    await leak.refreshStatus()

    expect(get).toHaveBeenCalledTimes(1)
    expect(leak.platform.discoverlocations).toHaveBeenCalledTimes(2)
  })

  it('still reports any other error', async () => {
    const leak = sensor(vi.fn().mockRejectedValue(Object.assign(new Error('Request failed with status code 500'), { status: 500 })))

    await leak.refreshStatus()

    expect(leak.platform.discoverlocations).not.toHaveBeenCalled()
    expect(leak.apiError).toHaveBeenCalled()
  })
})

/** A leak sensor with only what parseStatus uses, reading the given device. */
function parsing(device: Record<string, unknown>) {
  const leak = Object.create(LeakSensor.prototype) as LeakSensor & Record<string, any>
  Object.assign(leak, {
    accessory: { displayName: 'Leak Detector Bathroom' },
    device: {
      deviceClass: 'LeakDetector',
      batteryRemaining: 88.1,
      hasDeviceCheckedIn: true,
      ...device,
    },
    hap: {
      Characteristic: {
        StatusLowBattery: { BATTERY_LEVEL_LOW: 1, BATTERY_LEVEL_NORMAL: 0 },
        LeakDetected: { LEAK_DETECTED: 1, LEAK_NOT_DETECTED: 0 },
      },
    },
    Battery: {
      Service: {
        getCharacteristic: () => ({
          updateValue: vi.fn(),
        }),
      },
    },
    LeakSensor: {},
    debugLog: vi.fn(),
  })
  return leak
}

describe('a leak reported as an alarm (#946)', () => {
  const leakAlarm = {
    DeviceId: 'x',
    AlarmId: 'y',
    Type: 'WaterLeak',
    Created: '2026-11-16T23:03:44',
    Resolved: null,
  }

  it('is a leak while the alarm is open, even with waterPresent false', async () => {
    const leak = parsing({
      waterPresent: false,
      currentAlarms: [leakAlarm],
    })

    await leak.parseStatus()

    expect(leak.LeakSensor.LeakDetected).toBe(1)
  })

  it('is no leak once the alarm is resolved', async () => {
    const leak = parsing({
      waterPresent: false,
      currentAlarms: [
        { ...leakAlarm, Resolved: '2026-11-17T08:00:00' },
      ],
    })

    await leak.parseStatus()

    expect(leak.LeakSensor.LeakDetected).toBe(0)
  })

  it('is no leak for an open alarm of another kind', async () => {
    const leak = parsing({
      waterPresent: false,
      currentAlarms: [
        { ...leakAlarm, Type: 'LowBattery' },
      ],
    })

    await leak.parseStatus()

    expect(leak.LeakSensor.LeakDetected).toBe(0)
  })

  it('still trusts waterPresent', async () => {
    const leak = parsing({ waterPresent: true, currentAlarms: [] })

    await leak.parseStatus()

    expect(leak.LeakSensor.LeakDetected).toBe(1)
  })
})

describe('the humidity sensor of a leak detector (#946)', () => {
  it('is added for a detector which only has currentSensorReadings, like the L1', () => {
    expect(hasHumidityReading(listed)).toBe(true)
  })

  it('is not added for a detector without any humidity reading', () => {
    expect(hasHumidityReading({ currentSensorReadings: {} } as never)).toBe(false)
  })
})
