import type { IAdapter, IGate, IType } from '@flippercloud/flipper'
import { Exporter, Synchronizer, WriteAttemptedError } from '@flippercloud/flipper'
import type { Feature, Export, Dsl } from '@flippercloud/flipper'
import type { Redis } from 'ioredis'

/**
 * Options for initializing the RedisAdapter.
 */
export interface RedisAdapterOptions {
  /**
   * The Redis client instance (ioredis).
   */
  client: Redis

  /**
   * Optional prefix for all Redis keys (default: empty string).
   * @example "flipper:"
   */
  keyPrefix?: string

  /**
   * Whether the adapter is read-only (default: false).
   * When true, all write operations will throw ReadOnlyError.
   */
  readOnly?: boolean
}

/**
 * Redis adapter for storing Flipper feature flags in Redis.
 *
 * Uses Redis hashes to store feature gate values and a set to track all feature keys.
 * Compatible with the Ruby Flipper Redis adapter for cross-language interoperability.
 *
 * @example
 * import Redis from 'ioredis'
 * import Flipper from '@flippercloud/flipper'
 * import { RedisAdapter } from '@flippercloud/flipper-redis'
 *
 * const redis = new Redis()
 * const adapter = new RedisAdapter({ client: redis })
 * const flipper = new Flipper(adapter)
 *
 * // Use flipper
 * await flipper.enable('new-feature')
 */
class RedisAdapter implements IAdapter {
  /**
   * The name of this adapter.
   */
  public readonly name = 'redis'

  /**
   * The Redis client instance.
   */
  private client: Redis

  /**
   * The key prefix for all Redis keys.
   */
  private keyPrefix: string

  /**
   * Whether the adapter is read-only.
   */
  private _readOnly: boolean

  /**
   * Creates a new RedisAdapter.
   * @param options - Configuration options
   */
  constructor(options: RedisAdapterOptions) {
    this.client = options.client
    this.keyPrefix = options.keyPrefix ?? ''
    this._readOnly = options.readOnly ?? false
  }

  /**
   * Get the Redis key for the features set.
   * @returns The features set key
   */
  private featuresKey(): string {
    return `${this.keyPrefix}flipper_features`
  }

  /**
   * Get the Redis key for a specific feature.
   * @param featureName - The feature name
   * @returns The feature key
   */
  private keyFor(featureName: string): string {
    return `${this.keyPrefix}${featureName}`
  }

  /**
   * Get all features.
   * @returns Array of all Feature instances
   */
  async features(): Promise<Feature[]> {
    const keys = await this.readFeatureKeys()
    // We need to import Feature dynamically to avoid circular dependencies
    const module = await import('@flippercloud/flipper')
    const Feature = module.Feature
    return keys.map(key => new Feature(key, this, {}))
  }

  /**
   * Add a feature to the set of known features.
   * @param feature - Feature to add
   * @returns True if successful
   */
  async add(feature: Feature): Promise<boolean> {
    this.ensureWritable()
    await this.client.sadd(this.featuresKey(), feature.key)
    return true
  }

  /**
   * Remove a feature from the set of known features.
   * @param feature - Feature to remove
   * @returns True if successful
   */
  async remove(feature: Feature): Promise<boolean> {
    this.ensureWritable()
    await this.client.srem(this.featuresKey(), feature.key)
    await this.client.del(this.keyFor(feature.key))
    return true
  }

  /**
   * Clear all gate values for a feature.
   * @param feature - Feature to clear
   * @returns True if successful
   */
  async clear(feature: Feature): Promise<boolean> {
    this.ensureWritable()
    await this.client.del(this.keyFor(feature.key))
    return true
  }

  /**
   * Get feature state from the adapter.
   * @param feature - Feature to get state for
   * @returns Feature gate values
   */
  async get(feature: Feature): Promise<Record<string, unknown>> {
    const doc = await this.docFor(feature)
    return this.resultForFeature(feature, doc)
  }

  /**
   * Get multiple features' state from the adapter.
   * @param features - Features to get state for
   * @returns Map of feature keys to gate values
   */
  async getMulti(features: Feature[]): Promise<Record<string, Record<string, unknown>>> {
    return await this.readManyFeatures(features)
  }

