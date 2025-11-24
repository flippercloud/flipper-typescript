import Feature from './Feature'
import { IAdapter, IGate, IType } from './interfaces'
import Exporter from './Exporter'
import type Export from './Export'
import type Dsl from './Dsl'
import Synchronizer from './adapters/sync/Synchronizer'

interface IFeatures {
  [index: string]: Feature
}

type StorageValue = string | Set<string> | undefined

interface IFeatureGates {
  [index: string]: StorageValue
}

/**
 * In-memory adapter for storing feature flag state.
 *
 * Stores all feature flag data in memory using JavaScript objects and Sets.
 * Data is not persisted and will be lost when the process exits.
 *
 * Ideal for testing, development, and single-process applications.
 *
 * @example
 * const adapter = new MemoryAdapter()
 * const flipper = new Flipper(adapter)
 *
 * // Enable a feature
 * await flipper.enable('new-feature')
 *
 * // Data is stored in memory
 * await flipper.isFeatureEnabled('new-feature') // true
 *
 * // Data is lost on restart (not persisted)
 */
class MemoryAdapter implements IAdapter {
  /**
   * The name of this adapter.
   */
  public name: string

  /**
   * Internal storage for feature instances.
   */
  private featuresStore: IFeatures

  /**
   * Internal storage for feature gates (new async structure).
   */
  private features_store: Record<string, Map<string, unknown>>

  /**
   * Internal storage for gate values.
   */
  private sourceStore: IFeatureGates

  constructor() {
    this.name = 'memory'
    this.featuresStore = {}
    this.features_store = {}
    this.sourceStore = {}
  }

  /**
   * Get all features.
   * @returns Array of all features
   */
  async features(): Promise<Feature[]> {
    return await Promise.resolve(
      Object.keys(this.features_store).map(key => {
        return new Feature(key, this, {})
      })
    )
  }

  /**
   * Add a feature to the adapter.
   * @param feature - Feature to add
   * @returns True if successful
   */
  async add(feature: Feature): Promise<boolean> {
    if (!this.features_store[feature.key]) {
      this.features_store[feature.key] = new Map<string, unknown>()
      return await Promise.resolve(true)
    }

    return await Promise.resolve(false)
  }

  /**
   * Remove a feature from the adapter.
   * @param feature - Feature to remove
   * @returns True if successful
   */
  public async remove(feature: Feature): Promise<boolean> {
    delete this.featuresStore[feature.name]
    delete this.features_store[feature.key]
    await this.clear(feature)
    return true
  }

  /**
   * Get feature state from the adapter.
   * @param feature - Feature to get state for
   * @returns Feature gate values
   */
  async get(feature: Feature): Promise<Record<string, unknown>> {
    const gates: Record<string, unknown> = {}
    const prefix = `${feature.key}/`

    // Iterate through sourceStore to find all keys for this feature
    for (const [key, value] of Object.entries(this.sourceStore)) {
      if (key.startsWith(prefix)) {
        const gateKey = key.slice(prefix.length)

        // Check if this is a JSON gate by finding the gate type
        const gate = feature.gates.find(g => g.key === gateKey)
        if (gate && gate.dataType === 'json') {
          // Parse JSON strings back to objects
          if (value && typeof value === 'string') {
            try {
              gates[gateKey] = JSON.parse(value)
            } catch {
              gates[gateKey] = null
            }
          } else {
            gates[gateKey] = null
          }
        } else {
          gates[gateKey] = value
        }
      }
    }

    return await Promise.resolve(gates)
  }

  /**
   * Get multiple features' state from the adapter.
   * @param features - Features to get state for
   * @returns Map of feature keys to gate values
   */
  public async getMulti(features: Feature[]): Promise<Record<string, Record<string, unknown>>> {
    const result: Record<string, Record<string, unknown>> = {}
    for (const feature of features) {
      result[feature.key] = await this.get(feature)
    }
    return result
  }

  /**
   * Get all features' state from the adapter.
   * @returns Map of all feature keys to gate values
   */
  public async getAll(): Promise<Record<string, Record<string, unknown>>> {
    const result: Record<string, Record<string, unknown>> = {}
    const allFeatures = await this.features()
    for (const feature of allFeatures) {
      result[feature.key] = await this.get(feature)
    }
    return result
  }

