/* Copyright(C) 2022-2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * Platform.Matter.ts: homebridge-resideo Matter platform.
 */
import type { API, Logging, PlatformAccessory } from 'homebridge'

import type { location, locations, ResideoPlatformConfig } from './settings.js'

import { ResideoPlatform } from './Platform.HAP.js'
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
   * Matter's BridgedDeviceBasicInformation.NodeLabel is constrained to 32 characters.
   * Homebridge sets the nodeLabel from the accessory displayName, so longer names make
   * the whole endpoint fail to register with "Behaviors have errors".
   */
  private clampMatterDisplayName(displayName: string): string {
    if (displayName.length <= 32) {
      return displayName
    }
    const clamped = displayName.slice(0, 32).trim()
    this.debugLog(`Display name "${displayName}" exceeds Matter's 32 character limit, using "${clamped}"`)
    return clamped
  }

  /**
   * Map of cached Matter accessories restored from disk at startup.
   * Keyed by UUID so duplicates are avoided on re-launch.
   */
  public readonly matterAccessories: Map<string, any> = new Map()

  constructor(log: Logging, config: ResideoPlatformConfig, api: API) {
    super(log, config, api)
  }

  /**
   * Delegates to the base-class implementation so the HAP accessories array
   * (`this.accessories`) is always populated. This is required for the HAP
   * fallback path inside `discoverDevices` to work correctly and prevents
   * duplicate HAP accessories from being created on re-launch.
   *
   * When Matter mode is active those HAP accessories will be unregistered at
   * the start of `discoverDevices`, cleanly migrating away from legacy HAP.
   */
  configureAccessory(accessory: PlatformAccessory): void {
    super.configureAccessory(accessory)
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
   * Any previously cached HAP accessories are unregistered first to avoid
   * leaving stale HAP accessories when transitioning to Matter.
   *
   * When Matter is not active the call is delegated to the parent HAP
   * implementation so the plugin continues to work with Homebridge v1.x.
   */
  protected async discoverDevices(): Promise<void> {
    if (!this.matterActive) {
      this.debugLog('Matter is not available or not enabled – falling back to HAP device discovery.')
      return super.discoverDevices()
    }

    this.infoLog('Matter is available and enabled – registering Resideo devices as Matter accessories.')

    // Unregister any legacy HAP accessories that were restored from cache so
    // they don't remain as duplicate/stale entries alongside Matter accessories.
    if (this.accessories.length > 0) {
      this.debugLog(`Removing ${this.accessories.length} cached HAP accessory(s) before switching to Matter.`)
      for (const hapAccessory of this.accessories) {
        this.unregisterPlatformAccessories(hapAccessory)
      }
      this.accessories.length = 0
    }

    try {
      const locations = await this.discoverlocations() as locations ?? []
      this.infoLog(`Total Locations Found: ${locations.length}`)

      if (locations.length === 0) {
        this.debugLog('No locations found.')
        return
      }

      // Deliberately typed rather than cast to `any`. The cast is what let a
      // call to updatePlatformAccessories keep the (plugin, platform,
      // accessories) shape of its register/unregister siblings - that one takes
      // the accessory array on its own, so every argument landed in the wrong
      // parameter and the update silently did nothing. Typed, the compiler
      // catches it.
      const matterApi = this.api.matter
      if (!matterApi) {
        this.debugLog('Matter API is no longer available – falling back to HAP device discovery.')
        return super.discoverDevices()
      }
      const accessories: any[] = []

      for (const location of locations) {
        this.infoLog(`Total Devices Found at ${location.name}: ${(location as location).devices.length}`)

        const deviceLists: any[] = (location as location).devices
        const configDevices = this.config.options?.devices

        const devices = configDevices
          ? this.mergeByDeviceID(
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
          const displayName = this.clampMatterDisplayName(device.configDeviceName ?? device.userDefinedDeviceName ?? `${device.deviceClass} ${device.deviceID}`)

          const existingAccessory = this.matterAccessories.get(uuid)
          if (existingAccessory) {
            this.infoLog(`Restoring existing Matter accessory from cache: ${existingAccessory.displayName}`)
            existingAccessory.context.device = device
            existingAccessory.context.location = location
            await matterApi.updatePlatformAccessories([existingAccessory])
            this.matterAccessories.set(uuid, existingAccessory)
          } else {
            this.debugLog(`Creating new Matter accessory for: ${displayName} (${device.deviceClass})`)
            const MatterAccessory = (this.api as any).matterAccessory
            const accessory = new MatterAccessory(displayName, uuid)
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
      this.action = 'Discover Devices (Matter)'
      this.apiError(e)
    }
  }
}
