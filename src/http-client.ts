import { Buffer } from 'node:buffer'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'

export interface HttpRequestConfig {
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean | null | undefined>
  auth?: {
    username: string
    password: string
  }
  data?: unknown
  responseType?: 'json' | 'text'
}

export interface HttpResponse<T = unknown> {
  data: T
  status: number
  headers: Record<string, string | string[] | undefined>
}

export interface HttpClient {
  get: <T = unknown>(url: string, config?: HttpRequestConfig) => Promise<HttpResponse<T>>
  post: <T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig) => Promise<HttpResponse<T>>
  put: <T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig) => Promise<HttpResponse<T>>
}

export class NativeHttpClient implements HttpClient {
  constructor(private readonly defaults?: () => HttpRequestConfig) {}

  get<T = unknown>(url: string, config: HttpRequestConfig = {}): Promise<HttpResponse<T>> {
    return this.request<T>('GET', url, config)
  }

  post<T = unknown>(url: string, data?: unknown, config: HttpRequestConfig = {}): Promise<HttpResponse<T>> {
    return this.request<T>('POST', url, { ...config, data })
  }

  put<T = unknown>(url: string, data?: unknown, config: HttpRequestConfig = {}): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', url, { ...config, data })
  }

  private async request<T>(method: 'GET' | 'POST' | 'PUT', url: string, config: HttpRequestConfig): Promise<HttpResponse<T>> {
    const merged = this.mergeConfig(config)
    const target = new URL(url)

    if (merged.params) {
      for (const [key, value] of Object.entries(merged.params)) {
        if (value !== undefined && value !== null) {
          target.searchParams.set(key, String(value))
        }
      }
    }

    const headers: Record<string, string> = { ...merged.headers }
    if (merged.auth) {
      const basic = Buffer.from(`${merged.auth.username}:${merged.auth.password}`).toString('base64')
      headers.Authorization = `Basic ${basic}`
    }

    let body: string | undefined
    if (merged.data !== undefined) {
      if (typeof merged.data === 'string') {
        body = merged.data
      } else {
        body = JSON.stringify(merged.data)
      }

      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
      }
      headers['Content-Length'] = String(Buffer.byteLength(body))
    }

    return await new Promise<HttpResponse<T>>((resolve, reject) => {
      const req = (target.protocol === 'https:' ? httpsRequest : httpRequest)(
        target,
        {
          method,
          headers,
        },
        (res) => {
          const chunks: Buffer[] = []

          res.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          })

          res.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8')
            const responseType = merged.responseType ?? 'json'
            const hasBody = raw.length > 0
            const status = res.statusCode ?? 0

            try {
              const parsed = responseType === 'json'
                ? (hasBody ? JSON.parse(raw) : ({} as unknown))
                : raw

              if (status >= 400) {
                const error = new Error(`Request failed with status code ${status}`) as Error & { status?: number, response?: unknown }
                error.status = status
                error.response = parsed
                reject(error)
                return
              }

              resolve({
                data: parsed as T,
                status,
                headers: res.headers,
              })
            } catch {
              reject(new Error(`Failed to parse response from ${target.toString()}`))
            }
          })
        },
      )

      req.on('error', (error) => {
        reject(error)
      })

      if (body) {
        req.write(body)
      }

      req.end()
    })
  }

  private mergeConfig(config: HttpRequestConfig): HttpRequestConfig {
    const defaults = this.defaults?.() ?? {}
    return {
      ...defaults,
      ...config,
      headers: {
        ...(defaults.headers ?? {}),
        ...(config.headers ?? {}),
      },
      params: {
        ...(defaults.params ?? {}),
        ...(config.params ?? {}),
      },
      auth: config.auth ?? defaults.auth,
      responseType: config.responseType ?? defaults.responseType,
    }
  }
}
