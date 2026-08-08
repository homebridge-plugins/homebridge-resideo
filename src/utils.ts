/* Copyright(C) 2022-2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * util.ts: homebridge-resideo platform class.
 */
import type { PlatformConfig } from 'homebridge'

import type { ConvertUnitsOption } from './settings.js'

/**
 * Converts the value to celsius if the temperature units are in Fahrenheit
 */
export function toCelsius(value: number, unit: number): number {
  if (unit === 0) {
    return value
  }

  // celsius should be to the nearest 0.5 degree
  return Math.round((5 / 9) * (value - 32) * 2) / 2
}

export function toCelsiusWithOverride(value: number, unit: number, convertUnits?: ConvertUnitsOption): number {
  if (convertUnits === 'fahrenheit') {
    return toCelsius(value, 1)
  }

  if (convertUnits === 'celsius') {
    return toCelsius(value, 0)
  }

  return toCelsius(value, unit)
}

/**
 * Converts the value to fahrenheit if the temperature units are in Fahrenheit
 */
export function toFahrenheit(value: number, unit: number): number {
  if (unit === 0) {
    return value
  }

  return Math.round((value * 9) / 5 + 32)
}

// Map HomeKit Modes to Resideo Modes
export enum HomeKitModes {
  Off = 0, // this.hap.Characteristic.TargetHeatingCoolingState.OFF
  Heat = 1, // this.hap.Characteristic.TargetHeatingCoolingState.HEAT
  Cool = 2, // this.hap.Characteristic.TargetHeatingCoolingState.COOL
  Auto = 3, // this.hap.Characteristic.TargetHeatingCoolingState.AUTO
}

// Don't change the order of these!
export enum ResideoModes {
  Off = 'Off',
  Heat = 'Heat',
  Cool = 'Cool',
  Auto = 'Auto',
};

/*
export enum holdModes {
  NoHold = 0, //this.hap.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS
  TemporaryHold = 1, //this.hap.Characteristic.ProgrammableSwitchEvent.DOUBLE_PRESS
  PermanentHold = 2, //this.hap.Characteristic.ProgrammableSwitchEvent.LONG_PRESS
}

export enum fanModes {
  Auto = 0, //this.hap.Characteristic.TargetFanState.AUTO
  On = 1, //this.hap.Characteristic.TargetFanState.ON
}

export type resideoHold = {
  NoHold: 'NoHold',
  TemporaryHold: 'TemporaryHold',
  PermanentHold: 'PermanentHold'
}; */

/**
 * Creates a proxy class that instantiates the correct platform implementation
 * (HAP or Matter) at runtime based on the user's configuration and the
 * availability of the Matter API in the running Homebridge instance.
 *
 * @param HAPPlatform  The HAP platform class constructor.
 * @param MatterPlatform The Matter platform class constructor.
 * @returns A proxy class that delegates to the correct platform implementation.
 */
export function createPlatformProxy(HAPPlatform: any, MatterPlatform: any): any {
  return class ResideoPlatformProxy {
    /** The instantiated platform implementation (HAP or Matter). */
    private impl: any

    constructor(log: any, config: PlatformConfig, api: any) {
      const preferMatter = (config as any)?.options?.preferMatter ?? true
      const enableMatter = (config as any)?.options?.enableMatter ?? true
      const matterAvailable = !!(api?.isMatterAvailable?.() && api?.isMatterEnabled?.())

      if (enableMatter && preferMatter && MatterPlatform && matterAvailable) {
        this.impl = new MatterPlatform(log, config, api)
        return this.impl
      }

      // Fallback to HAP
      this.impl = new HAPPlatform(log, config, api)
      return this.impl
    }
  }
}

/**
 * The largest delay a Node timer can hold, because it is stored in a signed
 * 32-bit integer. Roughly 24.85 days.
 */
export const MAX_TIMER_MS = 2147483647

/**
 * Keep a computed delay inside the range a Node timer can represent.
 *
 * Going over the limit does not throw. Node prints a TimeoutOverflowWarning and
 * quietly sets the delay to 1 ms, so a timer meant to fire in weeks fires a
 * thousand times a second instead - which for a polling loop means hammering
 * the service it polls.
 *
 * Clamping means a delay longer than 24.85 days simply fires at 24.85 days,
 * which for every setting here is early rather than wrong.
 */
export function safeTimerMs(ms: number): number {
  if (!Number.isFinite(ms) || ms <= 0) {
    return 1
  }
  return Math.min(Math.floor(ms), MAX_TIMER_MS)
}