  /**
   * Check if the adapter is read-only.
   * @returns False (memory adapter is writable)
   */
  public readOnly(): boolean {
    return false
  }

  /**
   * Export the adapter's features.
   * @param options - Export options
   * @returns Export object
   */
  public async export(options: { format?: string; version?: number } = {}): Promise<Export> {
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
  public async import(source: IAdapter | Export | Dsl): Promise<boolean> {
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
   * Enable a gate for a feature.
   * @param feature - Feature to enable gate for
   * @param gate - Gate to enable
   * @param thing - Value to enable for the gate
   * @returns True if successful
   */
  public async enable(feature: Feature, gate: IGate, thing: IType): Promise<boolean> {
    switch (gate.dataType) {
      case 'boolean': {
        this.write(this.key(feature, gate), String(true))
        break
      }
      case 'number': {
        this.write(this.key(feature, gate), String(thing.value))
        break
      }
      case 'set': {
        this.setAdd(this.key(feature, gate), String(thing.value))
        break
      }
      case 'json': {
        // For JSON types, store the stringified value directly
        this.write(this.key(feature, gate), String(thing.value))
        break
      }
      default: {
        throw new Error(`${gate.name} is not supported by this adapter yet`)
      }
    }
    return await Promise.resolve(true)
  }

  /**
   * Disable a gate for a feature.
   * @param feature - Feature to disable gate for
   * @param gate - Gate to disable
   * @param thing - Value to disable for the gate
   * @returns True if successful
   */
  public async disable(feature: Feature, gate: IGate, thing: IType): Promise<boolean> {
    switch (gate.dataType) {
      case 'boolean': {
        await this.clear(feature)
        break
      }
      case 'number': {
        await this.clear(feature)
        break
      }
      case 'set': {
        this.setDelete(this.key(feature, gate), String(thing.value))
        break
      }
      case 'json': {
        // For JSON types, delete the key to disable
        this.delete(this.key(feature, gate))
        break
      }
      default: {
        throw new Error(`${gate.name} is not supported by this adapter yet`)
      }
    }
    return true
  }

  /**
   * Clear all gate values for a feature.
   * @param feature - Feature to clear
   * @returns True if successful
   */
  async clear(feature: Feature): Promise<boolean> {
    const prefix = `${feature.key}/`
    const keysToDelete: string[] = []

    // Find all keys for this feature
    for (const key of Object.keys(this.sourceStore)) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key)
      }
    }

    // Delete all found keys
    for (const key of keysToDelete) {
      delete this.sourceStore[key]
    }

    return await Promise.resolve(true)
  }

  /**
   * Generate a storage key for a feature and gate.
   * @private
   * @param feature - The feature
   * @param gate - The gate
   * @returns Storage key string
   */
  private key(feature: Feature, gate: IGate) {
    return `${feature.key}/${gate.key}`
  }

  /**
   * Write a value to storage.
   * @private
   * @param key - Storage key
   * @param value - Value to store
   * @returns The stored value
   */
  private write(key: string, value: string) {
    return (this.sourceStore[key] = value)
  }

  /**
   * Delete a value from storage.
   * @private
   * @param key - Storage key
   */
  private delete(key: string) {
    delete this.sourceStore[key]
  }

  /**
   * Add a value to a set in storage.
   * @private
   * @param key - Storage key
   * @param value - Value to add to the set
   */
  private setAdd(key: string, value: string): void {
    this.ensure_set_initialized(key)
    const set = this.sourceStore[key]
    if (set instanceof Set) {
      set.add(value)
    }
  }

  /**
   * Remove a value from a set in storage.
   * @private
   * @param key - Storage key
   * @param value - Value to remove from the set
   */
  private setDelete(key: string, value: string): void {
    this.ensure_set_initialized(key)
    const set = this.sourceStore[key]
    if (set instanceof Set) {
      set.delete(value)
    }
  }

  /**
   * Ensure a set is initialized at the given key.
   * @private
   * @param key - Storage key
   */
  private ensure_set_initialized(key: string): void {
    if (!(this.sourceStore[key] instanceof Set)) {
      this.sourceStore[key] = new Set()
    }
  }
}

export default MemoryAdapter
