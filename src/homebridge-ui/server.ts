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
  consumerKey?: string
  consumerSecret?: string
}

interface Config {
  platform: string
  name: string
  credentials?: Credentials
}

interface Credentials {
  accessToken?: string
  refreshToken?: string
  consumerKey?: string
  consumerSecret?: string
}

interface Config {
  platform: string
  name: string
  credentials?: Credentials
}

interface Credentials {
  accessToken?: string
  refreshToken?: string
  consumerKey?: string
  consumerSecret?: string
}

interface Config {
  platform: string
  name: string
  credentials?: Credentials
}

export class PluginUiServer extends HomebridgePluginUiServer {
  public key!: string
  public secret!: string
  public hostname!: string

  constructor() {
    super()
    this.onRequest('Start Resideo Login Server', (): CustomRequestResponse | Promise<CustomRequestResponse> => {
      const runningServer = http.createServer(async (req, res) => {
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
      runningServer.listen(8585, (err?: Error) => {
        if (err) {
          console.log(err)
        } else {
          console.log('Server is running')
        }
      })

      setTimeout(() => {
        runningServer.close()
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

    this.onRequest('/getAvailableDevices', async (): Promise<CustomRequestResponse> => {
      try {
        // Read the current config to get credentials
        const configPath = this.homebridgeConfigPath || ''
        if (!configPath || !fs.existsSync(configPath)) {
          throw new Error('Homebridge config.json not found')
        }

        const configData = await fs.promises.readFile(configPath, 'utf8')
        const config = JSON.parse(configData)

        // Find the Resideo platform config
        const platformConfig = config.platforms?.find((platform: Config) =>
          platform.platform === 'Resideo' || platform.name === 'Resideo',
        )

        if (!platformConfig?.credentials) {
          throw new Error('Resideo credentials not found in config. Please re-link your account.')
        }

        const credentials = platformConfig.credentials

        if (!credentials.consumerKey || !credentials.consumerSecret || !credentials.refreshToken) {
          throw new Error('Invalid credentials configuration. Please re-link your account.')
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
          throw new Error('Authentication failed. Please re-link your account in the plugin configuration.')
        }

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
        // Read the current config to get credentials and call getAvailableDevices
        const configPath = this.homebridgeConfigPath || ''
        if (!configPath || !fs.existsSync(configPath)) {
          throw new Error('Homebridge config.json not found')
        }

        const configData = await fs.promises.readFile(configPath, 'utf8')
        const config = JSON.parse(configData)

        // Find the Resideo platform config
        const platformConfig = config.platforms?.find((platform: Config) =>
          platform.platform === 'Resideo' || platform.name === 'Resideo',
        )

        if (!platformConfig?.credentials) {
          throw new Error('Resideo credentials not found in config. Please re-link your account.')
        }

        const credentials = platformConfig.credentials

        if (!credentials.consumerKey || !credentials.consumerSecret || !credentials.refreshToken) {
          throw new Error('Invalid credentials configuration. Please re-link your account.')
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
          throw new Error('Authentication failed. Please re-link your account in the plugin configuration.')
        }

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

        // Transform devices for webUI format
        const webUIDevices = devices.map((device: any) => ({
          name: device.userDefinedDeviceName || device.name || `Device ${device.deviceID}`,
          serialNumber: device.deviceID,
          firmwareRevision: device.deviceSettings?.firmware || 'Unknown',
          manufacturer: 'Resideo',
          model: device.deviceModel || device.deviceType || 'Unknown',
          // Additional properties for the webUI
          deviceID: device.deviceID,
          deviceType: device.deviceType,
          locationName: device.locationName,
          locationId: device.locationId,
        }))

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
}

(() => new PluginUiServer())()
