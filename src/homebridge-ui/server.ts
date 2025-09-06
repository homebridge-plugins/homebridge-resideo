import { Buffer } from 'node:buffer'
import { exec as execCb } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import { stringify } from 'node:querystring'
import util from 'node:util'

/* eslint-disable no-console */
import { HomebridgePluginUiServer } from '@homebridge/plugin-ui-utils'
import axios from 'axios'

import { featureOptionCategories, featureOptions } from '../resideo-options.js'

const exec = util.promisify(execCb)

// Resideo API URLs
const TokenURL = 'https://api.honeywell.com/oauth2/token'
const LocationURL = 'https://api.honeywell.com/v2/locations'

interface CustomRequestResponse {
  status: string
  data?: any
  message?: string
}

interface Credentials {
  accessToken?: string
  refreshToken?: string
  consumerKey: string
  consumerSecret: string
}

interface Config {
  platform: string
  name: string
  credentials: Credentials
}

export class PluginUiServer extends HomebridgePluginUiServer {
  public key!: string
  public secret!: string
  public hostname!: string
  private runningServer?: http.Server

  constructor() {
    super()
    this.onRequest('Start Resideo Login Server', (): CustomRequestResponse | Promise<CustomRequestResponse> => {
      // If server is already running, return success without creating a new one
      if (this.runningServer && this.runningServer.listening) {
        console.log('Server is already running')
        return { status: 'ok' }
      }

      // Close any existing server before creating a new one
      if (this.runningServer) {
        this.runningServer.close()
        this.runningServer = undefined
      }

      this.runningServer = http.createServer(async (req, res) => {
        try {
          res.writeHead(200, { 'Content-Type': 'text/html' })
          const reqUrl = new URL(req.url ?? '', `http://${req.headers.host}`)
          const action = reqUrl.pathname.replace('/', '')
          const query = reqUrl.searchParams
          switch (action) {
            case 'start': {
              this.key = query.get('key') as string
              this.secret = query.get('secret') as string
              this.hostname = query.get('host') as string
              const redirectUrl = `http://${this.hostname}:8585/auth`
              const authUrl = `https://api.honeywell.com/oauth2/authorize?response_type=code&appSelect=1&redirect_uri=${encodeURI(redirectUrl)}&client_id=${query.get('key')}`
              res.end(`<script>window.location.replace('${authUrl}');</script>`)
              break
            }
            case 'auth': {
              if (query.get('code')) {
                const code = query.get('code') as string
                const auth = Buffer.from(`${this.key}:${this.secret}`).toString('base64')
                let curlString = ''
                curlString += 'curl -X POST '
                curlString += `--header "Authorization: Basic ${auth}" `
                curlString += '--header "Accept: application/json" '
                curlString += '--header "Content-Type: application/x-www-form-urlencoded" '
                curlString += '-d "'
                curlString += 'grant_type=authorization_code&'
                curlString += `code=${code}&`
                curlString += `redirect_uri=${encodeURI(`http://${this.hostname}:8585/auth`)}`
                curlString += '" '
                curlString += '"https://api.honeywell.com/oauth2/token"'
                try {
                  const { stdout } = await exec(curlString)
                  const response = JSON.parse(stdout)
                  if (response.access_token) {
                    this.pushEvent('creds-received', {
                      key: this.key,
                      secret: this.secret,
                      access: response.access_token,
                      refresh: response.refresh_token,
                    })
                    res.end('Success. You can close this window now.')
                  } else {
                    res.end('oops.')
                  }
                } catch (err) {
                  res.end(`<strong>An error occurred:</strong><br>${JSON.stringify(err)}<br><br>Close this window and start again`)
                }
              } else {
                res.end('<strong>An error occurred:</strong><br>no code received<br><br>Close this window and start again')
              }
              break
            }
            default: {
              // should never happen
              res.end('welcome to the server')
              break
            }
          }
        } catch (err) {
          console.log(err)
        }
      })
      this.runningServer.listen(8585, (err?: Error) => {
        if (err) {
          console.log(err)
        } else {
          console.log('Server is running')
        }
      })

      setTimeout(() => {
        if (this.runningServer) {
          this.runningServer.close()
          this.runningServer = undefined
        }
      }, 300000)

      // Return a response to satisfy the expected return type
      return { status: 'ok' }
    })

    /*
      A native method getCachedAccessories() was introduced in config-ui-x v4.37.0
      The following is for users who have a lower version of config-ui-x
    */

    this.onRequest('/getCachedAccessories', async (): Promise<CustomRequestResponse> => {
      try {
        // Define the plugin and create the array to return
        const plugin = '@homebridge-plugins/homebridge-resideo'
        const devicesToReturn: any[] = []

        // The path and file of the cached accessories
        const accFile = `${this.homebridgeStoragePath}/accessories/cachedAccessories`

        // Check the file exists
        if (fs.existsSync(accFile)) {
          // Read the cached accessories file
          const cachedAccessoriesData = await fs.promises.readFile(accFile, 'utf8')

          // Parse the JSON
          const cachedAccessories: any[] = JSON.parse(cachedAccessoriesData)

          // We only want the accessories for this plugin
          cachedAccessories
            .filter((accessory: any) => accessory.plugin === plugin)
            .forEach((accessory: any) => devicesToReturn.push(accessory))
        }

        // Return the array
        return { status: 'ok', data: devicesToReturn }
      } catch (err) {
        // Just return an empty accessory list in case of any errors
        return { status: 'error', data: [] }
      }
    })

    // Add helper methods for common API operations
    this.setupApiHelpers()

    this.onRequest('/getAvailableDevices', async (): Promise<CustomRequestResponse> => {
      try {
        const { credentials, accessToken } = await this.getValidCredentials()
        const { locations, devices } = await this.getLocationsAndDevices(credentials, accessToken)

        return {
          status: 'ok',
          data: {
            locations,
            devices,
            totalDevices: devices.length,
            totalLocations: locations.length,
          },
        }
      } catch (error: any) {
        console.error('Error getting available devices:', error)
        return {
          status: 'error',
          data: {
            error: error.message || 'Failed to get available devices',
            details: error.code || 'Unknown error',
          },
        }
      }
    })

    // Add feature options endpoints for homebridge-plugin-utils
    this.onRequest('/getFeatureOptions', async (): Promise<CustomRequestResponse> => {
      return {
        status: 'ok',
        data: {
          categories: featureOptionCategories,
          options: featureOptions,
        },
      }
    })

    this.onRequest('/getDevices', async (): Promise<CustomRequestResponse> => {
      try {
        const { credentials, accessToken } = await this.getValidCredentials()
        const { devices } = await this.getLocationsAndDevices(credentials, accessToken)

        // Transform devices for webUI format with enhanced metadata
        const webUIDevices = devices.map((device: any) => {
          // Determine device type and capabilities
          const deviceType = getDeviceType(device)
          const deviceModel = getDeviceModel(device)
          const capabilities = getDeviceCapabilities(device)

          return {
            name: device.userDefinedDeviceName || device.name || `Device ${device.deviceID}`,
            serialNumber: device.deviceID,
            firmwareRevision: device.deviceSettings?.firmware || device.firmware || 'Unknown',
            manufacturer: 'Resideo',
            model: deviceModel,
            // Additional properties for the webUI
            deviceID: device.deviceID,
            deviceType,
            deviceClass: deviceType, // For legacy compatibility
            deviceModel,
            locationName: device.locationName,
            locationId: device.locationId,
            capabilities,
            // Device status information
            isOnline: device.isAlive !== false,
            lastCheckin: device.lastCheckin,
            // For thermostat devices
            ...(deviceType === 'Thermostat' && {
              currentTemperature: device.indoorTemperature,
              currentHumidity: device.indoorHumidity,
              targetTemperature: device.changeableValues?.heatSetpoint || device.changeableValues?.coolSetpoint,
              currentMode: device.changeableValues?.mode,
              allowedModes: device.allowedModes,
            }),
            // For leak sensors
            ...(deviceType === 'LeakDetector' && {
              waterDetected: device.waterPresent,
              batteryLevel: device.batteryRemaining,
              currentTemperature: device.currentSensorReadings?.temperature,
              currentHumidity: device.currentSensorReadings?.humidity,
            }),
            // For valves
            ...(deviceType === 'ShutoffValve' && {
              valvePosition: device.actuatorValve?.valveStatus,
              leakStatus: device.actuatorValve?.leakStatus,
            }),
          }
        })

        return {
          status: 'ok',
          data: webUIDevices,
        }
      } catch (error: any) {
        console.error('Error getting devices for webUI:', error)
        return {
          status: 'error',
          data: [],
        }
      }
    })

    this.ready()
  }

