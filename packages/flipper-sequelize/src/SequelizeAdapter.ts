import type { IAdapter, IGate, IType } from '@flippercloud/flipper'
import { Exporter, Synchronizer } from '@flippercloud/flipper'
import type { Feature as FeatureClass, Export, Dsl } from '@flippercloud/flipper'
import type { ModelStatic } from 'sequelize'
import type { FlipperFeatureModel, FlipperGateModel } from './Models'

/**
 * Options for initializing the SequelizeAdapter.
 */
export interface SequelizeAdapterOptions {
  /**
   * The Flipper Feature model instance
   */
  Feature: ModelStatic<FlipperFeatureModel>
  /**
   * The Flipper Gate model instance
   */
  Gate: ModelStatic<FlipperGateModel>
  /**
   * Whether the adapter is read-only (default: false)
   */
  readOnly?: boolean
  /**
   * Force all read queries to use the primary database connection in a
   * replicated setup (default: false). This passes `useMaster: true` to
   * Sequelize find calls so they bypass replicas. Helpful when you have
   * just written feature changes and need read-after-write consistency.
   */
  useMaster?: boolean
}

/**
 * Sequelize adapter for storing Flipper feature flags in a database.
 *
 * Supports any database backend that Sequelize supports (MySQL, PostgreSQL, SQLite, etc.).
 *
 * @example
 * import { Sequelize } from 'sequelize'
 * import Flipper from '@flippercloud/flipper'
 * import { SequelizeAdapter, createFlipperModels } from '@flippercloud/flipper-sequelize'
 *
 * const sequelize = new Sequelize('mysql://user:pass@localhost/db')
 * const { Feature, Gate } = createFlipperModels(sequelize)
 *
 * const adapter = new SequelizeAdapter({ Feature, Gate })
 * const flipper = new Flipper(adapter)
 *
 * // Use flipper
 * await flipper.enable('new-feature')
 */
class SequelizeAdapter implements IAdapter {
  /**
   * The name of this adapter.
   */
  public name: string = 'sequelize'

  /**
   * The Feature model
   */
  private Feature: ModelStatic<FlipperFeatureModel>

  /**
   * The Gate model
   */
  private Gate: ModelStatic<FlipperGateModel>

  /**
   * Whether the adapter is read-only
   */
  private _readOnly: boolean

  /**
   * Whether read queries should be forced to the primary (master) connection.
   */
  private _useMaster: boolean

  constructor(options: SequelizeAdapterOptions) {
    this.Feature = options.Feature
    this.Gate = options.Gate
    this._readOnly = options.readOnly ?? false
    this._useMaster = options.useMaster ?? false
  }

  /**
   * Get all features.
   * @returns Array of all Feature instances
   */
  async features(): Promise<FeatureClass[]> {
    const features = await this.Feature.findAll({ raw: true, useMaster: this._useMaster })
    // We need to import Feature dynamically to avoid circular dependencies
    const module = await import('@flippercloud/flipper')
    const Feature = module.Feature
    return features.map(f => new Feature(f.key, this, {}))
  }

  /**
   * Add a new feature.
   * @param feature - Feature to add
   * @returns True if successful
   */
  async add(feature: FeatureClass): Promise<boolean> {
    if (this._readOnly) {
      throw new Error('Adapter is read-only')
    }

    try {
      await this.Feature.create({ key: feature.key })
      return true
    } catch (error) {
      // Check if it's a unique constraint error
      if (
        error instanceof Error &&
        'name' in error &&
        error.name === 'SequelizeUniqueConstraintError'
      ) {
        return false
      }
      throw error
    }
  }

  /**
   * Remove a feature.
   * @param feature - Feature to remove
   * @returns True if successful
   */
  async remove(feature: FeatureClass): Promise<boolean> {
    if (this._readOnly) {
      throw new Error('Adapter is read-only')
    }

    const result = await this.Feature.destroy({
      where: { key: feature.key },
    })

    return result > 0
  }

