/* Copyright(C) 2022-2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * ResideoMatterPlatform.ts: homebridge-resideo Matter platform.
 */
import type { API, Logging, PlatformConfig } from 'homebridge'

import type { ResideoPlatformConfig } from './settings.js'

import { ResideoPlatform } from './platform.js'
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js'

/**
 * ResideoMatterPlatform
 * Extends ResideoPlatform with Homebridge Matter support (Homebridge v2.0+).
 * When Matter is available and enabled the platform registers Resideo devices
 * as Matter accessories; otherwise it falls back to the standard HAP path
 * inherited from ResideoPlatform.
 */
export class ResideoMatterPlatform extends ResideoPlatform {
  /**
   * Map of cached Matter accessories restored from disk at startup.
   * Keyed by UUID so duplicates are avoided on re-launch.
   */
  public readonly matterAccessories: Map<string, any> = new Map()

  constructor(log: Logging, config: ResideoPlatformConfig, api: API) {
    super(log, config, api)
  }

  /**
   * Called by Homebridge when a cached Matter accessory is restored from disk.
   */
  configureMatterAccessory(accessory: any): void {
    this.debugLog(`Loading cached Matter accessory: ${accessory.displayName}`)
    this.matterAccessories.set(accessory.UUID, accessory)
  }

  /**
   * Returns true when the running Homebridge instance has Matter available
   * and the user has Matter enabled (both bridge-level and plugin-level).
   */
  private get matterActive(): boolean {
    const iface = this.api as any
    return !!(iface?.isMatterAvailable?.() && iface?.isMatterEnabled?.())
  }

  /**
   * Overrides ResideoPlatform.discoverDevices.
   *
   * When Matter is active all discovered Resideo devices are registered as
   * Matter accessories via `api.matter.registerPlatformAccessories`.
   * When Matter is not active the call is delegated to the parent HAP
   * implementation so the plugin continues to work with Homebridge v1.x.
   */
  protected async discoverDevices(): Promise<void> {
    if (!this.matterActive) {
      this.debugLog('Matter is not available or not enabled – falling back to HAP device discovery.')
      return super.discoverDevices()
    }

    this.infoLog('Matter is available and enabled – registering Resideo devices as Matter accessories.')

    try {
      const locations = (await (this as any).discoverlocations()) as any[] ?? []
      this.infoLog(`Total Locations Found: ${locations.length}`)

      if (locations.length === 0) {
        this.debugLog('No locations found.')
        return
      }

      const matterApi = (this.api as any).matter
      const accessories: any[] = []

      for (const location of locations) {
        this.infoLog(`Total Devices Found at ${location.name}: ${location.devices.length}`)

        const deviceLists: any[] = location.devices
        const configDevices = this.config.options?.devices

        const devices = configDevices
          ? (this as any).mergeByDeviceID(
              deviceLists.map((device: any) => ({ ...device, deviceID: String(device.deviceID).trim() })),
              configDevices.map((device: any) => ({ ...device, deviceID: String(device.deviceID).trim() })),
            )
          : deviceLists.slice()

        for (const device of devices) {
          if (device.hide_device) {
            this.debugLog(`Skipping hidden device: ${device.userDefinedDeviceName}`)
            continue
          }

          const uuid = matterApi.uuid.generate(`${device.deviceID}-${device.deviceClass}`)
          const displayName = device.configDeviceName ?? device.userDefinedDeviceName ?? `${device.deviceClass} ${device.deviceID}`

          const existingAccessory = this.matterAccessories.get(uuid)
          if (existingAccessory) {
            this.infoLog(`Restoring existing Matter accessory from cache: ${existingAccessory.displayName}`)
            existingAccessory.context.device = device
            existingAccessory.context.location = location
            await matterApi.updatePlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory])
            this.matterAccessories.set(uuid, existingAccessory)
          } else {
            this.debugLog(`Creating new Matter accessory for: ${displayName} (${device.deviceClass})`)
            const accessory = new (this.api as any).matterAccessory(displayName, uuid)
            accessory.context.device = device
            accessory.context.location = location
            accessories.push(accessory)
            this.matterAccessories.set(uuid, accessory)
          }
        }
      }

      if (accessories.length > 0) {
        this.infoLog(`Registering ${accessories.length} new Matter accessory(s).`)
        await matterApi.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, accessories)
      }
    } catch (e: any) {
      ;(this as any).action = 'Discover Devices (Matter)'
      ;(this as any).apiError(e)
    }
  }
}