  /**
   * Setup API helper methods for common operations.
   */
  private setupApiHelpers(): void {
    // Helper methods are defined below as class methods
  }

  /**
   * Common method to get API credentials and refresh access token.
   */
  private async getValidCredentials(): Promise<{ credentials: Credentials, accessToken: string }> {
    // Read the current config to get credentials
    const configPath = this.homebridgeConfigPath || ''
    if (!configPath || !fs.existsSync(configPath)) {
      throw new Error('Homebridge config.json not found')
    }

    const configData = await fs.promises.readFile(configPath, 'utf8')
    const config = JSON.parse(configData)

    // Find the Resideo platform config
    const platformConfig = config.platforms?.find((platform: Config) =>
      platform.platform === 'Resideo',
    )

    if (!platformConfig?.credentials) {
      throw new Error('Resideo credentials not found in config. Please complete initial setup.')
    }

    const credentials = platformConfig.credentials

    if (!credentials.consumerKey || !credentials.consumerSecret || !credentials.refreshToken) {
      throw new Error('Invalid credentials configuration. Please complete initial setup.')
    }

    // Get a fresh access token
    let accessToken = credentials.accessToken

    try {
      const tokenResponse = await axios({
        url: TokenURL,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: credentials.consumerKey,
          password: credentials.consumerSecret,
        },
        data: stringify({
          grant_type: 'refresh_token',
          refresh_token: credentials.refreshToken,
        }),
        responseType: 'json',
      })

      accessToken = tokenResponse.data.access_token

      // Update the config with the new tokens if they changed
      if (tokenResponse.data.refresh_token !== credentials.refreshToken) {
        credentials.refreshToken = tokenResponse.data.refresh_token
        credentials.accessToken = accessToken
        await fs.promises.writeFile(configPath, JSON.stringify(config, null, 4))
      }
    } catch (tokenError: any) {
      console.error('Failed to refresh access token:', tokenError.message)
      throw new Error('Authentication failed. Please complete initial setup in the plugin configuration.')
    }

