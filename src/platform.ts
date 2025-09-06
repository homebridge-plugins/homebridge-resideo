import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
/* Copyright(C) 2022-2024, donavanbecker (https://github.com/donavanbecker). All rights reserved.
 *
 * platform.ts: homebridge-resideo.
 */
import type { API, DynamicPlatformPlugin, HAP, Logging, PlatformAccessory } from 'homebridge'

import type {
  accessoryAttribute,
  devicesConfig,
  location,
  locations,
  options,
  resideoDevice,
  ResideoPlatformConfig,
  sensorAccessory,

  T9groups,
} from './settings.js'

import { readFileSync, writeFileSync } from 'node:fs'
import { argv } from 'node:process'
import { stringify } from 'node:querystring'

import axios from 'axios'

import { LeakSensor } from './devices/leaksensors.js'
import { RoomSensors } from './devices/roomsensors.js'
import { RoomSensorThermostat } from './devices/roomsensorthermostats.js'
import { Thermostats } from './devices/thermostats.js'
import { Valve } from './devices/valve.js'
import {
  DeviceURL,
  LocationURL,
  PLATFORM_NAME,
  PLUGIN_NAME,
  TokenURL,
} from './settings.js'

export class ResideoPlatform implements DynamicPlatformPlugin {
  public accessories: PlatformAccessory[] = []
  public readonly api: API
  public readonly log: Logging
  protected readonly hap: HAP
  public config!: ResideoPlatformConfig
  public sensorData = []
  refreshInterval: any
  locations?: locations
  sensorAccessory!: sensorAccessory
  firmware!: accessoryAttribute['softwareRevision']
  platformConfig!: ResideoPlatformConfig
  platformLogging!: options['logging']
  platformRefreshRate!: options['refreshRate']
  platformPushRate!: options['pushRate']
  platformUpdateRate!: options['updateRate']
  platformMaxRetries: options['maxRetries']
  platformDelayBetweenRetries: options['delayBetweenRetries']
  debugMode!: boolean
  version!: string
  action!: string
  private apiHealthStatus: {
    lastSuccessfulCall: number
    consecutiveFailures: number
    isHealthy: boolean
  } = {
    lastSuccessfulCall: Date.now(),
    consecutiveFailures: 0,
    isHealthy: true,
  }

  public axios: AxiosInstance = axios.create({
    responseType: 'json',
  })

  constructor(log: Logging, config: ResideoPlatformConfig, api: API) {
    this.api = api
    this.hap = this.api.hap
    this.log = log
    if (!config) {
      return
    }

    this.config = {
      platform: 'Resideo',
      name: config.name,
      credentials: config.credentials,
      options: config.options,
    }

    // Plugin Configuration
    this.getPlatformLogSettings()
    this.getPlatformRateSettings()
    this.getPlatformConfigSettings()
    this.getVersion()

    // Finish initializing the platform
    this.debugLog(`Finished initializing platform: ${config.name}`)

    try {
      this.verifyConfig()
      this.debugLog('Config OK')
    } catch (e: any) {
      this.action = 'get Valid Config'
      this.apiError(e)
      return
    }

    // setup axios interceptor to add headers / api key to each request
    this.axios.interceptors.request.use((request: InternalAxiosRequestConfig) => {
      request.headers!.Authorization = `Bearer ${this.config.credentials?.accessToken}`
      request.params = request.params || {}
      request.params.apikey = this.config.credentials?.consumerKey
      request.headers!['Content-Type'] = 'application/json'
      request.headers!['Accept'] = 'application/json'
      request.headers!['User-Agent'] = `homebridge-resideo/${this.version || '1.0.0'}`
      
      // Add request timeout (configurable via options, defaults to 30 seconds)
      const defaultTimeout = this.config.options?.apiTimeout || 30000
      request.timeout = request.timeout || defaultTimeout
      
      this.debugLog(`API Request: ${request.method?.toUpperCase()} ${request.url}`)
      return request
    })

    // Add response interceptor for better error handling and logging
    this.axios.interceptors.response.use(
      (response) => {
        this.debugLog(`API Response: ${response.status} ${response.statusText} for ${response.config.method?.toUpperCase()} ${response.config.url}`)
        
        // Update API health status on successful responses
        this.updateApiHealthStatus(true)
        
        return response
      },
      (error) => {
        // Enhanced error logging
        if (error.response) {
          this.debugLog(`API Error Response: ${error.response.status} ${error.response.statusText} for ${error.config?.method?.toUpperCase()} ${error.config?.url}`)
        } else if (error.request) {
          this.debugLog(`API Network Error: No response received for ${error.config?.method?.toUpperCase()} ${error.config?.url}`)
        } else {
          this.debugLog(`API Request Setup Error: ${error.message}`)
        }
        
        // Update API health status on failures
        this.updateApiHealthStatus(false)
        
        return Promise.reject(error)
      },
    )

    this.api.on('didFinishLaunching', async () => {
      this.debugLog('Executed didFinishLaunching callback')
      await this.refreshAccessToken()
      if (this.config.credentials?.accessToken) {
        this.debugLog(`accessToken: ${this.config.credentials?.accessToken}`)
        
        // Validate API connection before discovering devices
        if (this.config.options?.enableApiHealthCheck !== false) {
          const apiHealthy = await this.validateApiConnection()
          if (!apiHealthy) {
            this.errorLog('API connection validation failed. Some features may not work properly.')
          }
        }
        
        try {
          this.discoverDevices()
        } catch (e: any) {
          this.action = 'Discover Device'
          this.apiError(e)
        }
      } else {
        this.errorLog('Missing Access Token. Re-Link Your Resideo Account.')
      }
    })
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.debugLog(`Loading accessory from cache: ${accessory.displayName}`)
    this.accessories.push(accessory)
  }

  verifyConfig() {
    this.config.options = this.config.options || {}
    this.config.credentials = this.config.credentials || {}

    if (this.config.options.devices) {
      for (const deviceConfig of this.config.options.devices) {
        if (!deviceConfig.hide_device && !deviceConfig.deviceClass) {
          throw new Error('The devices config section is missing the "Device Type" in the config, Check Your Config.')
        }
        if (!deviceConfig.deviceID) {
          throw new Error('The devices config section is missing the "Device ID" in the config, Check Your Config.')
        }
      }
    }

    if (this.config.options.refreshRate! < 30) {
      throw new Error('Refresh Rate must be above 30 seconds.')
    }

    if (!this.config.options.refreshRate) {
      this.config.options.refreshRate = 120
      this.debugWarnLog('Using Default Refresh Rate of 2 Minutes.')
    }

    if (!this.config.options.pushRate) {
      this.config.options.pushRate = 0.1
      this.debugWarnLog('Using Default Push Rate.')
    }

    if (!this.config.credentials) {
      throw new Error('Missing Credentials')
    }
    if (!this.config.credentials.consumerKey) {
      throw new Error('Missing consumerKey')
    }
    if (!this.config.credentials.refreshToken) {
      throw new Error('Missing refreshToken')
    }
  }

