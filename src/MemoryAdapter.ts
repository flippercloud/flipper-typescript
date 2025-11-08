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
 * ```typescript
 * const adapter = new MemoryAdapter();
 * const flipper = new Flipper(adapter);
 *
 * // Enable a feature
 * flipper.enable('new-feature');
 *
 * // Data is stored in memory
 * flipper.isFeatureEnabled('new-feature'); // true
 *
 * // Data is lost on restart (not persisted)
 * ```
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
   * Internal storage for gate values.
   */
  private sourceStore: IFeatureGates

  constructor() {
    this.name = 'memory'
    this.featuresStore = {}
    this.sourceStore = {}
  }

  /**
   * Get all features.
   * @returns Array of all features
   */
  public features(): Feature[] {
    return Object.keys(this.featuresStore)
      .map((key) => this.featuresStore[key])
      .filter((feature): feature is Feature => feature !== undefined)
  }

  /**
   * Add a feature to the adapter.
   * @param feature - Feature to add
   * @returns True if successful
   */
  public add(feature: Feature) {
    if (this.featuresStore[feature.name] === undefined) {
      this.featuresStore[feature.name] = feature
    }
    return true
  }

  /**
   * Remove a feature from the adapter.
   * @param feature - Feature to remove
   * @returns True if successful
   */
  public remove(feature: Feature) {
    delete this.featuresStore[feature.name]
    this.clear(feature)
    return true
  }

  /**
   * Get feature state from the adapter.
   * @param feature - Feature to get state for
   * @returns Feature gate values
   */
  public get(feature: Feature): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    feature.gates.forEach((gate) => {
      switch (gate.dataType) {
        case 'boolean': {
          result[gate.key] = this.read(this.key(feature, gate))
          break
        }
        case 'number': {
          result[gate.key] = this.read(this.key(feature, gate))
          break
        }
        case 'set': {
          result[gate.key] = this.setMembers(this.key(feature, gate))
          break
        }
        default: {
          throw new Error(`${gate.name} is not supported by this adapter yet`)
        }
      }
    })

    return result
  }

  /**
   * Get multiple features' state from the adapter.
   * @param features - Features to get state for
   * @returns Map of feature keys to gate values
   */
  public getMulti(features: Feature[]): Record<string, Record<string, unknown>> {
    const result: Record<string, Record<string, unknown>> = {}
    features.forEach((feature) => {
      result[feature.key] = this.get(feature)
    })
    return result
  }

  /**
   * Get all features' state from the adapter.
   * @returns Map of all feature keys to gate values
   */
  public getAll(): Record<string, Record<string, unknown>> {
    const result: Record<string, Record<string, unknown>> = {}
    const allFeatures = this.features()
    allFeatures.forEach((feature) => {
      result[feature.key] = this.get(feature)
    })
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
  public export(options: { format?: string; version?: number } = {}): Export {
    const format = options.format ?? 'json'
    const version = options.version ?? 1
    const exporter = Exporter.build({ format, version })
    return exporter.call(this)
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
  public import(source: IAdapter | Export | Dsl): boolean {
    const sourceAdapter = this.getSourceAdapter(source)
    const synchronizer = new Synchronizer(this, sourceAdapter, { raise: true })
    return synchronizer.call()
  }

  /**
   * Extract an adapter from a source.
   * @private
   * @param source - The source to extract from
   * @returns The adapter
   */
  private getSourceAdapter(source: IAdapter | Export | Dsl): IAdapter {
    // Check if it has an adapter property (Dsl)
    if ('adapter' in source && source.adapter && typeof source.adapter !== 'function') {
      return source.adapter
    }
    // Check if it has an adapter() method (Export)
    if ('adapter' in source && typeof source.adapter === 'function') {
      return source.adapter()
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
  public enable(feature: Feature, gate: IGate, thing: IType): boolean {
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
      default: {
        throw new Error(`${gate.name} is not supported by this adapter yet`)
      }
    }
    return true
  }

  /**
   * Disable a gate for a feature.
   * @param feature - Feature to disable gate for
   * @param gate - Gate to disable
   * @param thing - Value to disable for the gate
   * @returns True if successful
   */
  public disable(feature: Feature, gate: IGate, thing: IType): boolean {
    switch (gate.dataType) {
      case 'boolean': {
        this.clear(feature)
        break
      }
      case 'number': {
        this.clear(feature)
        break
      }
      case 'set': {
        this.setDelete(this.key(feature, gate), String(thing.value))
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
  public  clear(feature: Feature) {
    feature.gates.forEach((gate) => {
      this.delete(this.key(feature, gate))
    })
    return true
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
   * Read a value from storage.
   * @private
   * @param key - Storage key
   * @returns Stored value or undefined
   */
  private read(key: string): StorageValue {
    return this.sourceStore[key]
  }

  /**
   * Write a value to storage.
   * @private
   * @param key - Storage key
   * @param value - Value to store
   * @returns The stored value
   */
  private write(key: string, value: string) {
    return this.sourceStore[key] = value
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
   * Get all members of a set from storage.
   * @private
   * @param key - Storage key
   * @returns Set of members
   */
  private setMembers(key: string): Set<string> {
    this.ensure_set_initialized(key)
    const set = this.sourceStore[key]
    return set instanceof Set ? set : new Set()
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
