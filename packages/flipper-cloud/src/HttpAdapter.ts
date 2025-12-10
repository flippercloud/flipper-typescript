import type { IAdapter, IGate, IType } from '@flippercloud/flipper'
import { Exporter, WriteAttemptedError } from '@flippercloud/flipper'
import type { Feature, Export, Dsl } from '@flippercloud/flipper'

/**
 * Error class for HTTP adapter failures.
 */
export class HttpError extends Error {
  public statusCode: number
  public response?: Response

  constructor(message: string, statusCode: number, response?: Response) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
    this.response = response
  }
}

/**
 * Options for initializing the HttpAdapter.
 */
export interface HttpAdapterOptions {
  /**
   * The base URL for the Flipper API (e.g., 'https://www.flippercloud.io/adapter')
   */
  url: string

  /**
   * Optional headers to include in all requests.
   */
  headers?: Record<string, string>

  /**
   * Optional timeout in milliseconds for requests (default: 5000).
   */
  timeout?: number

  /**
   * Whether the adapter is read-only (default: false).
   */
  readOnly?: boolean
}

/**
 * HTTP adapter for communicating with Flipper Cloud API.
 *
 * Uses fetch to make HTTP requests to the Flipper API. Supports ETag caching
 * for efficient get_all operations.
 *
 * @example
 * import { HttpAdapter } from '@flippercloud/flipper-cloud'
 *
 * const adapter = new HttpAdapter({
 *   url: 'https://www.flippercloud.io/adapter',
 *   headers: {
 *     'flipper-cloud-token': 'your-token-here'
 *   }
 * })
 *
 * const flipper = new Flipper(adapter)
 * await flipper.enable('new-feature')
 */
class HttpAdapter implements IAdapter {
  /**
   * The name of this adapter.
   */
  public readonly name = 'http'

  /**
   * The base URL for the API.
   */
  private url: string

  /**
   * Headers to include in all requests.
   */
  private headers: Record<string, string>

  /**
   * Request timeout in milliseconds.
   */
  private timeout: number

  /**
   * Whether the adapter is read-only.
   */
  private _readOnly: boolean

  /**
   * Cached ETag from last get_all response.
   */
  private lastGetAllEtag: string | null = null

  /**
   * Cached result from last get_all response.
   */
  private lastGetAllResult: Record<string, Record<string, unknown>> | null = null

  /**
   * Creates a new HttpAdapter.
   * @param options - Configuration options
   */
  constructor(options: HttpAdapterOptions) {
    this.url = options.url.replace(/\/$/, '') // Remove trailing slash
    this.timeout = options.timeout ?? 5000
    this._readOnly = options.readOnly ?? false

    // Default headers
    this.headers = {
      'content-type': 'application/json',
      accept: 'application/json',
      'user-agent': 'Flipper HTTP Adapter (TypeScript)',
      ...options.headers,
    }
  }

