/* Copyright(C) 2017-2025, homebridge-plugins/homebridge-resideo developers. All rights reserved.
 *
 * resideo-options.ts: Feature option definitions for homebridge-resideo.
 */

/**
 * Resideo feature option categories.
 */
export const featureOptionCategories = [
  {
    name: 'Device',
    description: 'Device configuration options for individual Resideo devices.',
  },
  {
    name: 'Logging',
    description: 'Logging options for the Resideo plugin.',
  },
]

/**
 * Resideo feature options.
 */
export const featureOptions = [
  {
    name: 'Device.Hide',
    description: 'Hide a device from HomeKit.',
    default: false,
  },
  {
    name: 'Device.SyncName',
    description: 'Synchronize the HomeKit accessory name with the device name on the Resideo controller.',
    default: true,
  },
  {
    name: 'Logging.Suppress',
    description: 'Suppress all logging for this device.',
    default: false,
  },
  {
    name: 'Logging.Debug',
    description: 'Enable debug logging for this device.',
    default: false,
  },
]