  async refreshAccessToken() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
    this.refreshInterval = setInterval(async () => this.getAccessToken(), (1800 / 3) * 1000)
    await this.getAccessToken()
  }

  async getAccessToken() {
    try {
      let result: any

      if (this.config.credentials!.consumerSecret && this.config.credentials?.consumerKey && this.config.credentials?.refreshToken) {
        result = (
          await axios({
            url: TokenURL,
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            auth: {
              username: this.config.credentials.consumerKey,
              password: this.config.credentials.consumerSecret,
            },
            data: stringify({
              grant_type: 'refresh_token',
              refresh_token: this.config.credentials.refreshToken,
            }),
            responseType: 'json',
          })
        ).data
      } else {
        this.warnLog('Please re-link your account in the Homebridge UI.')
      }

      this.config.credentials!.accessToken = result.access_token
      this.debugLog(`Got access token: ${this.config.credentials!.accessToken}`)
      // check if the refresh token has changed
      if (result.refresh_token !== this.config.credentials!.refreshToken) {
        this.debugLog(`New refresh token: ${result.refresh_token}`)
        await this.updateRefreshToken(result.refresh_token)
      }

      this.config.credentials!.refreshToken = result.refresh_token
    } catch (e: any) {
      this.action = 'refresh access token'
      this.apiError(e)
    }
  }

  async updateRefreshToken(newRefreshToken: string) {
    try {
      if (!newRefreshToken) {
        throw new Error('New token not provided')
      }

      const currentConfig = JSON.parse(readFileSync(this.api.user.configPath(), 'utf8'))
      if (!Array.isArray(currentConfig.platforms)) {
        throw new TypeError('Cannot find platforms array in config')
      }

      const pluginConfig = currentConfig.platforms.find((x: { platform: string }) => x.platform === PLATFORM_NAME)
      if (!pluginConfig) {
        throw new Error(`Cannot find config for ${PLATFORM_NAME} in platforms array`)
      }

      if (typeof pluginConfig.credentials !== 'object') {
        throw new TypeError('pluginConfig.credentials is not an object')
      }

      pluginConfig.credentials.refreshToken = newRefreshToken
      writeFileSync(this.api.user.configPath(), JSON.stringify(currentConfig, null, 4))
      this.debugLog('Homebridge config.json has been updated with new refresh token.')
    } catch (e: any) {
      this.action = 'refresh token in config'
      this.apiError(e)
    }
  }

  async discoverlocations(): Promise<location[]> {
    const locations = (await this.retryApiCall(() => this.axios.get(LocationURL))).data
    return locations
  }

  /**
   * Enhanced API call wrapper with retry logic for rate limiting and temporary errors
   */
  private async retryApiCall<T>(
    apiCall: () => Promise<T>,
    maxRetries?: number,
    baseDelay?: number,
  ): Promise<T> {
    const retries = maxRetries ?? this.config.options?.apiRetryAttempts ?? 3
    const delay = baseDelay ?? this.config.options?.apiRetryDelay ?? 1000
    let lastError: any
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await apiCall()
      } catch (error: any) {
        lastError = error
        const status = error.response?.status
        
        // Don't retry for certain error types
        if (status === 400 || status === 401 || status === 403 || status === 404) {
          throw error
        }
        
        // Retry for rate limits, server errors, and network issues
        if (attempt < retries && (status === 429 || status >= 500 || !status)) {
          const retryAfter = error.response?.headers['retry-after']
          let waitTime = delay * Math.pow(2, attempt - 1) // Exponential backoff
          
          if (retryAfter) {
            waitTime = Math.max(waitTime, parseInt(retryAfter) * 1000)
          }
          
          this.warnLog(`API call failed (attempt ${attempt}/${retries}), retrying in ${waitTime}ms. Status: ${status || 'Network Error'}`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
        
        throw error
      }
    }
    
    throw lastError
  }

  /**
   * Public wrapper for device classes to make resilient API calls
   */
  public async makeApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
    return this.retryApiCall(apiCall)
  }

  /**
   * Update API health status tracking
   */
  private updateApiHealthStatus(success: boolean) {
    if (success) {
      this.apiHealthStatus.lastSuccessfulCall = Date.now()
      this.apiHealthStatus.consecutiveFailures = 0
      
      // Mark as healthy if we had failures but now succeeded
      if (!this.apiHealthStatus.isHealthy) {
        this.apiHealthStatus.isHealthy = true
        this.infoLog('Resideo API connection restored')
      }
    } else {
      this.apiHealthStatus.consecutiveFailures++
      
      // Mark as unhealthy after 3 consecutive failures
      if (this.apiHealthStatus.consecutiveFailures >= 3 && this.apiHealthStatus.isHealthy) {
        this.apiHealthStatus.isHealthy = false
        this.errorLog(`Resideo API appears unhealthy (${this.apiHealthStatus.consecutiveFailures} consecutive failures)`)
      }
    }
  }

  /**
   * Check if API is healthy and accessible
   */
  public isApiHealthy(): boolean {
    const timeSinceLastSuccess = Date.now() - this.apiHealthStatus.lastSuccessfulCall
    const maxTimeSinceSuccess = 10 * 60 * 1000 // 10 minutes
    
    return this.apiHealthStatus.isHealthy && timeSinceLastSuccess < maxTimeSinceSuccess
  }

  /**
   * Validate API credentials and connectivity
   */
  async validateApiConnection(): Promise<boolean> {
    try {
      this.action = 'validate API connection'
      const response = await this.retryApiCall(() => this.axios.get(LocationURL), 2, 2000)
      
      if (response.data && Array.isArray(response.data)) {
        this.infoLog(`API connection validated successfully. Found ${response.data.length} location(s).`)
        return true
      } else {
        this.warnLog('API connection returned unexpected data format.')
        return false
      }
    } catch (error: any) {
      this.errorLog('API connection validation failed.')
      this.apiError(error)
      return false
    }
  }

  /**
   * Get thermostat schedule information
   */
  async getThermostatSchedule(deviceId: string | number, locationId: string | number): Promise<any> {
    try {
      this.action = 'get thermostat schedule'
      const response = await this.retryApiCall(() =>
        this.axios.get(`${DeviceURL}/thermostats/${deviceId}/schedule`, {
          params: { locationId },
        })
      )
      
      this.debugLog(`Retrieved schedule for thermostat ${deviceId}`)
      return response.data
    } catch (error: any) {
      this.apiError(error)
      throw error
    }
  }

  /**
   * Set thermostat schedule
   */
  async setThermostatSchedule(deviceId: string | number, locationId: string | number, scheduleData: any): Promise<void> {
    try {
      this.action = 'set thermostat schedule'
      await this.retryApiCall(() =>
        this.axios.put(`${DeviceURL}/thermostats/${deviceId}/schedule`, scheduleData, {
          params: { locationId },
        })
      )
      
      this.infoLog(`Updated schedule for thermostat ${deviceId}`)
    } catch (error: any) {
      this.apiError(error)
      throw error
    }
  }

  /**
   * Get device capabilities and features
   */
  async getDeviceCapabilities(deviceId: string | number, locationId: string | number, deviceType: string): Promise<any> {
    try {
      this.action = 'get device capabilities'
      let endpoint: string
      
      switch (deviceType.toLowerCase()) {
        case 'thermostat':
          endpoint = `${DeviceURL}/thermostats/${deviceId}/capabilities`
          break
        case 'waterleakdetector':
          endpoint = `${DeviceURL}/waterLeakDetectors/${deviceId}/capabilities`
          break
        case 'shutoffvalve':
          endpoint = `${DeviceURL}/shutoffvalve/${deviceId}/capabilities`
          break
        default:
          throw new Error(`Unsupported device type for capabilities: ${deviceType}`)
      }
      
      const response = await this.retryApiCall(() =>
        this.axios.get(endpoint, {
          params: { locationId },
        })
      )
      
      this.debugLog(`Retrieved capabilities for ${deviceType} ${deviceId}`)
      return response.data
    } catch (error: any) {
      // Capabilities endpoint might not exist for all devices, so don't log as error
      this.debugLog(`Could not retrieve capabilities for ${deviceType} ${deviceId}: ${error.message}`)
      return null
    }
  }

  public async getCurrentSensorData(location: location, device: resideoDevice & devicesConfig, group: T9groups) {
    const cacheKey = device.deviceID
    const now = Date.now()
    const cacheExpiry = 45000 // 45 seconds cache
    
    if (!this.sensorData[cacheKey] || this.sensorData[cacheKey].timestamp < now) {
      try {
        const response: any = await this.retryApiCall(() => 
          this.axios.get(`${DeviceURL}/thermostats/${device.deviceID}/group/${group.id}/rooms`, {
            params: {
              locationId: location.locationID,
            },
          })
        )
        
        this.sensorData[cacheKey] = {
          timestamp: now + cacheExpiry,
          data: this.normalizeSensorDate(response.data),
        }
        
        this.debugLog(`getCurrentSensorData refreshed for ${device.deviceType} ${device.deviceModel}: ${device.userDefinedDeviceName}`)
      } catch (error: any) {
        this.action = 'get sensor data'
        this.apiError(error)
        
        // Return cached data if available, even if expired
        if (this.sensorData[cacheKey]) {
          this.warnLog(`Using expired sensor cache for ${device.userDefinedDeviceName} due to API error`)
          return this.sensorData[cacheKey].data
        }
        
        throw error
      }
    } else {
      this.debugLog(`getCurrentSensorData using cache for ${device.deviceType} ${device.deviceModel} - ${device.userDefinedDeviceName}`)
    }
    
    return this.sensorData[cacheKey].data
  }

  private normalizeSensorDate(sensorRoomData: { rooms: any }) {
    const normalized = [] as any
    for (const room of sensorRoomData.rooms) {
      normalized[room.id] = [] as any
      for (const sensorAccessory of room.accessories) {
        sensorAccessory.roomId = room.id
        normalized[room.id][sensorAccessory.accessoryId] = sensorAccessory
      }
    }
    return normalized
  }

  public async getSoftwareRevision(location: location, device: resideoDevice & devicesConfig) {
    if (device.deviceModel.startsWith('T9') && device.groups) {
      for (const group of device.groups) {
        const roomsensors = await this.getCurrentSensorData(location, device, group)
        if (device.thermostat?.roompriority?.deviceType) {
          this.infoLog(`Total Rooms Found: ${roomsensors.length}`)
        }
        for (const accessories of roomsensors) {
          for (const key in accessories) {
            const sensorAccessory = accessories[key]
            if (sensorAccessory.accessoryAttribute?.type?.startsWith('Thermostat')) {
              this.debugLog(`groupId: ${group.id}, roomId: ${sensorAccessory.roomId}, accessoryId: ${sensorAccessory.accessoryId}, name: ${sensorAccessory.accessoryAttribute.name}, softwareRevision: ${sensorAccessory.accessoryAttribute.softwareRevision}`)
              return sensorAccessory.accessoryAttribute.softwareRevision
            }
          }
        }
      }
    }
  }

  private async discoverDevices() {
    try {
      const locations = await this.discoverlocations() as locations ?? []
      this.infoLog(`Total Locations Found: ${locations?.length}`)
      if (locations.length > 0) {
        for (const location of locations) {
          this.infoLog(`Total Devices Found at ${location.name}: ${location.devices.length}`)
          const deviceLists = location.devices
          const devices = this.config.options?.devices
            ? this.mergeByDeviceID(deviceLists.map((device) => {
                const deviceID = String(device.deviceID).trim()
                this.debugLog(`Device List deviceID: ${deviceID}`)
                return { ...device, deviceID }
              }), this.config.options.devices.map((device) => {
                const deviceID = String(device.deviceID).trim()
                this.debugLog(`Config deviceID: ${deviceID}`)
                return { ...device, deviceID }
              }))
            : deviceLists.map((device: resideoDevice) => {
                const deviceID = String(device.deviceID).trim()
                this.debugLog(`Device List deviceID: ${deviceID} (no config, using defaults)`)
                return { 
                  ...device, 
                  deviceID,
                  configDeviceName: device.userDefinedDeviceName, // Use API name as default
                  hide_device: false, // Show device by default
                  external: false, // Platform device by default
                } as resideoDevice & devicesConfig
              })
          for (const device of devices) {
            this.debugLog(`Discovered Device with Config: ${JSON.stringify(device)}`)
            await this.deviceClass(location, device)
          }
        }
      } else {
        this.debugWarnLog('No locations found.')
      }
    } catch (e: any) {
      this.action = 'Discover Locations'
      this.apiError(e)
    }
  }

  private mergeByDeviceID(a1: { deviceID: string }[], a2: any[]) {
    return a1.map((itm: { deviceID: string }) => {
      const match = a2.find((item: { deviceID: string }) => item.deviceID === itm.deviceID)
      if (match) {
        this.debugLog(`Merging deviceID: ${itm.deviceID}`)
      } else {
        this.debugLog(`No match found for deviceID: ${itm.deviceID}`)
      }
      return {
        ...match,
        ...itm,
      }
    })
  }

  private async deviceClass(location: location, device: resideoDevice & devicesConfig) {
    switch (device.deviceClass) {
      case 'ShutoffValve':
        this.debugLog(`Discovered ${device.userDefinedDeviceName} ${device.deviceClass} @ ${location.name}`)
        this.createValve(location, device)
        break
      case 'LeakDetector':
        this.debugLog(`Discovered ${device.userDefinedDeviceName} ${device.deviceClass} @ ${location.name}`)
        this.createLeak(location, device)
        break
      case 'Thermostat':
        this.debugLog(`Discovered ${device.userDefinedDeviceName} ${device.deviceClass} (${device.deviceModel}) @ ${location.name}`)
        await this.createThermostat(location, device)
        if (device.deviceModel.startsWith('T9')) {
          try {
            this.debugLog(`Discovering Room Sensor(s) for ${device.userDefinedDeviceName} ${device.deviceClass} (${device.deviceModel})`)
            await this.discoverRoomSensors(location, device)
          } catch (e: any) {
            this.action = 'Find Room Sensor(s)'
            this.apiError(e)
          }
        }
        break
      default:
        this.infoLog(`Device: ${device.userDefinedDeviceName} with Device Class: ${device.deviceClass} is currently not supported. Submit Feature Requests Here: https://git.io/JURLY`)
    }
  }

  private async discoverRoomSensors(location: location, device: resideoDevice & devicesConfig) {
    this.roomsensordisplaymethod(device)
    if (device.groups) {
      this.debugLog(`Discovered ${device.groups.length} Group(s) for ${device.userDefinedDeviceName} ${device.deviceClass} (${device.deviceModel})`)
      for (const group of device.groups) {
        const roomsensors = await this.getCurrentSensorData(location, device, group)
        for (const accessories of roomsensors) {
          for (const key in accessories) {
            const sensorAccessory = accessories[key]
            if (sensorAccessory.accessoryAttribute?.type?.startsWith('IndoorAirSensor')) {
              this.debugLog(`Discovered Room Sensor groupId: ${sensorAccessory.roomId}, roomId: ${sensorAccessory.accessoryId}, accessoryId: ${sensorAccessory.accessoryAttribute.name}`)
              if (sensorAccessory.accessoryAttribute.model === '0') {
                sensorAccessory.accessoryAttribute.model = '4352'
              }
              this.createRoomSensors(location, device, group, sensorAccessory)
              this.createRoomSensorThermostat(location, device, group, sensorAccessory)
            }
          }
        }
      }
    }
  }

  private roomsensordisplaymethod(device: resideoDevice & devicesConfig) {
    if (device.thermostat?.roompriority) {
      if (device.thermostat?.roompriority.deviceType && !device.hide_device) {
        this.warnLog('Displaying Thermostat(s) for Each Room Sensor(s).')
      }
      if (!device.thermostat?.roompriority.deviceType && !device.hide_device) {
        this.warnLog('Only Displaying Room Sensor(s).')
      }
    }
  }

  private async createThermostat(location: location, device: resideoDevice & devicesConfig) {
    const uuid = this.api.hap.uuid.generate(`${device.deviceID}-${device.deviceClass}`)
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid)

    if (existingAccessory) {
      if (await this.registerDevice(device)) {
        this.infoLog(`Restoring existing accessory from cache: ${existingAccessory.displayName} DeviceID: ${device.deviceID}`)
        existingAccessory.displayName = device.configDeviceName
          ? await this.validateAndCleanDisplayName(device.configDeviceName, 'configDeviceName', device.userDefinedDeviceName)
          : await this.validateAndCleanDisplayName(device.userDefinedDeviceName, 'userDefinedDeviceName', device.userDefinedDeviceName)
        await this.thermostatFirmwareExistingAccessory(device, existingAccessory, location)
        existingAccessory.context.device = device
        existingAccessory.context.deviceID = device.deviceID
        existingAccessory.context.model = device.deviceModel
        this.api.updatePlatformAccessories([existingAccessory])
        new Thermostats(this, existingAccessory, location, device)
        this.debugLog(`${device.deviceClass} uuid: ${device.deviceID}-${device.deviceClass} (${existingAccessory.UUID})`)
      } else {
        this.unregisterPlatformAccessories(existingAccessory)
      }
    } else if (await this.registerDevice(device)) {
      if (!device.external) {
        this.infoLog(`Adding new accessory: ${device.userDefinedDeviceName} ${device.deviceClass} Device ID: ${device.deviceID}`)
      }
      const accessory = new this.api.platformAccessory(device.userDefinedDeviceName, uuid)
      await this.thermostatFirmwareNewAccessory(device, accessory, location)
      accessory.displayName = device.configDeviceName
        ? await this.validateAndCleanDisplayName(device.configDeviceName, 'configDeviceName', device.userDefinedDeviceName)
        : await this.validateAndCleanDisplayName(device.userDefinedDeviceName, 'userDefinedDeviceName', device.userDefinedDeviceName)
      accessory.context.device = device
      accessory.context.deviceID = device.deviceID
      accessory.context.model = device.deviceModel
      new Thermostats(this, accessory, location, device)
      this.debugLog(`${device.deviceClass} uuid: ${device.deviceID}-${device.deviceClass} (${accessory.UUID})`)
      this.externalOrPlatform(device, accessory)
      this.accessories.push(accessory)
    } else {
      this.debugErrorLog(`Unable to Register new device: ${device.userDefinedDeviceName} ${device.deviceModel} DeviceID: ${device.deviceID}, Check Config to see if DeviceID is being Hidden.`)
    }
  }

  private async createLeak(location: location, device: resideoDevice & devicesConfig) {
    const uuid = this.api.hap.uuid.generate(`${device.deviceID}-${device.deviceClass}`)
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid)

    if (existingAccessory) {
      if (await this.registerDevice(device)) {
        this.infoLog(`Restoring existing accessory from cache: ${existingAccessory.displayName} DeviceID: ${device.deviceID}`)
        existingAccessory.displayName = device.configDeviceName
          ? await this.validateAndCleanDisplayName(device.configDeviceName, 'configDeviceName', device.userDefinedDeviceName)
          : await this.validateAndCleanDisplayName(device.userDefinedDeviceName, 'userDefinedDeviceName', device.userDefinedDeviceName)
        existingAccessory.context.deviceID = device.deviceID
        existingAccessory.context.model = device.deviceClass
        this.leaksensorFirmwareExistingAccessory(device, existingAccessory)
        this.api.updatePlatformAccessories([existingAccessory])
        new LeakSensor(this, existingAccessory, location, device)
        this.debugLog(`${device.deviceClass} uuid: ${device.deviceID}-${device.deviceClass} (${existingAccessory.UUID})`)
      } else {
        this.unregisterPlatformAccessories(existingAccessory)
      }
    } else if (await this.registerDevice(device)) {
      if (!device.external) {
        this.infoLog(`Adding new accessory: ${device.userDefinedDeviceName} ${device.deviceClass} Device ID: ${device.deviceID}`)
      }
      const accessory = new this.api.platformAccessory(device.userDefinedDeviceName, uuid)
      accessory.displayName = device.configDeviceName
        ? await this.validateAndCleanDisplayName(device.configDeviceName, 'configDeviceName', device.userDefinedDeviceName)
        : await this.validateAndCleanDisplayName(device.userDefinedDeviceName, 'userDefinedDeviceName', device.userDefinedDeviceName)
      accessory.context.device = device
      accessory.context.deviceID = device.deviceID
      accessory.context.model = device.deviceClass
      this.leaksensorFirmwareNewAccessory(device, accessory)
      new LeakSensor(this, accessory, location, device)
      this.debugLog(`${device.deviceClass} uuid: ${device.deviceID}-${device.deviceClass} (${accessory.UUID})`)
      this.externalOrPlatform(device, accessory)
      this.accessories.push(accessory)
    } else {
      this.debugErrorLog(`Unable to Register new device: ${device.userDefinedDeviceName} ${device.deviceType} DeviceID: ${device.deviceID}, Check Config to see if DeviceID is being Hidden.`)
    }
  }

  private async createValve(location: location, device: resideoDevice & devicesConfig) {
    const uuid = this.api.hap.uuid.generate(`${device.deviceID}-${device.deviceClass}`)

    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid)

    if (existingAccessory) {
      if (await this.registerDevice(device)) {
        this.infoLog(`Restoring existing accessory from cache: ${existingAccessory.displayName} DeviceID: ${device.deviceID}`)
        existingAccessory.displayName = device.configDeviceName
          ? await this.validateAndCleanDisplayName(device.configDeviceName, 'configDeviceName', device.userDefinedDeviceName)
          : await this.validateAndCleanDisplayName(device.userDefinedDeviceName, 'userDefinedDeviceName', device.userDefinedDeviceName)
        existingAccessory.context.deviceID = device.deviceID
        existingAccessory.context.model = device.deviceClass
        this.valveFirmwareExistingAccessory(device, existingAccessory)
        this.api.updatePlatformAccessories([existingAccessory])
        new Valve(this, existingAccessory, location, device)
        this.debugLog(`${device.deviceClass} uuid: ${device.deviceID}-${device.deviceClass} (${existingAccessory.UUID})`)
      } else {
        this.unregisterPlatformAccessories(existingAccessory)
      }
    } else if (await this.registerDevice(device)) {
      if (!device.external) {
        this.infoLog(`Adding new accessory: ${device.userDefinedDeviceName} ${device.deviceClass} Device ID: ${device.deviceID}`)
      }
      const accessory = new this.api.platformAccessory(device.userDefinedDeviceName, uuid)
      accessory.displayName = device.configDeviceName
        ? await this.validateAndCleanDisplayName(device.configDeviceName, 'configDeviceName', device.userDefinedDeviceName)
        : await this.validateAndCleanDisplayName(device.userDefinedDeviceName, 'userDefinedDeviceName', device.userDefinedDeviceName)
      accessory.context.device = device
      accessory.context.deviceID = device.deviceID
      accessory.context.model = device.deviceClass
      this.valveFirmwareNewAccessory(device, accessory)
      new Valve(this, accessory, location, device)
      this.debugLog(`${device.deviceClass} uuid: ${device.deviceID}-${device.deviceClass} (${accessory.UUID})`)
      this.externalOrPlatform(device, accessory)
      this.accessories.push(accessory)
    } else {
      this.debugErrorLog(`Unable to Register new device: ${device.userDefinedDeviceName} ${device.deviceType} DeviceID: ${device.deviceID}, Check Config to see if DeviceID is being Hidden.`)
    }
  }

  private async createRoomSensors(location: location, device: resideoDevice & devicesConfig, group: T9groups, sensorAccessory: sensorAccessory) {
    const uuid = this.api.hap.uuid.generate(`${sensorAccessory.accessoryAttribute.type}-${sensorAccessory.accessoryAttribute.serialNumber}-RoomSensor`)
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid)

    if (existingAccessory) {
      if (await this.registerDevice(device)) {
        this.infoLog(`Restoring existing accessory from cache: ${existingAccessory.displayName} Serial Number: ${sensorAccessory.accessoryAttribute.serialNumber}`)
        existingAccessory.displayName = device.configDeviceName
          ? await this.validateAndCleanDisplayName(device.configDeviceName, 'configDeviceName', device.userDefinedDeviceName)
          : await this.validateAndCleanDisplayName(sensorAccessory.accessoryAttribute.name, 'accessoryAttributeName', sensorAccessory.accessoryAttribute.name)
        existingAccessory.context.deviceID = sensorAccessory.accessoryAttribute.serialNumber
        existingAccessory.context.model = sensorAccessory.accessoryAttribute.model
        this.roomsensorFirmwareExistingAccessory(existingAccessory, sensorAccessory)
        this.api.updatePlatformAccessories([existingAccessory])
        new RoomSensors(this, existingAccessory, location, device, sensorAccessory, group)
        this.debugLog(`${sensorAccessory.accessoryAttribute.type} uuid: ${sensorAccessory.accessoryAttribute.type}-${sensorAccessory.accessoryId}-RoomSensor, (${existingAccessory.UUID})`)
      } else {
        this.unregisterPlatformAccessories(existingAccessory)
      }
    } else if (await this.registerDevice(device)) {
      if (!device.external) {
        this.infoLog(`Adding new accessory: ${sensorAccessory.accessoryAttribute.name} ${sensorAccessory.accessoryAttribute.type} Device ID: ${sensorAccessory.accessoryAttribute.serialNumber}`)
      }
      const accessory = new this.api.platformAccessory(sensorAccessory.accessoryAttribute.name, uuid)
      accessory.displayName = device.configDeviceName
        ? await this.validateAndCleanDisplayName(device.configDeviceName, 'configDeviceName', device.userDefinedDeviceName)
        : await this.validateAndCleanDisplayName(sensorAccessory.accessoryAttribute.name, 'accessoryAttributeName', sensorAccessory.accessoryAttribute.name)
      accessory.context.deviceID = sensorAccessory.accessoryAttribute.serialNumber
      accessory.context.model = sensorAccessory.accessoryAttribute.model
      this.roomsensorFirmwareNewAccessory(accessory, sensorAccessory)
      new RoomSensors(this, accessory, location, device, sensorAccessory, group)
      this.debugLog(`${sensorAccessory.accessoryAttribute.type} uuid: ${sensorAccessory.accessoryAttribute.type}-${sensorAccessory.accessoryId}-RoomSensor, (${accessory.UUID})`)
      this.externalOrPlatform(device, accessory)
      this.accessories.push(accessory)
    } else {
      this.debugErrorLog(`Unable to Register new device: ${sensorAccessory.accessoryAttribute.name} ${sensorAccessory.accessoryAttribute.type} Serial Number: ${sensorAccessory.accessoryAttribute.serialNumber}, Check Config to see if DeviceID is being Hidden.`)
    }
  }

  private async createRoomSensorThermostat(location: location, device: resideoDevice & devicesConfig, group: T9groups, sensorAccessory: sensorAccessory) {
    const uuid = this.api.hap.uuid.generate(`${sensorAccessory.accessoryAttribute.type}-${sensorAccessory.accessoryId}-RoomSensorThermostat`)
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid)

    if (existingAccessory) {
      if (await this.registerDevice(device)) {
        this.infoLog(`Restoring existing accessory from cache: ${existingAccessory.displayName} Serial Number: ${sensorAccessory.accessoryAttribute.serialNumber}`)
        existingAccessory.displayName = device.configDeviceName
          ? await this.validateAndCleanDisplayName(device.configDeviceName, 'configDeviceName', device.userDefinedDeviceName)
          : await this.validateAndCleanDisplayName(sensorAccessory.accessoryAttribute.name, 'accessoryAttributeName', sensorAccessory.accessoryAttribute.name)
        existingAccessory.context.deviceID = sensorAccessory.accessoryAttribute.serialNumber
        existingAccessory.context.model = sensorAccessory.accessoryAttribute.model
        this.roomsensorFirmwareExistingAccessory(existingAccessory, sensorAccessory)
        this.api.updatePlatformAccessories([existingAccessory])
        new RoomSensorThermostat(this, existingAccessory, location, device, sensorAccessory, group)
        this.debugLog(`${sensorAccessory.accessoryAttribute.type} Thermostat uuid: ${sensorAccessory.accessoryAttribute.type}-${sensorAccessory.accessoryId}-RoomSensorThermostat, (${existingAccessory.UUID})`)
      } else {
        this.unregisterPlatformAccessories(existingAccessory)
      }
    } else if (await this.registerDevice(device)) {
      if (!device.external) {
        this.infoLog(`Adding new accessory: ${sensorAccessory.accessoryAttribute.name} ${sensorAccessory.accessoryAttribute.type} Serial Number: ${sensorAccessory.accessoryAttribute.serialNumber}`)
      }
      const accessory = new this.api.platformAccessory(sensorAccessory.accessoryAttribute.name, uuid)
      accessory.displayName = device.configDeviceName
        ? await this.validateAndCleanDisplayName(device.configDeviceName, 'configDeviceName', device.userDefinedDeviceName)
        : await this.validateAndCleanDisplayName(sensorAccessory.accessoryAttribute.name, 'accessoryAttributeName', sensorAccessory.accessoryAttribute.name)
      accessory.context.deviceID = sensorAccessory.accessoryAttribute.serialNumber
      accessory.context.model = sensorAccessory.accessoryAttribute.model
      this.roomsensorFirmwareNewAccessory(accessory, sensorAccessory)
      new RoomSensorThermostat(this, accessory, location, device, sensorAccessory, group)
      this.debugLog(`${sensorAccessory.accessoryAttribute.type} Thermostat uuid: ${sensorAccessory.accessoryAttribute.name}-${sensorAccessory.accessoryAttribute.type}-${sensorAccessory.accessoryId}-RoomSensorThermostat, (${accessory.UUID})`)
      this.externalOrPlatform(device, accessory)
      this.accessories.push(accessory)
    } else {
      this.debugErrorLog(`Unable to Register new device: ${sensorAccessory.accessoryAttribute.name} ${sensorAccessory.accessoryAttribute.type} Serial Number: ${sensorAccessory.accessoryAttribute.serialNumber}, Check Config to see if DeviceID is being Hidden.`)
    }
  }

  async registerDevice(device: resideoDevice & devicesConfig) {
    let registerDevice: boolean
    this.debugLog(`Device: ${device.userDefinedDeviceName} hide_device: ${device.hide_device}${device.deviceClass === 'Thermostat' ? `, hide_roomsensor: ${device.thermostat?.roomsensor?.hide_roomsensor}, roompriority: ${device.thermostat?.roompriority?.deviceType}` : ''}`)
    if (!device.thermostat?.roomsensor?.hide_roomsensor && device.deviceClass === 'Thermostat' && !device.hide_device) {
      registerDevice = true
      this.debugSuccessLog(`Device: ${device.userDefinedDeviceName} deviceID: ${device.deviceID}, registerDevice: ${registerDevice}, hide_roomsensor: ${device.thermostat?.roomsensor?.hide_roomsensor}`)
    } else if (device.thermostat?.roompriority?.deviceType) {
      registerDevice = true
      this.debugSuccessLog(`Device: ${device.userDefinedDeviceName} deviceID: ${device.deviceID}, registerDevice: ${registerDevice}, roompriority: ${device.thermostat?.roompriority?.deviceType}`)
    } else if (!device.hide_device) {
      registerDevice = true
      this.debugSuccessLog(`Device: ${device.userDefinedDeviceName} deviceID: ${device.deviceID}, registerDevice: ${registerDevice}`)
    } else {
      registerDevice = false
      this.debugSuccessLog(`Device: ${device.userDefinedDeviceName} deviceID: ${device.deviceID}, registerDevice: ${registerDevice}`)
    }
    if (registerDevice === true) {
      this.debugWarnLog(`Device: ${device.userDefinedDeviceName} will display in HomeKit`)
    } else {
      this.debugErrorLog(`Device: ${device.userDefinedDeviceName} will not display in HomeKit`)
    }
    return registerDevice
  }

  private leaksensorFirmwareNewAccessory(device: resideoDevice & devicesConfig, accessory: PlatformAccessory) {
    if (device.firmware) {
      accessory.context.firmwareRevision = device.firmware
    } else {
      accessory.context.firmwareRevision = this.version
    }
  }

  private leaksensorFirmwareExistingAccessory(device: resideoDevice & devicesConfig, existingAccessory: PlatformAccessory) {
    if (device.firmware) {
      existingAccessory.context.firmwareRevision = device.firmware
    } else {
      existingAccessory.context.firmwareRevision = this.version
    }
  }

  private valveFirmwareNewAccessory(device: resideoDevice & devicesConfig, accessory: PlatformAccessory) {
    if (device.firmware) {
      accessory.context.firmwareRevision = device.firmware
    } else {
      accessory.context.firmwareRevision = this.version
    }
  }

  private valveFirmwareExistingAccessory(device: resideoDevice & devicesConfig, existingAccessory: PlatformAccessory) {
    if (device.firmware) {
      existingAccessory.context.firmwareRevision = device.firmware
    } else {
      existingAccessory.context.firmwareRevision = this.version
    }
  }

  private roomsensorFirmwareNewAccessory(accessory: PlatformAccessory, sensorAccessory: sensorAccessory) {
    if (accessory.context.firmware) {
      accessory.context.firmwareRevision = accessory.context.firmware
    } else {
      accessory.context.firmwareRevision = sensorAccessory.accessoryAttribute.softwareRevision ?? this.version
    }
  }

  private roomsensorFirmwareExistingAccessory(existingAccessory: PlatformAccessory, sensorAccessory: sensorAccessory) {
    if (existingAccessory.context.firmware) {
      existingAccessory.context.firmwareRevision = existingAccessory.context.firmware
    } else {
      existingAccessory.context.firmwareRevision = sensorAccessory.accessoryAttribute.softwareRevision || this.version
    }
  }

  public async thermostatFirmwareNewAccessory(device: resideoDevice & devicesConfig, accessory: PlatformAccessory, location: any) {
    if (device.firmware) {
      accessory.context.firmwareRevision = device.firmware
    } else {
      if (device.deviceModel.startsWith('T9')) {
        try {
          accessory.context.firmwareRevision = await this.getSoftwareRevision(location.locationID, device)
        } catch (e: any) {
          this.action = 'Get T9 Firmware Version'
          this.apiError(e)
        }
      } else if (device.deviceModel.startsWith('Round') || device.deviceModel.startsWith('Unknown') || device.deviceModel.startsWith('D6')) {
        accessory.context.firmwareRevision = device.thermostatVersion
      } else {
        accessory.context.firmwareRevision = this.version
      }
    }
  }

  public async thermostatFirmwareExistingAccessory(device: resideoDevice & devicesConfig, existingAccessory: PlatformAccessory, location: any) {
    if (device.firmware) {
      existingAccessory.context.firmwareRevision = device.firmware
    } else {
      if (device.deviceModel.startsWith('T9')) {
        try {
          existingAccessory.context.firmwareRevision = await this.getSoftwareRevision(location.locationID, device)
        } catch (e: any) {
          this.action = 'Get T9 Firmware Version'
          this.apiError(e)
        }
      } else if (device.deviceModel.startsWith('Round') || device.deviceModel.startsWith('Unknown') || device.deviceModel.startsWith('D6')) {
        existingAccessory.context.firmwareRevision = device.thermostatVersion
      } else {
        existingAccessory.context.firmwareRevision = this.version
      }
    }
  }

  public async externalOrPlatform(device: resideoDevice & devicesConfig, accessory: PlatformAccessory) {
    if (device.external) {
      this.warnLog(`${accessory.displayName} External Accessory Mode`)
      this.externalAccessory(accessory)
    } else {
      this.debugLog(`${accessory.displayName} External Accessory Mode: ${device.external}`)
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory])
    }
  }

  public async externalAccessory(accessory: PlatformAccessory) {
    this.api.publishExternalAccessories(PLUGIN_NAME, [accessory])
  }

  public unregisterPlatformAccessories(existingAccessory: PlatformAccessory) {
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory])
    this.warnLog(`Removing existing accessory from cache: ${existingAccessory.displayName}`)
  }

  apiError(e: any) {
    const status = e.response?.status || e.status
    const statusText = e.response?.statusText || e.statusText
    const responseData = e.response?.data

    if (status === 400) {
      this.errorLog(`Failed to ${this.action}: Bad Request (400)`)
      this.debugLog('The client has issued an invalid request. This is commonly used to specify validation errors in a request payload.')
      if (responseData?.error) {
        this.debugLog(`API Error Details: ${JSON.stringify(responseData.error)}`)
      }
    } else if (status === 401) {
      this.errorLog(`Failed to ${this.action}: Unauthorized Request (401)`)
      this.debugLog('Authorization for the API is required, but the request has not been authenticated.')
      // Trigger token refresh on 401 errors
      this.warnLog('Access token may be expired. Will attempt refresh on next cycle.')
    } else if (status === 403) {
      this.errorLog(`Failed to ${this.action}: Forbidden Request (403)`)
      this.debugLog('The request has been authenticated but does not have appropriate permissions, or a requested resource is not found.')
    } else if (status === 404) {
      this.errorLog(`Failed to ${this.action}: Request Not Found (404)`)
      this.debugLog('Specifies the requested path does not exist. Device may have been removed or ID is incorrect.')
    } else if (status === 406) {
      this.errorLog(`Failed to ${this.action}: Request Not Acceptable (406)`)
      this.debugLog('The client has requested a MIME type via the Accept header for a value not supported by the server.')
    } else if (status === 415) {
      this.errorLog(`Failed to ${this.action}: Unsupported Request Header (415)`)
      this.debugLog('The client has defined a contentType header that is not supported by the server.')
    } else if (status === 422) {
      this.errorLog(`Failed to ${this.action}: Unprocessable Entity (422)`)
      this.debugLog('The client has made a valid request, but the server cannot process it. This is often used for APIs for which certain limits have been exceeded.')
      if (responseData?.message) {
        this.debugLog(`Validation Error: ${responseData.message}`)
      }
    } else if (status === 429) {
      this.errorLog(`Failed to ${this.action}: Too Many Requests (429)`)
      this.debugLog('The client has exceeded the number of requests allowed for a given time window.')
      const retryAfter = e.response?.headers['retry-after']
      if (retryAfter) {
        this.warnLog(`Rate limit exceeded. Retry after: ${retryAfter} seconds`)
      }
    } else if (status === 500) {
      this.errorLog(`Failed to ${this.action}: Internal Server Error (500)`)
      this.debugLog('An unexpected error on the Resideo servers has occurred. These errors should be rare.')
    } else if (status === 502) {
      this.errorLog(`Failed to ${this.action}: Bad Gateway (502)`)
      this.debugLog('Resideo API gateway error. This is typically temporary.')
    } else if (status === 503) {
      this.errorLog(`Failed to ${this.action}: Service Unavailable (503)`)
      this.debugLog('Resideo API is temporarily unavailable. This is typically due to maintenance.')
    } else if (status === 504) {
      this.errorLog(`Failed to ${this.action}: Gateway Timeout (504)`)
      this.debugLog('Resideo API gateway timeout. The request took too long to process.')
    } else {
      this.errorLog(`Failed to ${this.action}: ${statusText || 'Unknown Error'} (${status || 'No Status'})`)
    }
    
    // Enhanced error details for debugging
    this.debugErrorLog(`API Error Details - Action: ${this.action}, Status: ${status}, Message: ${e.message}`)
    if (e.config?.url) {
      this.debugErrorLog(`Failed Request URL: ${e.config.method?.toUpperCase()} ${e.config.url}`)
    }
  }

  async statusCode(statusCode: number, action: string): Promise<void> {
    switch (statusCode) {
      case 200:
        this.debugLog(`Standard Response, statusCode: ${statusCode}, Action: ${action}`)
        break
      case 400:
        this.errorLog(`Bad Request, statusCode: ${statusCode}, Action: ${action}`)
        break
      case 401:
        this.errorLog(`Unauthorized, statusCode: ${statusCode}, Action: ${action}`)
        break
      case 404:
        this.errorLog(`Not Found, statusCode: ${statusCode}, Action: ${action}`)
        break
      case 429:
        this.errorLog(`Too Many Requests, statusCode: ${statusCode}, Action: ${action}`)
        break
      case 500:
        this.errorLog(`Internal Server Error (Resideo Server), statusCode: ${statusCode}, Action: ${action}`)
        break
      default:
        this.infoLog(`Unknown statusCode: ${statusCode}, Report Bugs Here: https://bit.ly/homebridge-resideo-bug-report. Action: ${action}`)
    }
  }

  async getPlatformLogSettings() {
    this.debugMode = argv.includes('-D') ?? argv.includes('--debug')
    this.platformLogging = (this.config.options?.logging === 'debug' || this.config.options?.logging === 'standard'
      || this.config.options?.logging === 'none')
      ? this.config.options.logging
      : this.debugMode ? 'debugMode' : 'standard'
    const logging = this.config.options?.logging ? 'Platform Config' : this.debugMode ? 'debugMode' : 'Default'
    await this.debugLog(`Using ${logging} Logging: ${this.platformLogging}`)
  }

  async getPlatformRateSettings() {
    // RefreshRate
    this.platformRefreshRate = this.config.options?.refreshRate ? this.config.options.refreshRate : undefined
    const refreshRate = this.config.options?.refreshRate ? 'Using Platform Config refreshRate' : 'Platform Config refreshRate Not Set'
    await this.debugLog(`${refreshRate}: ${this.platformRefreshRate}`)
    // UpdateRate
    this.platformUpdateRate = this.config.options?.updateRate ? this.config.options.updateRate : undefined
    const updateRate = this.config.options?.updateRate ? 'Using Platform Config updateRate' : 'Platform Config updateRate Not Set'
    await this.debugLog(`${updateRate}: ${this.platformUpdateRate}`)
    // PushRate
    this.platformPushRate = this.config.options?.pushRate ? this.config.options.pushRate : undefined
    const pushRate = this.config.options?.pushRate ? 'Using Platform Config pushRate' : 'Platform Config pushRate Not Set'
    await this.debugLog(`${pushRate}: ${this.platformPushRate}`)
    // MaxRetries
    this.platformMaxRetries = this.config.options?.maxRetries ? this.config.options.maxRetries : undefined
    const maxRetries = this.config.options?.maxRetries ? 'Using Platform Config maxRetries' : 'Platform Config maxRetries Not Set'
    await this.debugLog(`${maxRetries}: ${this.platformMaxRetries}`)
    // DelayBetweenRetries
    this.platformDelayBetweenRetries = this.config.options?.delayBetweenRetries ? this.config.options.delayBetweenRetries : undefined
    const delayBetweenRetries = this.config.options?.delayBetweenRetries ? 'Using Platform Config delayBetweenRetries' : 'Platform Config delayBetweenRetries Not Set'
    await this.debugLog(`${delayBetweenRetries}: ${this.platformDelayBetweenRetries}`)
  }

  async getPlatformConfigSettings() {
    if (this.config.options) {
      const platformConfig: ResideoPlatformConfig = {
        platform: 'Resideo',
      }
      platformConfig.logging = this.config.options.logging ? this.config.options.logging : undefined
      platformConfig.refreshRate = this.config.options.refreshRate ? this.config.options.refreshRate : undefined
      platformConfig.updateRate = this.config.options.updateRate ? this.config.options.updateRate : undefined
      platformConfig.pushRate = this.config.options.pushRate ? this.config.options.pushRate : undefined
      platformConfig.maxRetries = this.config.options.maxRetries ? this.config.options.maxRetries : undefined
      platformConfig.delayBetweenRetries = this.config.options.delayBetweenRetries ? this.config.options.delayBetweenRetries : undefined
      
      // API optimization settings
      if (this.config.options.apiRetryAttempts !== undefined) {
        this.debugLog(`API retry attempts configured: ${this.config.options.apiRetryAttempts}`)
      }
      if (this.config.options.apiRetryDelay !== undefined) {
        this.debugLog(`API retry delay configured: ${this.config.options.apiRetryDelay}ms`)
      }
      if (this.config.options.apiTimeout !== undefined) {
        this.debugLog(`API timeout configured: ${this.config.options.apiTimeout}ms`)
      }
      if (this.config.options.enableApiHealthCheck !== undefined) {
        this.debugLog(`API health check enabled: ${this.config.options.enableApiHealthCheck}`)
      }
      
      if (Object.entries(platformConfig).length !== 0) {
        await this.debugLog(`Platform Config: ${JSON.stringify(platformConfig)}`)
      }
      this.platformConfig = platformConfig
    }
  }

  /**
   * Asynchronously retrieves the version of the plugin from the package.json file.
   *
   * This method reads the package.json file located in the parent directory,
   * parses its content to extract the version, and logs the version using the debug logger.
   * The extracted version is then assigned to the `version` property of the class.
   *
   * @returns {Promise<void>} A promise that resolves when the version has been retrieved and logged.
   */
  async getVersion(): Promise<void> {
    const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))
    this.debugLog(`Plugin Version: ${version}`)
    this.version = version
  }

  /**
   * Validate and clean a string value for a Name Characteristic.
   * @param displayName - The display name of the accessory.
   * @param name - The name of the characteristic.
   * @param value - The value to be validated and cleaned.
   * @returns The cleaned string value.
   */
  async validateAndCleanDisplayName(displayName: string, name: string, value: string): Promise<string> {
    if (this.config.options?.allowInvalidCharacters) {
      return value
    } else {
      const validPattern = /^[\p{L}\p{N}][\p{L}\p{N} ']*[\p{L}\p{N}]$/u
      const invalidCharsPattern = /[^\p{L}\p{N} ']/gu
      const invalidStartEndPattern = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu

      if (typeof value === 'string' && !validPattern.test(value)) {
        this.warnLog(`WARNING: The accessory '${displayName}' has an invalid '${name}' characteristic ('${value}'). Please use only alphanumeric, space, and apostrophe characters. Ensure it starts and ends with an alphabetic or numeric character, and avoid emojis. This may prevent the accessory from being added in the Home App or cause unresponsiveness.`)

        // Remove invalid characters
        if (invalidCharsPattern.test(value)) {
          const before = value
          this.warnLog(`Removing invalid characters from '${name}' characteristic, if you feel this is incorrect,  please enable \'allowInvalidCharacter\' in the config to allow all characters`)
          value = value.replace(invalidCharsPattern, '')
          this.warnLog(`${name} Before: '${before}' After: '${value}'`)
        }

        // Ensure it starts and ends with an alphanumeric character
        if (invalidStartEndPattern.test(value)) {
          const before = value
          this.warnLog(`Removing invalid starting or ending characters from '${name}' characteristic, if you feel this is incorrect, please enable \'allowInvalidCharacter\' in the config to allow all characters`)
          value = value.replace(invalidStartEndPattern, '')
          this.warnLog(`${name} Before: '${before}' After: '${value}'`)
        }
      }

      return value
    }
  }

  /**
   * If device level logging is turned on, log to log.warn
   * Otherwise send debug logs to log.debug
   */
  async infoLog(...log: any[]): Promise<void> {
    if (await this.enablingPlatformLogging()) {
      this.log.info(String(...log))
    }
  }

  async successLog(...log: any[]): Promise<void> {
    if (await this.enablingPlatformLogging()) {
      this.log.success(String(...log))
    }
  }

  async debugSuccessLog(...log: any[]): Promise<void> {
    if (await this.enablingPlatformLogging()) {
      if (await this.loggingIsDebug()) {
        this.log.success('[DEBUG]', String(...log))
      }
    }
  }

  async warnLog(...log: any[]): Promise<void> {
    if (await this.enablingPlatformLogging()) {
      this.log.warn(String(...log))
    }
  }

  async debugWarnLog(...log: any[]): Promise<void> {
    if (await this.enablingPlatformLogging()) {
      if (await this.loggingIsDebug()) {
        this.log.warn('[DEBUG]', String(...log))
      }
    }
  }

  async errorLog(...log: any[]): Promise<void> {
    if (await this.enablingPlatformLogging()) {
      this.log.error(String(...log))
    }
  }

  async debugErrorLog(...log: any[]): Promise<void> {
    if (await this.enablingPlatformLogging()) {
      if (await this.loggingIsDebug()) {
        this.log.error('[DEBUG]', String(...log))
      }
    }
  }

  async debugLog(...log: any[]): Promise<void> {
    if (await this.enablingPlatformLogging()) {
      if (this.platformLogging === 'debugMode') {
        this.log.debug(String(...log))
      } else if (this.platformLogging === 'debug') {
        this.log.info('[DEBUG]', String(...log))
      }
    }
  }

  async loggingIsDebug(): Promise<boolean> {
    return this.platformLogging === 'debugMode' || this.platformLogging === 'debug'
  }

  async enablingPlatformLogging(): Promise<boolean> {
    return this.platformLogging === 'debugMode' || this.platformLogging === 'debug' || this.platformLogging === 'standard'
  }
}