  /**
   * Make an HTTP request with timeout support.
   */
  private async fetch(
    path: string,
    options: RequestInit = {},
    additionalHeaders: Record<string, string> = {}
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(`${this.url}${path}`, {
        ...options,
        headers: {
          ...this.headers,
          ...additionalHeaders,
        },
        signal: controller.signal,
      })

      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Handle HTTP errors and parse response body.
   */
  private async handleResponse(response: Response): Promise<unknown> {
    if (!response.ok) {
      let errorMessage = `Failed with status: ${response.status}`

      try {
        const body = await response.json()
        if (body && typeof body === 'object' && 'message' in body) {
          errorMessage += `\n\n${String(body.message)}`
          if ('more_info' in body) {
            errorMessage += `\n${String(body.more_info)}`
          }
        }
      } catch {
        // If we can't parse JSON, just use status code
      }

      throw new HttpError(errorMessage, response.status, response)
    }

    if (response.status === 204) {
      return null
    }

    return await response.json()
  }

  /**
   * Get all features.
   * @returns Array of all Feature instances
   */
  async features(): Promise<Feature[]> {
    const response = await this.fetch('/features?exclude_gate_names=true')
    const data = (await this.handleResponse(response)) as {
      features: Array<{ key: string }>
    }

    const module = await import('@flippercloud/flipper')
    const Feature = module.Feature
    return data.features.map(f => new Feature(f.key, this, {}))
  }

  /**
   * Add a feature to the adapter.
   * @param feature - Feature to add
   * @returns True if successful
   */
  async add(feature: Feature): Promise<boolean> {
    this.ensureWritable()
    const body = JSON.stringify({ name: feature.key })
    const response = await this.fetch('/features', {
      method: 'POST',
      body,
    })
    await this.handleResponse(response)
    return true
  }

  /**
   * Remove a feature from the adapter.
   * @param feature - Feature to remove
   * @returns True if successful
   */
  async remove(feature: Feature): Promise<boolean> {
    this.ensureWritable()
    const response = await this.fetch(`/features/${feature.key}`, {
      method: 'DELETE',
    })
    await this.handleResponse(response)
    return true
  }

  /**
   * Clear all gate values for a feature.
   * @param feature - Feature to clear
   * @returns True if successful
   */
  async clear(feature: Feature): Promise<boolean> {
    this.ensureWritable()
    const response = await this.fetch(`/features/${feature.key}/clear`, {
      method: 'DELETE',
    })
    await this.handleResponse(response)
    return true
  }

  /**
   * Get feature state from the adapter.
   * @param feature - Feature to get state for
   * @returns Feature gate values
   */
  async get(feature: Feature): Promise<Record<string, unknown>> {
    const response = await this.fetch(`/features/${feature.key}`)

    if (response.status === 404) {
      return this.defaultConfig()
    }

    const data = (await this.handleResponse(response)) as {
      gates: Array<{ key: string; value: unknown }>
    }

    return this.resultForFeature(feature, data.gates)
  }

  /**
   * Get multiple features' state from the adapter.
   *
   * Note: If a requested feature is not present in the cloud, it will be returned
   * with default gate values (all gates null/empty). This matches Ruby HTTP adapter behavior
   * and allows graceful handling of features that may be newly requested but not yet
   * created in the cloud.
   *
   * @param features - Features to get state for
   * @returns Map of feature keys to gate values
   */
  async getMulti(features: Feature[]): Promise<Record<string, Record<string, unknown>>> {
    const keys = features.map(f => f.key).join(',')
    const response = await this.fetch(`/features?keys=${keys}&exclude_gate_names=true`)
    const data = (await this.handleResponse(response)) as {
      features: Array<{ key: string; gates: Array<{ key: string; value: unknown }> }>
    }

    const gatesByKey: Record<string, Array<{ key: string; value: unknown }>> = {}
    for (const feature of data.features) {
      gatesByKey[feature.key] = feature.gates
    }

    const result: Record<string, Record<string, unknown>> = {}
    for (const feature of features) {
      // If feature not in response, resultForFeature will use undefined gates and return defaults
      result[feature.key] = this.resultForFeature(feature, gatesByKey[feature.key])
    }

    return result
  }

  /**
   * Get all features' state from the adapter with ETag caching.
   * @returns Map of all feature keys to gate values
   */
  async getAll(): Promise<Record<string, Record<string, unknown>>> {
    const additionalHeaders: Record<string, string> = {}

    // Add If-None-Match header if we have a cached ETag
    if (this.lastGetAllEtag) {
      additionalHeaders['if-none-match'] = this.lastGetAllEtag
    }

    const response = await this.fetch('/features?exclude_gate_names=true', {}, additionalHeaders)

    // Handle 304 Not Modified - return cached result
    if (response.status === 304) {
      if (this.lastGetAllResult) {
        return this.lastGetAllResult
      }
      throw new HttpError('Received 304 without cached result', 304, response)
    }

    // Store ETag from response for future requests
    const etag = response.headers.get('etag')
    if (etag) {
      this.lastGetAllEtag = etag
    }

    const data = (await this.handleResponse(response)) as {
      features: Array<{ key: string; gates: Array<{ key: string; value: unknown }> }>
    }

    const gatesByKey: Record<string, Array<{ key: string; value: unknown }>> = {}
    for (const feature of data.features) {
      gatesByKey[feature.key] = feature.gates
    }

    const result: Record<string, Record<string, unknown>> = {}
    const module = await import('@flippercloud/flipper')
    const Feature = module.Feature

    for (const key of Object.keys(gatesByKey)) {
      const feature = new Feature(key, this, {})
      result[feature.key] = this.resultForFeature(feature, gatesByKey[feature.key])
    }

    // Cache the result for 304 responses
    this.lastGetAllResult = result
    return result
  }

  /**
   * Enable a gate for a feature.
   * @param feature - Feature to enable
   * @param gate - Gate to enable
   * @param thing - Type with value to enable
   * @returns True if successful
   */
  async enable(feature: Feature, gate: IGate, thing: IType): Promise<boolean> {
    this.ensureWritable()
    const body = this.requestBodyForGate(gate, thing.value)
    const queryString = gate.key === 'groups' ? '?allow_unregistered_groups=true' : ''
    const response = await this.fetch(`/features/${feature.key}/${gate.key}${queryString}`, {
      method: 'POST',
      body,
    })
    await this.handleResponse(response)
    return true
  }

  /**
   * Disable a gate for a feature.
   * @param feature - Feature to disable
   * @param gate - Gate to disable
   * @param thing - Type with value to disable
   * @returns True if successful
   */
  async disable(feature: Feature, gate: IGate, thing: IType): Promise<boolean> {
    this.ensureWritable()
    const body = this.requestBodyForGate(gate, thing.value)
    const queryString = gate.key === 'groups' ? '?allow_unregistered_groups=true' : ''

    let method = 'DELETE'
    if (gate.key === 'percentageOfActors' || gate.key === 'percentageOfTime') {
      method = 'POST'
    }

    const response = await this.fetch(`/features/${feature.key}/${gate.key}${queryString}`, {
      method,
      body,
    })
    await this.handleResponse(response)
    return true
  }

  /**
   * Check if the adapter is read-only.
   * @returns True if read-only, false otherwise
   */
  readOnly(): boolean {
    return this._readOnly
  }

  /**
   * Export the adapter's features.
   * @param options - Export options
   * @returns Export object
   */
  async export(options: { format?: string; version?: number } = {}): Promise<Export> {
    const format = options.format ?? 'json'
    const version = options.version ?? 1
    const exporter = Exporter.build({ format, version })
    return await exporter.call(this)
  }

  /**
   * Import features from another source.
   * @param source - The source to import from (Dsl, Adapter, or Export)
   * @returns True if successful
   */
  async import(source: IAdapter | Export | Dsl): Promise<boolean> {
    this.ensureWritable()
    const sourceAdapter = await this.getSourceAdapter(source)
    const exportData = await sourceAdapter.export({ format: 'json', version: 1 })
    const response = await this.fetch('/import', {
      method: 'POST',
      body: exportData.contents,
    })
    await this.handleResponse(response)
    return true
  }

  /**
   * Extract an adapter from a source.
   * @private
   */
  private async getSourceAdapter(source: IAdapter | Export | Dsl): Promise<IAdapter> {
    if ('adapter' in source && source.adapter && typeof source.adapter !== 'function') {
      return source.adapter
    }
    if ('adapter' in source && typeof source.adapter === 'function') {
      return await source.adapter()
    }
    return source as IAdapter
  }

  /**
   * Ensure the adapter is writable.
   * @private
   */
  private ensureWritable(): void {
    if (this._readOnly) {
      throw new WriteAttemptedError()
    }
  }

  /**
   * Build request body for a gate operation.
   * @private
   */
  private requestBodyForGate(gate: IGate, value: boolean | number | string): string {
    let data: Record<string, unknown>

    switch (gate.key) {
      case 'boolean':
        data = {}
        break
      case 'groups':
        data = { name: String(value) }
        break
      case 'actors':
        data = { flipper_id: String(value) }
        break
      case 'percentageOfActors':
      case 'percentageOfTime':
        data = { percentage: String(value) }
        break
      case 'expression':
        data = typeof value === 'object' ? (value as Record<string, unknown>) : {}
        break
      default:
        throw new Error(`${gate.key} is not a valid flipper gate key`)
    }

    return JSON.stringify(data)
  }

  /**
   * Convert API gate response to adapter format.
   * @private
   */
  private resultForFeature(
    feature: Feature,
    apiGates?: Array<{ key: string; value: unknown }>
  ): Record<string, unknown> {
    const result = this.defaultConfig()

    if (!apiGates) {
      return result
    }

    for (const gate of feature.gates) {
      const apiGate = apiGates.find(ag => ag.key === gate.key)
      if (apiGate) {
        result[gate.key] = this.valueForGate(gate, apiGate.value)
      }
    }

    return result
  }

  /**
   * Convert API gate value to adapter format.
   *
   * For boolean/integer/number gates: converts truthy values to strings
   * (matching Ruby HTTP adapter behavior for consistency across Flipper SDKs).
   * Null/undefined values are returned as-is. This string conversion ensures
   * consistent serialization across platforms and API boundaries.
   *
   * @private
   */
  private valueForGate(gate: IGate, value: unknown): unknown {
    switch (gate.dataType) {
      case 'boolean':
      case 'integer':
      case 'number':
        // Following Ruby HTTP adapter: convert truthy values to strings
        if (value === null || value === undefined) {
          return value
        }
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          return String(value)
        }
        return value
      case 'json':
        return value
      case 'set':
        return value && Array.isArray(value) ? new Set(value as string[]) : new Set()
      default:
        throw new Error(`${gate.dataType} is not supported by this adapter`)
    }
  }

  /**
   * Get default config for a feature.
   * @private
   */
  private defaultConfig(): Record<string, unknown> {
    return {
      boolean: null,
      groups: new Set<string>(),
      actors: new Set<string>(),
      expression: null,
      percentageOfActors: null,
      percentageOfTime: null,
    }
  }
}

export default HttpAdapter