    return { credentials, accessToken }
  }

  /**
   * Common method to get locations and devices from Resideo API.
   */
  private async getLocationsAndDevices(credentials: Credentials, accessToken: string): Promise<{ locations: any[], devices: any[] }> {
    // Get locations and devices from Resideo API
    const locationsResponse = await axios({
      url: LocationURL,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      params: {
        apikey: credentials.consumerKey,
      },
    })

    const locations = locationsResponse.data
    const devices: any[] = []

    // Extract devices from all locations
    if (Array.isArray(locations)) {
      locations.forEach((location: any) => {
        if (location.devices && Array.isArray(location.devices)) {
          location.devices.forEach((device: any) => {
            devices.push({
              ...device,
              locationName: location.name,
              locationId: location.locationID,
            })
          })
        }
      })
    }

    return { locations, devices }
  }
}

// Device type detection helper functions
function getDeviceType(device: any): string {
  if (device.deviceClass) {
    return device.deviceClass
  }

  // Fallback detection based on device properties
  if (device.changeableValues && (device.allowedModes || device.indoorTemperature !== undefined)) {
    return 'Thermostat'
  }
  if (device.waterPresent !== undefined || device.batteryRemaining !== undefined) {
    return 'LeakDetector'
  }
  if (device.actuatorValve) {
    return 'ShutoffValve'
  }

  // Default fallback
  return device.deviceType || 'Unknown'
}

function getDeviceModel(device: any): string {
  return device.deviceModel || device.model || device.deviceType || 'Unknown'
}

function getDeviceCapabilities(device: any): string[] {
  const capabilities: string[] = []

  if (device.allowedModes?.includes('Heat')) {
    capabilities.push('heating')
  }
  if (device.allowedModes?.includes('Cool')) {
    capabilities.push('cooling')
  }
  if (device.allowedModes?.includes('Auto')) {
    capabilities.push('auto')
  }
  if (device.settings?.fan) {
    capabilities.push('fan')
  }
  if (device.indoorHumidity !== undefined) {
    capabilities.push('humidity')
  }
  if (device.waterPresent !== undefined) {
    capabilities.push('leak-detection')
  }
  if (device.batteryRemaining !== undefined) {
    capabilities.push('battery')
  }
  if (device.actuatorValve) {
    capabilities.push('valve-control')
  }
  if (device.groups && device.groups.length > 0) {
    capabilities.push('room-sensors')
  }

  return capabilities
}

(() => new PluginUiServer())()
