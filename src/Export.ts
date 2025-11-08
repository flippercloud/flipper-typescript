import type { IAdapter } from './interfaces'
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

  features(): Feature[] {
    return []
  }

  add(_feature: Feature): boolean {
    return true
  }

  remove(_feature: Feature): boolean {
    return true
  }

  clear(_feature: Feature): boolean {
    return true
  }

  get(_feature: Feature): Record<string, unknown> {
    return {}
  }

  getMulti(_features: Feature[]): Record<string, Record<string, unknown>> {
    return {}
  }

  getAll(): Record<string, Record<string, unknown>> {
    return this.featuresData
  }

  enable(_feature: Feature, _gate: unknown, _thing: unknown): boolean {
    return true
  }

  disable(_feature: Feature, _gate: unknown, _thing: unknown): boolean {
    return true
  }

  readOnly(): boolean {
    return true
  }

  export(): never {
    throw new Error('Cannot export from an Export')
  }

  import(): never {
    throw new Error('Cannot import to an Export')
  }
}

/**
 * Base class for Flipper exports.
 *
 * Exports encapsulate feature flag state in a portable format that can be
 * saved, transferred, or imported into another Flipper instance.
 *
 * @example
 * ```typescript
 * // Export from source
 * const sourceExport = sourceFlipper.export();
 *
 * // Transfer the export
 * const jsonString = sourceExport.contents;
 *
 * // Import to destination
 * await destinationFlipper.import(sourceExport);
 * ```
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
  public adapter(): IAdapter {
    if (!this.adapterCache) {
      const featuresData = this.features()
      this.adapterCache = new ExportAdapter(featuresData)
    }
    return this.adapterCache
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
