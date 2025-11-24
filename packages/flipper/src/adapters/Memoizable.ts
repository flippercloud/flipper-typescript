import type Feature from '../Feature'
import type { IAdapter, IGate, IType } from '../interfaces'
import type Export from '../Export'
import type Dsl from '../Dsl'

interface Cache {
  [key: string]: unknown
}

/**
 * Adapter wrapper that memoizes adapter calls in memory.
 *
 * Used to cache feature flag state for the duration of a request or other scope,
 * significantly reducing adapter calls and improving performance.
 *
 * Call `memoize = true` to enable caching, `memoize = false` to disable and clear.
 *
 * @example
 * const adapter = new MemoryAdapter()
 * const memoizer = new Memoizable(adapter)
 *
 * // Enable memoization
 * memoizer.memoize = true
 *
 * // First call hits the adapter
 * await memoizer.get(feature)
 *
 * // Second call uses cache
 * await memoizer.get(feature) // cached!
 *
 * // Disable memoization and clear cache
 * memoizer.memoize = false
 *
 * // Request-scoped usage (e.g., Express middleware)
 * app.use((req, res, next) => {
 *   req.flipperMemoizer = new Memoizable(adapter)
 *   req.flipperMemoizer.memoize = true
 *   next()
 * })
 */
export default class Memoizable implements IAdapter {
  /**
   * The underlying adapter to delegate to.
   */
  private adapter: IAdapter

  /**
   * In-memory cache for memoized values.
   */
  private cache: Cache

  /**
   * Whether memoization is currently enabled.
   */
  private _memoize: boolean

  /**
   * Cache key for the features list.
   */
  private readonly FEATURES_KEY = 'flipper_features'

  /**
   * Cache key to track if getAll has been called.
   */
  private readonly GET_ALL_KEY = 'all_memoized'

  /**
   * Creates a new Memoizable adapter.
   * @param adapter - The adapter to wrap with memoization
   * @param cache - Optional cache object to use (defaults to empty object)
   */
  constructor(adapter: IAdapter, cache: Cache = {}) {
    this.adapter = adapter
    this.cache = cache
    this._memoize = false
  }

  /**
   * Returns the name of the wrapped adapter.
   * @returns The adapter name
   */
  get name(): string {
    return this.adapter.name
  }

  /**
   * Enable or disable memoization.
   * Setting to false also clears the cache.
   * @param value - True to enable memoization, false to disable and clear cache
   */
  set memoize(value: boolean) {
    if (value === false) {
      Object.keys(this.cache).forEach(key => delete this.cache[key])
    }
    this._memoize = value
  }

  /**
   * Check if memoization is currently enabled.
   * @returns True if memoization is enabled
   */
  get memoize(): boolean {
    return this._memoize
  }

  /**
   * Get all features, with caching if memoization is enabled.
   * @returns Array of all features
   */
  async features(): Promise<Feature[]> {
    if (!this._memoize) {
      return await this.adapter.features()
    }

    if (!(this.FEATURES_KEY in this.cache)) {
      this.cache[this.FEATURES_KEY] = this.adapter.features()
    }

    return await (this.cache[this.FEATURES_KEY] as Promise<Feature[]>)
  }

  /**
   * Add a feature and expire the features cache.
   * @param feature - Feature to add
   * @returns True if feature was added successfully
   */
  async add(feature: Feature): Promise<boolean> {
    const result = await this.adapter.add(feature)
    this.expireFeaturesSet()
    return result
  }

  /**
   * Remove a feature and expire both feature and features caches.
   * @param feature - Feature to remove
   * @returns True if feature was removed successfully
   */
  async remove(feature: Feature): Promise<boolean> {
    const result = await this.adapter.remove(feature)
    this.expireFeaturesSet()
    this.expireFeature(feature)
    return result
  }

  /**
   * Clear a feature's gate values and expire its cache.
   * @param feature - Feature to clear
   * @returns True if feature was cleared successfully
   */
  async clear(feature: Feature): Promise<boolean> {
    const result = await this.adapter.clear(feature)
    this.expireFeature(feature)
    return result
  }

  /**
   * Get a feature's state, with caching if memoization is enabled.
   * @param feature - Feature to get state for
   * @returns Feature gate values
   */
  async get(feature: Feature): Promise<Record<string, unknown>> {
    if (!this._memoize) {
      return await this.adapter.get(feature)
    }

    const key = this.keyFor(feature.key)
    if (!(key in this.cache)) {
      // Store the promise itself to avoid thundering herd
      this.cache[key] = this.adapter.get(feature)
    }

    return await (this.cache[key] as Promise<Record<string, unknown>>)
  }

