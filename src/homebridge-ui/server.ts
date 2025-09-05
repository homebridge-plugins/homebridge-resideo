import { Buffer } from 'node:buffer'
import { exec as execCb } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import util from 'node:util'

/* eslint-disable no-console */
import { HomebridgePluginUiServer } from '@homebridge/plugin-ui-utils'
import axios from 'axios'

import { LocationURL } from '../settings.js'

const exec = util.promisify(execCb)

interface CustomRequestResponse {
  status: string
  data?: any
  message?: string
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
        // Read the plugin configuration from config.json
        const configFile = `${this.homebridgeStoragePath}/config.json`

        if (!fs.existsSync(configFile)) {
          return { status: 'error', data: [], message: 'Homebridge config not found' }
        }

        const configData = await fs.promises.readFile(configFile, 'utf8')
        const homebridgeConfig = JSON.parse(configData)

        // Find the Resideo plugin config
        const pluginConfig = homebridgeConfig.platforms?.find(
          (platform: any) => platform.platform === 'Resideo',
        )

        if (!pluginConfig) {
          return { status: 'error', data: [], message: 'Resideo platform not configured' }
        }

        // Check if credentials are available
        if (!pluginConfig.credentials?.accessToken) {
          return { status: 'error', data: [], message: 'No access token found. Please configure OAuth credentials first.' }
        }

        // Create axios instance with auth header
        const resideoAxios = axios.create({
          headers: {
            Authorization: `Bearer ${pluginConfig.credentials.accessToken}`,
          },
        })

        // Get locations and devices from Resideo API
        const locationsResponse = await resideoAxios.get(LocationURL)
        const locations = locationsResponse.data

        const allDevices: any[] = []

        if (locations && locations.length > 0) {
          for (const location of locations) {
            if (location.devices && location.devices.length > 0) {
              for (const device of location.devices) {
                allDevices.push({
                  locationName: location.name,
                  locationID: location.locationID,
                  deviceName: device.userDefinedDeviceName || device.name,
                  deviceID: device.deviceID,
                  deviceClass: device.deviceClass,
                  deviceModel: device.deviceModel || device.deviceType,
                  deviceType: device.deviceType,
                  isOnline: device.isAlive,
                })
              }
            }
          }
        }

        return { status: 'ok', data: allDevices }
      } catch (err: any) {
        console.error('Error getting available devices:', err)

        // Handle different types of errors
        if (err.response?.status === 401) {
          return { status: 'error', data: [], message: 'Authentication failed. Please re-authenticate with Resideo.' }
        }

        return { status: 'error', data: [], message: `Failed to get devices: ${err.message}` }
      }
    })
    this.ready()
  }
}

(() => new PluginUiServer())()
