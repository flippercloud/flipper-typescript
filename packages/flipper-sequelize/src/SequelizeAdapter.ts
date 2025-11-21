import type { IAdapter, IGate, IType } from '@flippercloud/flipper'
import { Exporter, Synchronizer } from '@flippercloud/flipper'
import type { Feature as FeatureClass, Export, Dsl } from '@flippercloud/flipper'
import type { FlipperFeatureModel, FlipperGateModel } from './Models'

/**
 * Options for initializing the SequelizeAdapter.
 */
export interface SequelizeAdapterOptions {
  /**
   * The Flipper Feature model instance
   */
  Feature: typeof FlipperFeatureModel
  /**
   * The Flipper Gate model instance
   */
  Gate: typeof FlipperGateModel
  /**
   * Whether the adapter is read-only (default: false)
   */
  readOnly?: boolean
}

/**
 * Sequelize adapter for storing Flipper feature flags in a database.
 *
 * Supports any database backend that Sequelize supports (MySQL, PostgreSQL, SQLite, etc.).
 *
 * @example
 * import { Sequelize } from 'sequelize';
 * import Flipper from '@flippercloud/flipper';
 * import { SequelizeAdapter, createFlipperModels } from '@flippercloud/flipper-sequelize';
 *
 * const sequelize = new Sequelize('mysql://user:pass@localhost/db');
 * const { Feature, Gate } = createFlipperModels(sequelize);
 *
 * const adapter = new SequelizeAdapter({ Feature, Gate });
 * const flipper = new Flipper(adapter);
 *
 * // Use flipper
 * await flipper.enable('new-feature');
 */
class SequelizeAdapter implements IAdapter {
  /**
   * The name of this adapter.
   */
  public name: string = 'sequelize'

  /**
   * The Feature model
   */
  private Feature: any

  /**
   * The Gate model
   */
  private Gate: any

  /**
   * Whether the adapter is read-only
   */
  private _readOnly: boolean

  constructor(options: SequelizeAdapterOptions) {
    this.Feature = options.Feature
    this.Gate = options.Gate
    this._readOnly = options.readOnly ?? false
  }

  /**
   * Get all features.
   * @returns Array of all Feature instances
   */
  async features(): Promise<FeatureClass[]> {
    const features = await this.Feature.findAll({ raw: true })
    // We need to import Feature dynamically to avoid circular dependencies
    const module = await import('@flippercloud/flipper')
    const Feature = (module as any).Feature
    return features.map((f: any) => new (Feature as any)(f.key, this, {}))
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
    } catch (error: any) {
      // Check if it's a unique constraint error
      if (error.name === 'SequelizeUniqueConstraintError') {
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
    })

    if (!dbFeature) {
      return {}
    }

    const gates = await this.Gate.findAll({
      where: { feature_id: dbFeature.id },
      raw: true,
    })

    const result: Record<string, unknown> = {}
    for (const gate of gates) {
      result[gate.key] = this.parseGateValue(gate.value)
    }
    return result
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
    })

    if (!dbFeature) {
      await this.add(feature)
      dbFeature = await this.Feature.findOne({
        where: { key: feature.key },
      })
    }

    if (!dbFeature) {
      throw new Error(`Feature ${feature.key} not found`)
    }

    const value = this.serializeGateValue(gate.dataType, thing.value)

    // For set types, we need to handle differently
    if (gate.dataType === 'set') {
      return this.addToSet(dbFeature.id, gate.key, String(thing.value))
    }

    // For other types, upsert the gate
    const [gateRecord] = await this.Gate.findOrCreate({
      where: {
        feature_id: dbFeature.id,
        key: gate.key,
      },
      defaults: {
        value,
      },
    })

    if (gateRecord.value !== value) {
      await gateRecord.update({ value })
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
    })

    if (!dbFeature) {
      return false
    }

    // For set types, remove from set
    if (gate.dataType === 'set') {
      return this.removeFromSet(dbFeature.id, gate.key, String(thing.value))
    }

    // For boolean and number types, delete the gate completely
    const result = await this.Gate.destroy({
      where: {
        feature_id: dbFeature.id,
        key: gate.key,
      },
    })

    return result > 0
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
    })

    if (!dbFeature) {
      return false
    }

    await this.Gate.destroy({
      where: { feature_id: dbFeature.id },
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
   * @private
   * @param featureId - The feature ID
   * @param gateKey - The gate key
   * @param value - The value to add
   * @returns True if successful
   */
  private async addToSet(featureId: number, gateKey: string, value: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const gateRecord = await this.Gate.findOne({
      where: { feature_id: featureId, key: gateKey },
    })

    let currentSet = new Set<string>()

    if (gateRecord) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const parsed = JSON.parse(gateRecord.value)
        currentSet = new Set(Array.isArray(parsed) ? parsed : [])
      } catch {
        currentSet = new Set()
      }
    }

    currentSet.add(value)

    const serializedValue = JSON.stringify(Array.from(currentSet))

    if (gateRecord) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await gateRecord.update({ value: serializedValue })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await this.Gate.create({
        feature_id: featureId,
        key: gateKey,
        value: serializedValue,
      })
    }

    return true
  }

  /**
   * Remove a value from a set gate.
   * @private
   * @param featureId - The feature ID
   * @param gateKey - The gate key
   * @param value - The value to remove
   * @returns True if successful
   */
  private async removeFromSet(featureId: number, gateKey: string, value: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const gateRecord = await this.Gate.findOne({
      where: { feature_id: featureId, key: gateKey },
    })

    if (!gateRecord) {
      return false
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const parsed = JSON.parse(gateRecord.value)
      const currentSet = new Set(Array.isArray(parsed) ? parsed : [])
      currentSet.delete(value)

      if (currentSet.size === 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await gateRecord.destroy()
      } else {
        const serializedValue = JSON.stringify(Array.from(currentSet))
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await gateRecord.update({ value: serializedValue })
      }

      return true
    } catch {
      return false
    }
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
      case 'set':
        // Sets should be handled separately via addToSet
        return JSON.stringify([value])
      case 'json':
        return String(value)
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
      const parsed = JSON.parse(value)
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
}

export default SequelizeAdapter
