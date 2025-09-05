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
    name: 'Thermostat',
    description: 'Thermostat-specific configuration options including modes, services, and setpoint behavior.',
  },
  {
    name: 'RoomPriority',
    description: 'Room priority settings for T9-T10 thermostats (PickARoom, WholeHouse, FollowMe).',
  },
  {
    name: 'RoomSensor',
    description: 'Room sensor configuration options for T9-T10 thermostats.',
  },
  {
    name: 'LeakSensor',
    description: 'Leak sensor configuration options for controlling visible services.',
  },
  {
    name: 'Performance',
    description: 'API refresh rates, push rates, and performance tuning options.',
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
  // Device category - General device options
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
    name: 'Device.DeviceClass',
    description: 'Override the device class (Thermostat, LeakDetector, ShutoffValve).',
    default: 'auto',
  },
  {
    name: 'Device.Retry',
    description: 'Retry after receiving a Resideo API Error.',
    default: false,
  },
  {
    name: 'Device.External',
    description: 'Configure as an external accessory.',
    default: false,
  },
  {
    name: 'Device.FirmwareOverride',
    description: 'Override the firmware version reported to HomeKit.',
    default: '',
  },

  // Thermostat category - Thermostat-specific options
  {
    name: 'Thermostat.ShowAuto',
    description: 'Show Auto mode even if device API doesn\'t show it.',
    default: false,
  },
  {
    name: 'Thermostat.HideFan',
    description: 'Hide the thermostat fan service from HomeKit.',
    default: false,
  },
  {
    name: 'Thermostat.HideHumidity',
    description: 'Hide the thermostat humidity service from HomeKit.',
    default: false,
  },
  {
    name: 'Thermostat.StatefulStatus',
    description: 'Enable stateful programmable switch for NoHold, TemporaryHold, PermanentHold automations (3rd party apps only).',
    default: false,
  },
  {
    name: 'Thermostat.SetpointStatus',
    description: 'Thermostat setpoint status behavior for LCC devices (PermanentHold, NoHold, TemporaryHold).',
    default: 'PermanentHold',
  },
  {
    name: 'Thermostat.DeviceModel',
    description: 'Specify the thermostat model (T9, T10, T5, T6, Round).',
    default: 'auto',
  },

  // RoomPriority category - T9-T10 room priority options
  {
    name: 'RoomPriority.PriorityType',
    description: 'Room priority type for T9-T10 thermostats (PickARoom, WholeHouse, FollowMe).',
    default: 'PickARoom',
  },
  {
    name: 'RoomPriority.DeviceType',
    description: 'Display mode for room priority thermostat.',
    default: 'Thermostat',
  },

  // RoomSensor category - T9-T10 room sensor options
  {
    name: 'RoomSensor.Hide',
    description: 'Hide all room sensors from HomeKit.',
    default: false,
  },
  {
    name: 'RoomSensor.HideTemperature',
    description: 'Hide room sensor temperature service from HomeKit.',
    default: false,
  },
  {
    name: 'RoomSensor.HideHumidity',
    description: 'Hide room sensor humidity service from HomeKit.',
    default: false,
  },
  {
    name: 'RoomSensor.HideOccupancy',
    description: 'Hide room sensor occupancy service from HomeKit.',
    default: false,
  },

  // LeakSensor category - Leak sensor options
  {
    name: 'LeakSensor.HideLeak',
    description: 'Hide the leak detection service from HomeKit.',
    default: false,
  },
  {
    name: 'LeakSensor.HideTemperature',
    description: 'Hide leak sensor temperature service from HomeKit.',
    default: false,
  },
  {
    name: 'LeakSensor.HideHumidity',
    description: 'Hide leak sensor humidity service from HomeKit.',
    default: false,
  },

  // Performance category - API rates and performance
  {
    name: 'Performance.RefreshRate',
    description: 'Device refresh rate in seconds (minimum 30).',
    default: 360,
  },
  {
    name: 'Performance.PushRate',
    description: 'Device push rate in seconds for API updates.',
    default: 1,
  },
  {
    name: 'Performance.RoomPriorityRefreshRate',
    description: 'Room priority thermostat refresh rate in seconds (T9-T10 only).',
    default: 360,
  },
  {
    name: 'Performance.RoomPriorityPushRate',
    description: 'Room priority thermostat push rate in seconds (T9-T10 only).',
    default: 360,
  },
  {
    name: 'Performance.RoomSensorRefreshRate',
    description: 'Room sensor refresh rate in seconds (T9-T10 only).',
    default: 360,
  },
  {
    name: 'Performance.RoomSensorPushRate',
    description: 'Room sensor push rate in seconds (T9-T10 only).',
    default: 360,
  },
  {
    name: 'Performance.AllowInvalidCharacters',
    description: 'Allow invalid characters in device names.',
    default: false,
  },
  // Logging category - Logging options
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
  {
    name: 'Logging.Level',
    description: 'Device-specific logging level override (standard, none, debug).',
    default: '',
  },
  {
    name: 'Logging.RoomPriorityLevel',
    description: 'Room priority thermostat logging level (T9-T10 only).',
    default: '',
  },
  {
    name: 'Logging.RoomSensorLevel',
    description: 'Room sensor logging level (T9-T10 only).',
    default: '',
  },
]