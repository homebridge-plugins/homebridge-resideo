import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import http from 'node:http'

/* eslint-disable no-console */
import { HomebridgePluginUiServer } from '@homebridge/plugin-ui-utils'

import { AuthorizeURL, TokenURL } from '../settings.js'

interface CustomRequestResponse {
  status: string
  data?: any
}

/**
 * Escape text that is about to be written into the setup page.
 *
 * The failure messages come from Resideo, so they are not ours to trust with
 * raw HTML.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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
              const authUrl = `${AuthorizeURL}response_type=code&appSelect=1&redirect_uri=${encodeURI(redirectUrl)}&client_id=${encodeURIComponent(this.key)}`
              res.end(`<script>window.location.replace('${authUrl}');</script>`)
              break
            }
            case 'auth': {
              if (query.get('code')) {
                const code = query.get('code') as string
                const auth = Buffer.from(`${this.key}:${this.secret}`).toString('base64')
                try {
                  // Exchanged with fetch rather than by shelling out to curl:
                  // curl is not present on every install, it validates against
                  // the system CA store rather than the one Node ships, and
                  // building a shell command by hand means anything arriving in
                  // the query string ends up inside that command.
                  const tokenResponse = await fetch(TokenURL, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Basic ${auth}`,
                      'Accept': 'application/json',
                      'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                      grant_type: 'authorization_code',
                      code,
                      redirect_uri: `http://${this.hostname}:8585/auth`,
                    }),
                  })

                  const response = await tokenResponse.json() as {
                    access_token?: string
                    refresh_token?: string
                    error?: string
                    error_description?: string
                  }

                  if (response.access_token) {
                    this.pushEvent('creds-received', {
                      key: this.key,
                      secret: this.secret,
                      access: response.access_token,
                      refresh: response.refresh_token,
                    })
                    res.end('Success. You can close this window now.')
                  } else {
                    // Report only what Resideo said went wrong. The request
                    // carries the consumer secret, so the request itself must
                    // never be echoed back to the page.
                    const reason = response.error_description ?? response.error ?? `unexpected response (HTTP ${tokenResponse.status})`
                    res.end(`<strong>Could not get a token:</strong><br>${escapeHtml(reason)}<br><br>Close this window and start again`)
                  }
                } catch (err) {
                  const reason = err instanceof Error ? err.message : String(err)
                  res.end(`<strong>An error occurred:</strong><br>${escapeHtml(reason)}<br><br>Close this window and start again`)
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
    this.ready()
  }
}

(() => new PluginUiServer())()
