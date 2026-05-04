/* Copyright(C) 2022-2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * index.ts: homebridge-resideo.
 */
import type { API } from 'homebridge'

import { ResideoPlatform } from './Platform.HAP.js'
import { ResideoMatterPlatform } from './Platform.Matter.js'
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js'
import { createPlatformProxy } from './utils.js'

// Register our platform with homebridge.
export default (api: API): void => {
  const ProxyCtor = createPlatformProxy(ResideoPlatform, ResideoMatterPlatform)
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, ProxyCtor as any)
}