  /**
   * Get multiple features' state, fetching only uncached features.
   * @param features - Features to get state for
   * @returns Map of feature keys to gate values
   */
  async getMulti(features: Feature[]): Promise<Record<string, Record<string, unknown>>> {
    if (!this._memoize) {
      return await this.adapter.getMulti(features)
    }

    // Find features not in cache
    const uncachedFeatures = features.filter(feature => {
      const key = this.keyFor(feature.key)
      return !(key in this.cache)
    })

    // Fetch uncached features
    if (uncachedFeatures.length > 0) {
      const response = await this.adapter.getMulti(uncachedFeatures)
      Object.entries(response).forEach(([featureKey, hash]) => {
        this.cache[this.keyFor(featureKey)] = Promise.resolve(hash)
      })
    }

    // Build result from cache
    const result: Record<string, Record<string, unknown>> = {}
    for (const feature of features) {
      const key = this.keyFor(feature.key)
      result[feature.key] = await (this.cache[key] as Promise<Record<string, unknown>>)
    }

    return result
  }

  /**
   * Get all features' state, with full caching if memoization is enabled.
   * @returns Map of all feature keys to gate values
   */
  async getAll(): Promise<Record<string, Record<string, unknown>>> {
    if (!this._memoize) {
      return await this.adapter.getAll()
    }

    let response: Record<string, Record<string, unknown>>

    if (this.cache[this.GET_ALL_KEY]) {
      // Build from cache
      response = {}
      const featureKeys = await (this.cache[this.FEATURES_KEY] as Promise<string[]>)
      for (const featureKey of featureKeys) {
        const key = this.keyFor(featureKey)
        response[featureKey] = await (this.cache[key] as Promise<Record<string, unknown>>)
      }
    } else {
      // Fetch from adapter and cache
      response = await this.adapter.getAll()
      Object.entries(response).forEach(([featureKey, value]) => {
        this.cache[this.keyFor(featureKey)] = Promise.resolve(value)
      })
      this.cache[this.FEATURES_KEY] = Promise.resolve(Object.keys(response))
      this.cache[this.GET_ALL_KEY] = true
    }

    return response
  }

  /**
   * Enable a gate for a feature and expire its cache.
   * @param feature - Feature to enable gate for
   * @param gate - Gate to enable
   * @param thing - Value to enable for the gate
   * @returns True if gate was enabled successfully
   */
  async enable(feature: Feature, gate: IGate, thing: IType): Promise<boolean> {
    const result = await this.adapter.enable(feature, gate, thing)
    this.expireFeature(feature)
    return result
  }

  /**
   * Disable a gate for a feature and expire its cache.
   * @param feature - Feature to disable gate for
   * @param gate - Gate to disable
   * @param thing - Value to disable for the gate
   * @returns True if gate was disabled successfully
   */
  async disable(feature: Feature, gate: IGate, thing: IType): Promise<boolean> {
    const result = await this.adapter.disable(feature, gate, thing)
    this.expireFeature(feature)
    return result
  }

  /**
   * Check if the wrapped adapter is read-only.
   * @returns True if adapter is read-only
   */
  readOnly(): boolean {
    return this.adapter.readOnly()
  }

  /**
   * Export the wrapped adapter's features.
   * Does not use cache.
   * @param options - Export options
   * @returns Export object
   */
  async export(options: { format?: string; version?: number } = {}): Promise<Export> {
    return await this.adapter.export(options)
  }

  /**
   * Import features to the wrapped adapter.
   * Clears the cache after import.
   * @param source - The source to import from
   * @returns True if successful
   */
  async import(source: IAdapter | Export | Dsl): Promise<boolean> {
    const result = await this.adapter.import(source)
    if (this._memoize) {
      // Clear entire cache after import
      Object.keys(this.cache).forEach(key => delete this.cache[key])
    }
    return result
  }

  /**
   * Generate a cache key for a feature.
   * @param key - Feature key
   * @returns Cache key string
   */
  private keyFor(key: string): string {
    return `feature/${key}`
  }

  /**
   * Remove a feature from the cache.
   * @param feature - Feature to expire from cache
   */
  private expireFeature(feature: Feature): void {
    if (this._memoize) {
      delete this.cache[this.keyFor(feature.key)]
    }
  }

  /**
   * Remove the features list from the cache.
   */
  private expireFeaturesSet(): void {
    if (this._memoize) {
      delete this.cache[this.FEATURES_KEY]
    }
  }
}
