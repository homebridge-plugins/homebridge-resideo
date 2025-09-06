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
    description: 'Basic device configuration options.',
  },
  {
    name: 'Thermostat',
    description: 'Thermostat-specific configuration options.',
  },
  {
    name: 'RoomSensor',
    description: 'Room sensor configuration options (T9/T10 only).',
  },
  {
    name: 'RoomPriority',
    description: 'Room priority and follow-me settings (T9/T10 only).',
  },
  {
    name: 'LeakSensor',
    description: 'Leak sensor configuration options.',
  },
  {
    name: 'Valve',
    description: 'Shutoff valve configuration options.',
  },
  {
    name: 'Performance',
    description: 'API polling and performance options.',
  },
  {
    name: 'Logging',
    description: 'Device-specific logging options.',
  },
]

/**
 * Resideo feature options.
 */
export const featureOptions = [
  // Device Options
  {
    name: 'Device.Hide',
    description: 'Hide this device from HomeKit entirely.',
    default: false,
  },
  {
    name: 'Device.SyncName',
    description: 'Use the device name from Resideo as the HomeKit accessory name.',
    default: true,
  },
  {
    name: 'Device.ExternalAccessory',
    description: 'Publish this device as an external accessory (advanced users only).',
    default: false,
  },
  {
    name: 'Device.EnableRetry',
    description: 'Retry API calls if they fail due to network or server errors.',
    default: true,
  },
  {
    name: 'Device.FirmwareOverride',
    description: 'Override the firmware version reported to HomeKit (e.g., "1.2.8").',
    type: 'string',
    default: '',
  },

  // Thermostat Options
  {
    name: 'Thermostat.ShowAutoMode',
    description: 'Show Auto mode in HomeKit, even if the device API doesn\'t normally support it.',
    default: false,
    deviceFilter: ['Thermostat'],
  },
  {
    name: 'Thermostat.HideFan',
    description: 'Hide the fan controls from HomeKit.',
    default: false,
    deviceFilter: ['Thermostat'],
  },
  {
    name: 'Thermostat.HideHumidity',
    description: 'Hide the humidity sensor from HomeKit.',
    default: false,
    deviceFilter: ['Thermostat'],
  },
  {
    name: 'Thermostat.StatefulSwitch',
    description: 'Enable stateful programmable switch for hold status (NoHold, TemporaryHold, PermanentHold).',
    default: false,
    deviceFilter: ['Thermostat'],
  },
  {
    name: 'Thermostat.SetpointStatus',
    description: 'Default setpoint behavior when changing temperature.',
    type: 'select',
    options: [
      { value: 'PermanentHold', label: 'Permanent Hold - Hold until manually changed' },
      { value: 'TemporaryHold', label: 'Temporary Hold - Hold until next schedule period' },
      { value: 'NoHold', label: 'No Hold - Return to schedule immediately' },
    ],
    default: 'PermanentHold',
    deviceFilter: ['Thermostat'],
    modelFilter: ['T9', 'T10', 'T5', 'T6'],
  },

  // Room Sensor Options (T9/T10 only)
  {
    name: 'RoomSensor.HideAll',
    description: 'Hide all room sensors associated with this thermostat.',
    default: false,
    deviceFilter: ['Thermostat'],
    modelFilter: ['T9', 'T10'],
  },
  {
    name: 'RoomSensor.HideTemperature',
    description: 'Hide temperature sensors from room sensors.',
    default: false,
    deviceFilter: ['Thermostat'],
    modelFilter: ['T9', 'T10'],
  },
  {
    name: 'RoomSensor.HideHumidity',
    description: 'Hide humidity sensors from room sensors.',
    default: false,
    deviceFilter: ['Thermostat'],
    modelFilter: ['T9', 'T10'],
  },
  {
    name: 'RoomSensor.HideOccupancy',
    description: 'Hide occupancy sensors from room sensors.',
    default: false,
    deviceFilter: ['Thermostat'],
    modelFilter: ['T9', 'T10'],
  },
  {
    name: 'RoomSensor.RefreshRate',
    description: 'How often to poll room sensor data (seconds, minimum 30).',
    type: 'number',
    min: 30,
    default: 360,
    deviceFilter: ['Thermostat'],
    modelFilter: ['T9', 'T10'],
  },
  {
    name: 'RoomSensor.PushRate',
    description: 'Minimum time between room sensor API commands (seconds).',
    type: 'number',
    min: 1,
    default: 360,
    deviceFilter: ['Thermostat'],
    modelFilter: ['T9', 'T10'],
  },

  // Room Priority Options (T9/T10 only)
  {
    name: 'RoomPriority.PriorityType',
    description: 'How the thermostat determines which rooms to prioritize.',
    type: 'select',
    options: [
      { value: 'PickARoom', label: 'Pick A Room - Use specific selected rooms' },
      { value: 'WholeHouse', label: 'Whole House - Use all room sensors equally' },
      { value: 'FollowMe', label: 'Follow Me - Use rooms with detected motion' },
    ],
    default: 'PickARoom',
    deviceFilter: ['Thermostat'],
    modelFilter: ['T9', 'T10'],
  },
  {
    name: 'RoomPriority.RefreshRate',
    description: 'How often to poll room priority data (seconds, minimum 30).',
    type: 'number',
    min: 30,
    default: 360,
    deviceFilter: ['Thermostat'],
    modelFilter: ['T9', 'T10'],
  },
  {
    name: 'RoomPriority.PushRate',
    description: 'Minimum time between room priority API commands (seconds).',
    type: 'number',
    min: 1,
    default: 360,
    deviceFilter: ['Thermostat'],
    modelFilter: ['T9', 'T10'],
  },

  // Leak Sensor Options
  {
    name: 'LeakSensor.HideLeakDetector',
    description: 'Hide the leak detection sensor.',
    default: false,
    deviceFilter: ['LeakDetector'],
  },
  {
    name: 'LeakSensor.HideTemperature',
    description: 'Hide the temperature sensor.',
    default: false,
    deviceFilter: ['LeakDetector'],
  },
  {
    name: 'LeakSensor.HideHumidity',
    description: 'Hide the humidity sensor.',
    default: false,
    deviceFilter: ['LeakDetector'],
  },

  // Valve Options
  {
    name: 'Valve.ValveType',
    description: 'The type of valve behavior to expose to HomeKit.',
    type: 'select',
    options: [
      { value: '0', label: 'Generic Valve' },
      { value: '1', label: 'Irrigation Valve' },
      { value: '2', label: 'Shower Head Valve' },
      { value: '3', label: 'Water Faucet Valve' },
    ],
    default: '3',
    deviceFilter: ['ShutoffValve'],
  },

  // Performance Options
  {
    name: 'Performance.RefreshRate',
    description: 'How often to poll this device for updates (seconds, minimum 30).',
    type: 'number',
    min: 30,
    default: 360,
  },
  {
    name: 'Performance.PushRate',
    description: 'Minimum time between API commands to this device (seconds).',
    type: 'number',
    min: 1,
    default: 1,
  },

  // Logging Options
  {
    name: 'Logging.Level',
    description: 'Override the global logging level for this device.',
    type: 'select',
    options: [
      { value: '', label: 'Use Global Setting' },
      { value: 'none', label: 'No Logging' },
      { value: 'standard', label: 'Standard Logging' },
      { value: 'debug', label: 'Debug Logging' },
    ],
    default: '',
  },
  {
    name: 'Logging.SuppressDebug',
    description: 'Suppress debug logging for this device even if globally enabled.',
    default: false,
  },

  // Legacy compatibility options (for migration)
  {
    name: 'Legacy.DeviceClass',
    description: 'Device type classification (automatically detected).',
    type: 'select',
    options: [
      { value: 'Thermostat', label: 'Thermostat' },
      { value: 'LeakDetector', label: 'Leak Sensor' },
      { value: 'ShutoffValve', label: 'Shutoff Valve' },
    ],
    default: 'Thermostat',
    hidden: true, // Hidden from UI, used internally
  },
  {
    name: 'Legacy.DeviceModel',
    description: 'Device model (automatically detected).',
    type: 'string',
    default: '',
    hidden: true, // Hidden from UI, used internally
  },
]