  /**
   * Get feature state from the database.
   * @param feature - Feature to get state for
   * @returns Object with gate keys and their values
   */
  async get(feature: FeatureClass): Promise<Record<string, unknown>> {
    const dbFeature = await this.Feature.findOne({
      where: { key: feature.key },
      raw: true,
      useMaster: this._useMaster,
    })

    if (!dbFeature) {
      return {}
    }

    const gates = await this.Gate.findAll({
      where: { featureKey: feature.key },
      attributes: ['key', 'value'],
      raw: true,
      useMaster: this._useMaster,
    })

    return this.resultForGates(feature, gates as Array<{ key: string | null; value: string | null }>)
  }

  /**
   * Get multiple features' state from the database.
   * @param features - Features to get state for
   * @returns Map of feature keys to gate values
   */
  async getMulti(features: FeatureClass[]): Promise<Record<string, Record<string, unknown>>> {
    const result: Record<string, Record<string, unknown>> = {}

    for (const feature of features) {
      result[feature.key] = await this.get(feature)
    }

    return result
  }

  /**
   * Get all features' state from the database.
   * @returns Map of all feature keys to gate values
   */
  async getAll(): Promise<Record<string, Record<string, unknown>>> {
    const features = await this.features()
    return this.getMulti(features)
  }

