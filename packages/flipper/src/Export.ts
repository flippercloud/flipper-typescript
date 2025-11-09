import type { IAdapter, IGate, IType } from './interfaces'
import Feature from './Feature'

/**
 * Temporary adapter that wraps an Export's features.
 * Used internally to provide an IAdapter interface for import operations.
 */
class ExportAdapter implements IAdapter {
  public readonly name = 'export'
  private featuresData: Record<string, Record<string, unknown>>

  constructor(featuresData: Record<string, Record<string, unknown>>) {
    this.featuresData = featuresData
  }

  async features(): Promise<Feature[]> {
    return await Promise.resolve(
      Object.keys(this.featuresData).map((key) => new Feature(key, this, {}))
    )
  }

  async add(_feature: Feature): Promise<boolean> {
    return await Promise.resolve(false)
  }

  async remove(_feature: Feature): Promise<boolean> {
    return await Promise.resolve(false)
  }

  async clear(_feature: Feature): Promise<boolean> {
    return await Promise.resolve(false)
  }

  async get(feature: Feature): Promise<Record<string, unknown>> {
    return await Promise.resolve(this.featuresData[feature.key] ?? {})
  }

  async getMulti(features: Feature[]): Promise<Record<string, Record<string, unknown>>> {
    return await Promise.resolve(
      Object.fromEntries(
        features.map((f) => [f.key, this.featuresData[f.key] ?? {}])
      )
    )
  }

  async getAll(): Promise<Record<string, Record<string, unknown>>> {
    return await Promise.resolve(this.featuresData)
  }

  async enable(_feature: Feature, _gate: IGate, _thing: IType): Promise<boolean> {
    return await Promise.resolve(false)
  }

  async disable(_feature: Feature, _gate: IGate, _thing: IType): Promise<boolean> {
    return await Promise.resolve(false)
  }

  readOnly(): boolean {
    return true
  }

  async export(): Promise<never> {
    return await Promise.reject(new Error('Cannot export from an Export'))
  }

  async import(): Promise<never> {
    return await Promise.reject(new Error('Cannot import to an Export'))
  }
}

/**
 * Base class for Flipper exports.
 *
 * Exports encapsulate feature flag state in a portable format that can be
 * saved, transferred, or imported into another Flipper instance.
 *
 * @example
 * // Export from source
 * const sourceExport = await sourceFlipper.export();
 *
 * // Transfer the export
 * const jsonString = sourceExport.contents;
 *
 * // Import to destination
 * await destinationFlipper.import(sourceExport);
 */
abstract class Export {
  /**
   * The serialized export contents (e.g., JSON string).
   */
  public readonly contents: string

  /**
   * The export format (e.g., 'json').
   */
  public readonly format: string

  /**
   * The export format version.
   */
  public readonly version: number

  /**
   * Cached adapter instance.
   */
  private adapterCache?: IAdapter

  /**
   * Create a new Export.
   * @param options - Export options
   */
  constructor(options: { contents: string; format?: string; version?: number }) {
    this.contents = options.contents
    this.format = options.format ?? 'json'
    this.version = options.version ?? 1
  }

  /**
   * Get the features hash from the export.
   *
   * Subclasses must implement this to parse the export contents
   * and return a features hash compatible with adapter.getAll().
   *
   * @returns Features hash with gate values
   */
  abstract features(): Record<string, Record<string, unknown>>

  /**
   * Get an adapter initialized with the exported features.
   *
   * This creates a temporary adapter that provides access to the
   * exported feature state for import operations.
   *
   * @returns Adapter with exported features
   */
  async adapter(): Promise<IAdapter> {
    if (!this.adapterCache) {
      this.adapterCache = new ExportAdapter(this.features())
    }
    return await Promise.resolve(this.adapterCache)
  }

  /**
   * Check if two exports are equal.
   * @param other - Other export to compare
   * @returns True if exports are equal
   */
  public equals(other: Export): boolean {
    return (
      this.constructor === other.constructor &&
      this.contents === other.contents &&
      this.format === other.format &&
      this.version === other.version
    )
  }
}

export default Export
