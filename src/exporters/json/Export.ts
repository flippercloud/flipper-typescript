import BaseExport from '../../Export'
import Typecast from '../../Typecast'

/**
 * Raised when export contents are not valid JSON.
 */
export class JsonError extends Error {
  constructor(message = 'Invalid JSON in export contents') {
    super(message)
    this.name = 'JsonError'
  }
}

/**
 * Raised when export contents are not in the expected format.
 */
export class InvalidError extends Error {
  constructor(message = 'Invalid export format') {
    super(message)
    this.name = 'InvalidError'
  }
}

/**
 * JSON format export for Flipper features.
 *
 * Encapsulates feature flag state in JSON format, compatible with
 * the Ruby Flipper JSON export format.
 *
 * @example
 * ```typescript
 * // Create from JSON string
 * const jsonExport = new JsonExport({
 *   contents: '{"version":1,"features":{"search":{"boolean":"true"}}}',
 *   version: 1
 * });
 *
 * // Get features hash
 * const features = jsonExport.features();
 * // { search: { boolean: 'true', actors: Set([]), ... } }
 * ```
 */
class JsonExport extends BaseExport {
  /**
   * Cached features data.
   */
  private featuresCache?: Record<string, Record<string, unknown>>

  /**
   * Create a new JSON Export.
   * @param options - Export options
   */
  constructor(options: { contents: string; version?: number }) {
    super({
      contents: options.contents,
      format: 'json',
      version: options.version ?? 1,
    })
  }

  /**
   * Get the features hash from the JSON export.
   *
   * Parses the JSON contents and returns a normalized features hash
   * compatible with adapter.getAll().
   *
   * @returns Features hash with gate values
   * @throws {JsonError} If contents are not valid JSON
   * @throws {InvalidError} If contents don't have expected structure
   */
  public features(): Record<string, Record<string, unknown>> {
    if (this.featuresCache) {
      return this.featuresCache
    }

    try {
      const data = Typecast.fromJson(this.contents)

      if (!data || typeof data !== 'object' || !('features' in data)) {
        throw new InvalidError('Export missing "features" property')
      }

      const features = data.features

      if (!features || typeof features !== 'object') {
        throw new InvalidError('Export "features" property must be an object')
      }

      this.featuresCache = Typecast.featuresHash(
        features as Record<string, Record<string, unknown>>
      )
      return this.featuresCache
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new JsonError(`Failed to parse JSON: ${error.message}`)
      }
      if (error instanceof InvalidError) {
        throw error
      }
      throw new InvalidError(
        error instanceof Error ? error.message : 'Unknown error parsing export'
      )
    }
  }
}

export default JsonExport