  /**
   * Get all features' state from the adapter.
   * @returns Map of all feature keys to gate values
   */
  async getAll(): Promise<Record<string, Record<string, unknown>>> {
    const features = await this.features()
    return await this.readManyFeatures(features)
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
    const featureKey = this.keyFor(feature.key)

    switch (gate.dataType) {
      case 'boolean':
        await this.clear(feature)
        await this.client.hset(featureKey, gate.key, String(thing.value))
        break
      case 'integer':
      case 'number':
        await this.client.hset(featureKey, gate.key, String(thing.value))
        break
      case 'set':
        await this.client.hset(featureKey, this.toField(gate, thing), '1')
        break
      case 'json':
        await this.client.hset(featureKey, gate.key, JSON.stringify(thing.value))
        break
      default:
        throw new Error(`${gate.dataType} is not supported by this adapter`)
    }

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
    const featureKey = this.keyFor(feature.key)

    switch (gate.dataType) {
      case 'boolean':
        await this.client.del(featureKey)
        break
      case 'integer':
      case 'number':
        await this.client.hset(featureKey, gate.key, String(thing.value))
        break
      case 'set':
        await this.client.hdel(featureKey, this.toField(gate, thing))
        break
      case 'json':
        await this.client.hdel(featureKey, gate.key)
        break
      default:
        throw new Error(`${gate.dataType} is not supported by this adapter`)
    }

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
   *
   * This is a destructive operation - it will replace all local features
   * with the features from the source.
   *
   * @param source - The source to import from (Dsl, Adapter, or Export)
   * @returns True if successful
   */
  async import(source: IAdapter | Export | Dsl): Promise<boolean> {
    this.ensureWritable()
    const sourceAdapter = await this.getSourceAdapter(source)
    const synchronizer = new Synchronizer(this, sourceAdapter, { raise: true })
    return await synchronizer.call()
  }

  /**
   * Extract an adapter from a source.
   * @private
   * @param source - The source to extract from
   * @returns The adapter
   */
  private async getSourceAdapter(source: IAdapter | Export | Dsl): Promise<IAdapter> {
    // Check if it has an adapter property (Dsl)
    if ('adapter' in source && source.adapter && typeof source.adapter !== 'function') {
      return source.adapter
    }
    // Check if it has an adapter() method (Export)
    if ('adapter' in source && typeof source.adapter === 'function') {
      return await source.adapter()
    }
    // It's already an adapter
    return source as IAdapter
  }

  /**
   * Ensure the adapter is writable, throw if read-only.
   * @private
   */
  private ensureWritable(): void {
    if (this._readOnly) {
      throw new WriteAttemptedError()
    }
  }

  /**
   * Read all feature keys from Redis.
   * @private
   * @returns Set of feature keys
   */
  private async readFeatureKeys(): Promise<string[]> {
    const members = await this.client.smembers(this.featuresKey())
    return members
  }

  /**
   * Get the hash document for a feature.
   * @private
   * @param feature - The feature
   * @returns Hash of field => value
   */
  private async docFor(feature: Feature): Promise<Record<string, string>> {
    const result = await this.client.hgetall(this.keyFor(feature.key))
    return result
  }

  /**
   * Get hash documents for multiple features using pipelining.
   * @private
   * @param features - The features
   * @returns Array of hash documents
   */
  private async docsFor(features: Feature[]): Promise<Array<Record<string, string>>> {
    const pipeline = this.client.pipeline()
    for (const feature of features) {
      pipeline.hgetall(this.keyFor(feature.key))
    }
    const results = await pipeline.exec()

    if (!results) {
      return []
    }

    return results.map(([err, result]) => {
      if (err) throw err
      return result as Record<string, string>
    })
  }

  /**
   * Read multiple features efficiently using pipelining.
   * @private
   * @param features - Features to read
   * @returns Map of feature keys to gate values
   */
  private async readManyFeatures(features: Feature[]): Promise<Record<string, Record<string, unknown>>> {
    const docs = await this.docsFor(features)
    const result: Record<string, Record<string, unknown>> = {}

    for (let i = 0; i < features.length; i++) {
      const feature = features[i]
      const doc = docs[i]
      if (feature && doc) {
        result[feature.key] = this.resultForFeature(feature, doc)
      }
    }

    return result
  }

  /**
   * Convert a hash document to gate values for a feature.
   * @private
   * @param feature - The feature
   * @param doc - The hash document
   * @returns Gate values
   */
  private resultForFeature(feature: Feature, doc: Record<string, string>): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    const fields = Object.keys(doc)

    for (const gate of feature.gates) {
      switch (gate.dataType) {
        case 'boolean':
        case 'integer':
        case 'number':
          result[gate.key] = doc[gate.key] ?? null
          break
        case 'set':
          result[gate.key] = this.fieldsToGateValue(fields, gate)
          break
        case 'json':
          {
            const value = doc[gate.key]
            result[gate.key] = value ? JSON.parse(value) : null
          }
          break
        default:
          throw new Error(`${gate.dataType} is not supported by this adapter`)
      }
    }

    return result
  }

  /**
   * Convert gate and thing to a hash field name.
   * @private
   * @param gate - The gate
   * @param thing - The thing
   * @returns Field name
   */
  private toField(gate: IGate, thing: IType): string {
    return `${gate.key}/${thing.value}`
  }

  /**
   * Extract set values from hash fields for a gate.
   * @private
   * @param fields - All hash field names
   * @param gate - The gate
   * @returns Set of values
   */
  private fieldsToGateValue(fields: string[], gate: IGate): Set<string> {
    const regex = new RegExp(`^${this.escapeRegex(gate.key)}/`)
    const keys = fields.filter(field => regex.test(field))
    const values = keys.map(key => key.split('/', 2)[1]).filter((v): v is string => v !== undefined)
    return new Set(values)
  }

  /**
   * Escape special regex characters.
   * @private
   * @param str - String to escape
   * @returns Escaped string
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}

export default RedisAdapter