  /**
   * Enable a gate for a feature.
   * @param feature - Feature to enable gate for
   * @param gate - Gate to enable
   * @param thing - Value to enable for the gate
   * @returns True if successful
   */
  async enable(feature: FeatureClass, gate: IGate, thing: IType): Promise<boolean> {
    if (this._readOnly) {
      throw new Error('Adapter is read-only')
    }

    // Ensure feature exists
    let dbFeature = await this.Feature.findOne({
      where: { key: feature.key },
      useMaster: this._useMaster,
    })

    if (!dbFeature) {
      await this.add(feature)
      dbFeature = await this.Feature.findOne({
        where: { key: feature.key },
        useMaster: this._useMaster,
      })
    }

    if (!dbFeature) {
      throw new Error(`Feature ${feature.key} not found`)
    }

    switch (gate.dataType) {
      case 'boolean':
        await this.set(feature, gate, thing, { clear: true })
        break
      case 'number':
        await this.set(feature, gate, thing)
        break
      case 'json':
        await this.set(feature, gate, thing, { json: true })
        break
      case 'set':
        await this.enableMulti(feature, gate, thing)
        break
      default:
        await this.set(feature, gate, thing)
        break
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
  async disable(feature: FeatureClass, gate: IGate, thing: IType): Promise<boolean> {
    if (this._readOnly) {
      throw new Error('Adapter is read-only')
    }

    const dbFeature = await this.Feature.findOne({
      where: { key: feature.key },
      useMaster: this._useMaster,
    })

    if (!dbFeature) {
      return false
    }

    // For set types, remove from set
    if (gate.dataType === 'set') {
      await this.deleteSetValue(feature, gate, String(thing.value))
      return true
    }

    // For boolean and number types, delete the gate completely
    switch (gate.dataType) {
      case 'boolean':
        await this.clear(feature)
        return true
      case 'number':
        await this.set(feature, gate, thing)
        return true
      case 'json':
            await this.deleteGate(feature, gate)
        return true
      default: {
            await this.deleteGate(feature, gate)
        return true
      }
    }
  }

  /**
   * Clear all gate values for a feature.
   * @param feature - Feature to clear
   * @returns True if successful
   */
  async clear(feature: FeatureClass): Promise<boolean> {
    if (this._readOnly) {
      throw new Error('Adapter is read-only')
    }

    const dbFeature = await this.Feature.findOne({
      where: { key: feature.key },
      useMaster: this._useMaster,
    })

    if (!dbFeature) {
      return false
    }

    await this.Gate.destroy({
      where: { featureKey: feature.key },
    })

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
    if (this._readOnly) {
      throw new Error('Adapter is read-only')
    }

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
   * Add a value to a set gate.
   * Mirrors ActiveRecord adapter behavior by writing one row per value.
   */
  private async enableMulti(feature: FeatureClass, gate: IGate, thing: IType): Promise<void> {
    try {
      await this.Gate.create({
        featureKey: feature.key,
        key: this.storageKey(gate),
        value: String(thing.value),
      })
    } catch (error) {
      if (
        error instanceof Error &&
        'name' in error &&
        error.name === 'SequelizeUniqueConstraintError'
      ) {
        return
      }
      throw error
    }
  }

  /**
   * Create or replace a single gate value.
   */
  private async set(
    feature: FeatureClass,
    gate: IGate,
    thing: IType,
    options: { clear?: boolean; json?: boolean } = {}
  ): Promise<void> {
    const clearFeature = options.clear ?? false
    const jsonFeature = options.json ?? false

    if (clearFeature) {
      await this.clear(feature)
    }

    await this.deleteGate(feature, gate)

    const value = this.serializeGateValue(jsonFeature ? 'json' : gate.dataType, thing.value)

    try {
      await this.Gate.create({
        featureKey: feature.key,
        key: this.storageKey(gate),
        value,
      })
    } catch (error) {
      if (
        error instanceof Error &&
        'name' in error &&
        error.name === 'SequelizeUniqueConstraintError'
      ) {
        return
      }
      throw error
    }
  }

  /**
   * Delete all rows for a specific gate.
   */
  private async deleteGate(feature: FeatureClass, gate: IGate): Promise<void> {
    await this.Gate.destroy({
      where: {
        featureKey: feature.key,
        key: this.storageKeys(gate),
      },
    })
  }

  /**
   * Remove single value from set gate.
   */
  private async deleteSetValue(feature: FeatureClass, gate: IGate, value: string): Promise<void> {
    await this.Gate.destroy({
      where: {
        featureKey: feature.key,
        key: this.storageKeys(gate),
        value,
      },
    })
  }

  /**
   * Convert database rows to Flipper gate structure.
   */
  private resultForGates(
    feature: FeatureClass,
    rows: Array<{ key: string | null; value: string | null }>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    const validRows = rows.filter(row => row.key !== null)

    for (const gate of feature.gates) {
      const gateKey = gate.key
      const gateRows = validRows.filter(row => this.storageKeys(gate).includes(row.key ?? ''))

      if (gateRows.length === 0) {
        continue
      }

      switch (gate.dataType) {
        case 'set': {
          const values = gateRows
            .map(row => row.value)
            .filter((value): value is string => value !== null)
          result[gateKey] = new Set(values)
          break
        }
        case 'json': {
          const value = gateRows[0]?.value
          if (typeof value === 'string') {
            result[gateKey] = this.parseGateValue(value)
          }
          break
        }
        default: {
          const value = gateRows[0]?.value
          if (typeof value === 'string') {
            result[gateKey] = this.parseGateValue(value)
          }
          break
        }
      }
    }

    return result
  }

  /**
   * Serialize a gate value based on its type.
   * @private
   * @param dataType - The gate data type
   * @param value - The value to serialize
   * @returns Serialized value as string
   */
  private serializeGateValue(dataType: string, value: unknown): string {
    switch (dataType) {
      case 'boolean':
        return String(value === true)
      case 'number':
        return String(value)
      case 'json':
        return typeof value === 'string' ? value : JSON.stringify(value)
      default:
        return String(value)
    }
  }

  /**
   * Parse a gate value from storage.
   * @private
   * @param value - The serialized value
   * @returns Parsed value
   */
  private parseGateValue(value: string): unknown {
    try {
      const parsed = JSON.parse(value) as unknown
      // Check if it's a set (array)
      if (Array.isArray(parsed)) {
        return new Set(parsed)
      }
      return parsed
    } catch {
      // If it's not valid JSON, try to parse as boolean or number
      if (value === 'true') return true
      if (value === 'false') return false
      if (!isNaN(Number(value))) return Number(value)
      return value
    }
  }

  /**
   * Return the primary storage key for a gate, using snake_case for cross-language compatibility.
   * Ruby Flipper stores percentage gates as `percentage_of_actors`/`percentage_of_time`, so we
   * mirror that format while still accepting camelCase keys that may already exist in the DB.
   */
  private storageKey(gate: IGate): string {
    return this.toSnakeCase(gate.key)
  }

  /**
   * Return all accepted storage keys for a gate (camelCase + snake_case) so we can read and clean
   * up data regardless of which client wrote it.
   */
  private storageKeys(gate: IGate): string[] {
    const keys = [gate.key]
    const snake = this.toSnakeCase(gate.key)
    if (!keys.includes(snake)) {
      keys.push(snake)
    }
    return keys
  }

  private toSnakeCase(key: string): string {
    return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()
  }
}

export default SequelizeAdapter
