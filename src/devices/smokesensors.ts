/* Copyright(C) 2022-2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * smokesensors.ts: homebridge-resideo.
 */
import type { CharacteristicValue, PlatformAccessory, Service } from 'homebridge'

import type { ResideoPlatform } from '../platform.js'
import type { CurrentSensorReadings, devicesConfig, location, resideoDevice } from '../settings.js'

import { interval, Subject } from 'rxjs'
import { skipWhile, take } from 'rxjs/operators'

import { DeviceURL } from '../settings.js'
import { deviceBase } from './device.js'

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class SmokeSensor extends deviceBase {
  // Services
  private Battery: {
    Name: CharacteristicValue
    Service: Service
    BatteryLevel: CharacteristicValue
    ChargingState: CharacteristicValue
    StatusLowBattery: CharacteristicValue
  }

  private SmokeSensor?: {
    Name: CharacteristicValue
    Service: Service
    SmokeDetected: CharacteristicValue
  }

  private CarbonMonoxideSensor?: {
    Name: CharacteristicValue
    Service: Service
    CarbonMonoxideDetected: CharacteristicValue
    CarbonMonoxideLevel?: CharacteristicValue
    CarbonMonoxidePeakLevel?: CharacteristicValue
  }

  private HumiditySensor?: {
    Name: CharacteristicValue
    Service: Service
    CurrentRelativeHumidity: CharacteristicValue
  }

  private TemperatureSensor?: {
    Name: CharacteristicValue
    Service: Service
    CurrentTemperature: CharacteristicValue
  }

  // Sensor Update
  SensorUpdateInProgress!: boolean
  doSensorUpdate!: Subject<void>

  constructor(
    readonly platform: ResideoPlatform,
    accessory: PlatformAccessory,
    location: location,
    device: resideoDevice & devicesConfig,
  ) {
    super(platform, accessory, location, device)

    // this is subject we use to track when we need to POST changes to the Resideo API
    this.doSensorUpdate = new Subject()
    this.SensorUpdateInProgress = false

    // Initialize Battery Service
    accessory.context.Battery = accessory.context.Battery ?? {}
    this.Battery = {
      Name: accessory.context.Battery.Name ?? `${accessory.displayName} Battery`,
      Service: accessory.getService(this.hap.Service.Battery) ?? accessory.addService(this.hap.Service.Battery) as Service,
      BatteryLevel: accessory.context.BatteryLevel ?? 100,
      ChargingState: accessory.context.ChargingState ?? this.hap.Characteristic.ChargingState.NOT_CHARGEABLE,
      StatusLowBattery: accessory.context.StatusLowBattery ?? this.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL,
    }
    accessory.context.Battery = this.Battery as object
    // set the service name, this is what is displayed as the default name on the Home app
    this.Battery.Service
      .setCharacteristic(this.hap.Characteristic.Name, this.Battery.Name)
      .setCharacteristic(this.hap.Characteristic.ChargingState, this.hap.Characteristic.ChargingState.NOT_CHARGEABLE)
      .getCharacteristic(this.hap.Characteristic.BatteryLevel)
      .onGet(() => {
        return this.Battery.BatteryLevel
      })

    // Initialize Smoke Sensor Service
    if (device.smokesensor?.hide_smoke) {
      if (this.SmokeSensor) {
        this.debugLog(`${device.deviceClass} ${accessory.displayName} Removing Smoke Sensor Service`)
        this.SmokeSensor.Service = accessory.getService(this.hap.Service.SmokeSensor) as Service
        accessory.removeService(this.SmokeSensor.Service)
      } else {
        this.debugLog(`${this.device.deviceType}: ${accessory.displayName} Smoke Sensor Service Not Found`)
      }
    } else {
      this.debugLog(`${device.deviceClass} ${accessory.displayName} Add Smoke Sensor Service`)
      accessory.context.SmokeSensor = accessory.context.SmokeSensor ?? {}
      this.SmokeSensor = {
        Name: accessory.context.SmokeSensor.Name ?? `${accessory.displayName} Smoke Sensor`,
        Service: accessory.getService(this.hap.Service.SmokeSensor) ?? accessory.addService(this.hap.Service.SmokeSensor) as Service,
        SmokeDetected: accessory.context.SmokeDetected ?? this.hap.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED,
      }
      accessory.context.SmokeSensor = this.SmokeSensor as object

      // Initialize Smoke Sensor Characteristic
      this.SmokeSensor.Service
        .setCharacteristic(this.hap.Characteristic.Name, this.SmokeSensor.Name)
        .getCharacteristic(this.hap.Characteristic.SmokeDetected)
        .onGet(() => {
          return this.SmokeSensor!.SmokeDetected
        })
    }

    // Initialize Carbon Monoxide Sensor Service
    if (device.smokesensor?.hide_carbonmonoxide) {
      if (this.CarbonMonoxideSensor) {
        this.debugLog(`${device.deviceClass} ${accessory.displayName} Removing Carbon Monoxide Sensor Service`)
        this.CarbonMonoxideSensor.Service = accessory.getService(this.hap.Service.CarbonMonoxideSensor) as Service
        accessory.removeService(this.CarbonMonoxideSensor.Service)
      } else {
        this.debugLog(`${this.device.deviceType}: ${accessory.displayName} Carbon Monoxide Sensor Service Not Found`)
      }
    } else {
      this.debugLog(`${device.deviceClass} ${accessory.displayName} Add Carbon Monoxide Sensor Service`)
      accessory.context.CarbonMonoxideSensor = accessory.context.CarbonMonoxideSensor ?? {}
      this.CarbonMonoxideSensor = {
        Name: accessory.context.CarbonMonoxideSensor.Name ?? `${accessory.displayName} Carbon Monoxide Sensor`,
        Service: accessory.getService(this.hap.Service.CarbonMonoxideSensor) ?? accessory.addService(this.hap.Service.CarbonMonoxideSensor) as Service,
        CarbonMonoxideDetected: accessory.context.CarbonMonoxideDetected ?? this.hap.Characteristic.CarbonMonoxideDetected.CO_LEVELS_NORMAL,
        CarbonMonoxideLevel: accessory.context.CarbonMonoxideLevel ?? 0,
        CarbonMonoxidePeakLevel: accessory.context.CarbonMonoxidePeakLevel ?? 0,
      }
      accessory.context.CarbonMonoxideSensor = this.CarbonMonoxideSensor as object

      // Initialize Carbon Monoxide Sensor Characteristics
      this.CarbonMonoxideSensor.Service
        .setCharacteristic(this.hap.Characteristic.Name, this.CarbonMonoxideSensor.Name)
        .getCharacteristic(this.hap.Characteristic.CarbonMonoxideDetected)
        .onGet(() => {
          return this.CarbonMonoxideSensor!.CarbonMonoxideDetected
        })

      this.CarbonMonoxideSensor.Service
        .getCharacteristic(this.hap.Characteristic.CarbonMonoxideLevel)
        .onGet(() => {
          return this.CarbonMonoxideSensor!.CarbonMonoxideLevel!
        })

      this.CarbonMonoxideSensor.Service
        .getCharacteristic(this.hap.Characteristic.CarbonMonoxidePeakLevel)
        .onGet(() => {
          return this.CarbonMonoxideSensor!.CarbonMonoxidePeakLevel!
        })
    }

    // Initialize Temperature Sensor Service
    if (device.smokesensor?.hide_temperature) {
      if (this.TemperatureSensor) {
        this.debugLog(`${device.deviceClass} ${accessory.displayName} Removing Temperature Sensor Service`)
        this.TemperatureSensor.Service = accessory.getService(this.hap.Service.TemperatureSensor) as Service
        accessory.removeService(this.TemperatureSensor.Service)
      } else {
        this.debugLog(`${this.device.deviceType}: ${accessory.displayName} Temperature Sensor Service Not Found`)
      }
    } else if (device.indoorTemperature) {
      this.debugLog(`${device.deviceClass} ${accessory.displayName} Add Temperature Sensor Service`)
      accessory.context.TemperatureSensor = accessory.context.TemperatureSensor ?? {}
      this.TemperatureSensor = {
        Name: accessory.context.TemperatureSensor.Name ?? `${accessory.displayName} Temperature Sensor`,
        Service: accessory.getService(this.hap.Service.TemperatureSensor) ?? accessory.addService(this.hap.Service.TemperatureSensor) as Service,
        CurrentTemperature: accessory.context.CurrentTemperature ?? 20,
      }
      accessory.context.TemperatureSensor = this.TemperatureSensor as object

      // Initialize Temperature Sensor Characteristic
      this.TemperatureSensor.Service
        .setCharacteristic(this.hap.Characteristic.Name, this.TemperatureSensor.Name)

      this.TemperatureSensor.Service
        .getCharacteristic(this.hap.Characteristic.CurrentTemperature)
        .setProps({
          minStep: 0.1,
        })
        .onGet(async () => {
          return this.TemperatureSensor!.CurrentTemperature
        })
    }

    // Initialize Humidity Sensor Service
    if (device.smokesensor?.hide_humidity) {
      if (this.HumiditySensor) {
        this.debugLog(`${device.deviceClass} ${accessory.displayName} Removing Humidity Sensor Service`)
        this.HumiditySensor.Service = accessory.getService(this.hap.Service.HumiditySensor) as Service
        accessory.removeService(this.HumiditySensor.Service)
      } else {
        this.debugLog(`${this.device.deviceType}: ${accessory.displayName} Humidity Sensor Service Not Found`)
      }
    } else if (device.indoorHumidity) {
      this.debugLog(`${device.deviceClass} ${accessory.displayName} Add Humidity Sensor Service`)
      accessory.context.HumiditySensor = accessory.context.HumiditySensor ?? {}
      this.HumiditySensor = {
        Name: accessory.context.HumiditySensor.Name ?? `${accessory.displayName} Humidity Sensor`,
        Service: accessory.getService(this.hap.Service.HumiditySensor) ?? accessory.addService(this.hap.Service.HumiditySensor) as Service,
        CurrentRelativeHumidity: accessory.context.CurrentRelativeHumidity ?? 50,
      }
      accessory.context.HumiditySensor = this.HumiditySensor as object

      // Initialize Humidity Sensor Characteristic
      this.HumiditySensor.Service
        .setCharacteristic(this.hap.Characteristic.Name, this.HumiditySensor.Name)

      this.HumiditySensor.Service
        .getCharacteristic(this.hap.Characteristic.CurrentRelativeHumidity)
        .setProps({
          minStep: 0.1,
        })
        .onGet(() => {
          return this.HumiditySensor!.CurrentRelativeHumidity
        })
    } else {
      this.debugLog(`${device.deviceClass} ${accessory.displayName} Humidity Sensor Service Not Added`)
    }

    // Intial Refresh
    this.refreshStatus()

    // Retrieve initial values and updateHomekit
    this.updateHomeKitCharacteristics()

    // Start an update interval
    interval(this.deviceRefreshRate * 1000)
      .pipe(skipWhile(() => this.SensorUpdateInProgress))
      .subscribe(async () => {
        await this.refreshStatus()
      })
  }

  /**
   * Parse the device status from the Resideo api
   */
  async parseStatus(): Promise<void> {
    // Battery Service
    this.Battery.BatteryLevel = Number(this.device.batteryRemaining)
    this.Battery.Service.getCharacteristic(this.hap.Characteristic.BatteryLevel).updateValue(this.Battery.BatteryLevel)
    if (this.device.batteryRemaining < 15) {
      this.Battery.StatusLowBattery = this.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
    } else {
      this.Battery.StatusLowBattery = this.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL
    }
    this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} BatteryLevel: ${this.Battery.BatteryLevel}, StatusLowBattery: ${this.Battery.StatusLowBattery}`)

    // SmokeSensor Service
    if (!this.device.smokesensor?.hide_smoke) {
      if (this.SmokeSensor) {
        // For now, we'll assume the device reports smoke detection status through a property
        // This will need to be updated based on the actual API response structure
        // Placeholder logic - will need to be updated based on actual device API
        if ((this.device as any).smokeDetected === true) {
          this.SmokeSensor.SmokeDetected = this.hap.Characteristic.SmokeDetected.SMOKE_DETECTED
        } else {
          this.SmokeSensor.SmokeDetected = this.hap.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED
        }
        this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} SmokeDetected: ${this.SmokeSensor.SmokeDetected}`)
      }
    }

    // CarbonMonoxideSensor Service
    if (!this.device.smokesensor?.hide_carbonmonoxide) {
      if (this.CarbonMonoxideSensor) {
        // Placeholder logic - will need to be updated based on actual device API
        if ((this.device as any).carbonMonoxideDetected === true) {
          this.CarbonMonoxideSensor.CarbonMonoxideDetected = this.hap.Characteristic.CarbonMonoxideDetected.CO_LEVELS_ABNORMAL
        } else {
          this.CarbonMonoxideSensor.CarbonMonoxideDetected = this.hap.Characteristic.CarbonMonoxideDetected.CO_LEVELS_NORMAL
        }

        // Set CO levels if available from device
        this.CarbonMonoxideSensor.CarbonMonoxideLevel = (this.device as any).carbonMonoxideLevel ?? 0
        this.CarbonMonoxideSensor.CarbonMonoxidePeakLevel = (this.device as any).carbonMonoxidePeakLevel ?? 0

        this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} CarbonMonoxideDetected: ${this.CarbonMonoxideSensor.CarbonMonoxideDetected}, Level: ${this.CarbonMonoxideSensor.CarbonMonoxideLevel}`)
      }
    }

    const currentSensorReadings = this.device.currentSensorReadings as CurrentSensorReadings ?? { temperature: 20, humidity: 50 }

    // Temperature Service
    if (!this.device.smokesensor?.hide_temperature) {
      if (this.TemperatureSensor) {
        this.TemperatureSensor.CurrentTemperature = currentSensorReadings.temperature
        this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} CurrentTemperature: ${this.TemperatureSensor.CurrentTemperature}°`)
      }
    }

    // Humidity Service
    if (!this.device.smokesensor?.hide_humidity) {
      if (this.HumiditySensor) {
        this.HumiditySensor.CurrentRelativeHumidity = currentSensorReadings.humidity
        this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} CurrentRelativeHumidity: ${this.HumiditySensor.CurrentRelativeHumidity}%`)
      }
    }
  }

  /**
   * Asks the Resideo Home API for the latest device information
   */
  async refreshStatus(): Promise<void> {
    try {
      const { data: device } = await this.platform.axios.get(`${DeviceURL}/${this.device.deviceID}`, {
        params: {
          locationId: this.location.locationID,
        },
      })
      this.device = device
      this.parseStatus()
      this.updateHomeKitCharacteristics()
    } catch (e: any) {
      const action = 'refreshStatus'
      if (this.device.retry) {
        // Refresh the status from the API
        interval(5000)
          .pipe(skipWhile(() => this.SensorUpdateInProgress))
          .pipe(take(1))
          .subscribe(async () => {
            await this.refreshStatus()
          })
      }
      this.resideoAPIError(e, action)
      this.apiError(e)
    }
  }

  /**
   * Updates the status for each of the HomeKit Characteristics
   */
  async updateHomeKitCharacteristics(): Promise<void> {
    if (this.Battery.BatteryLevel === undefined) {
      this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} BatteryLevel: ${this.Battery.BatteryLevel}`)
    } else {
      this.Battery.Service.updateCharacteristic(this.hap.Characteristic.BatteryLevel, this.Battery.BatteryLevel)
      this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} updateCharacteristic BatteryLevel: ${this.Battery.BatteryLevel}`)
    }
    if (this.Battery.StatusLowBattery === undefined) {
      this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} StatusLowBattery: ${this.Battery.StatusLowBattery}`)
    } else {
      this.Battery.Service.updateCharacteristic(this.hap.Characteristic.StatusLowBattery, this.Battery.StatusLowBattery)
      this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} updateCharacteristic StatusLowBattery: ${this.Battery.StatusLowBattery}`)
    }
    if (!this.device.smokesensor?.hide_smoke) {
      if (this.SmokeSensor?.SmokeDetected === undefined) {
        this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} SmokeDetected: ${this.SmokeSensor?.SmokeDetected}`)
      } else {
        this.SmokeSensor.Service.updateCharacteristic(this.hap.Characteristic.SmokeDetected, this.SmokeSensor.SmokeDetected)
        this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} updateCharacteristic SmokeDetected: ${this.SmokeSensor.SmokeDetected}`)
      }
    }
    if (!this.device.smokesensor?.hide_carbonmonoxide) {
      if (this.CarbonMonoxideSensor?.CarbonMonoxideDetected === undefined) {
        this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} CarbonMonoxideDetected: ${this.CarbonMonoxideSensor?.CarbonMonoxideDetected}`)
      } else {
        this.CarbonMonoxideSensor.Service.updateCharacteristic(this.hap.Characteristic.CarbonMonoxideDetected, this.CarbonMonoxideSensor.CarbonMonoxideDetected)
        this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} updateCharacteristic CarbonMonoxideDetected: ${this.CarbonMonoxideSensor.CarbonMonoxideDetected}`)
      }
      if (this.CarbonMonoxideSensor?.CarbonMonoxideLevel === undefined) {
        this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} CarbonMonoxideLevel: ${this.CarbonMonoxideSensor?.CarbonMonoxideLevel}`)
      } else {
        this.CarbonMonoxideSensor.Service.updateCharacteristic(this.hap.Characteristic.CarbonMonoxideLevel, this.CarbonMonoxideSensor.CarbonMonoxideLevel)
        this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} updateCharacteristic CarbonMonoxideLevel: ${this.CarbonMonoxideSensor.CarbonMonoxideLevel}`)
      }
    }
    if (!this.device.smokesensor?.hide_temperature) {
      if (this.TemperatureSensor?.CurrentTemperature === undefined) {
        this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} CurrentTemperature: ${this.TemperatureSensor?.CurrentTemperature}`)
      } else {
        this.TemperatureSensor.Service.updateCharacteristic(this.hap.Characteristic.CurrentTemperature, this.TemperatureSensor.CurrentTemperature)
        this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} updateCharacteristic CurrentTemperature: ${this.TemperatureSensor.CurrentTemperature}`)
      }
    }
    if (!this.device.smokesensor?.hide_humidity) {
      if (this.HumiditySensor?.CurrentRelativeHumidity === undefined) {
        this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} CurrentRelativeHumidity: ${this.HumiditySensor?.CurrentRelativeHumidity}`)
      } else {
        this.HumiditySensor.Service.updateCharacteristic(this.hap.Characteristic.CurrentRelativeHumidity, this.HumiditySensor.CurrentRelativeHumidity)
        this.debugLog(`${this.device.deviceClass} ${this.accessory.displayName} updateCharacteristic CurrentRelativeHumidity: ${this.HumiditySensor.CurrentRelativeHumidity}`)
      }
    }
  }

  async apiError(e: any): Promise<void> {
    this.Battery.Service.updateCharacteristic(this.hap.Characteristic.BatteryLevel, e)
    this.Battery.Service.updateCharacteristic(this.hap.Characteristic.StatusLowBattery, e)
    if (!this.device.smokesensor?.hide_smoke) {
      this.SmokeSensor?.Service.updateCharacteristic(this.hap.Characteristic.SmokeDetected, e)
    }
    if (!this.device.smokesensor?.hide_carbonmonoxide) {
      this.CarbonMonoxideSensor?.Service.updateCharacteristic(this.hap.Characteristic.CarbonMonoxideDetected, e)
      this.CarbonMonoxideSensor?.Service.updateCharacteristic(this.hap.Characteristic.CarbonMonoxideLevel, e)
      this.CarbonMonoxideSensor?.Service.updateCharacteristic(this.hap.Characteristic.CarbonMonoxidePeakLevel, e)
    }
    if (!this.device.smokesensor?.hide_temperature) {
      this.TemperatureSensor?.Service.updateCharacteristic(this.hap.Characteristic.CurrentTemperature, e)
    }
    if (!this.device.smokesensor?.hide_humidity) {
      this.HumiditySensor?.Service.updateCharacteristic(this.hap.Characteristic.CurrentRelativeHumidity, e)
    }
  }
}
