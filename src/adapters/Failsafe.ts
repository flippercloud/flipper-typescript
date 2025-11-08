import type Feature from '../Feature'
import type { IAdapter, IGate, IType } from '../interfaces'
import type Export from '../Export'
import type Dsl from '../Dsl'
import JsonExport from '../exporters/json/Export'

/**
 * Options for configuring Failsafe adapter behavior.
 */
export interface FailsafeOptions {
  /**
   * Array of error constructors to catch and return safe defaults for.
   * Default: [Error]
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors?: Array<new (...args: any[]) => Error>
}

/**
 * Adapter that returns safe defaults instead of throwing errors.
 *
 * The Failsafe adapter ensures your application continues to work even when
 * the feature flag system fails. Instead of throwing errors, it returns safe
 * default values that effectively disable all features (fail closed).
 *
 * This is useful for:
 * - External adapters that might be unreachable (HTTP, Redis, etc.)
 * - Ensuring feature flags never crash your application
 * - Graceful degradation when storage is unavailable
 *
 * Safe defaults:
 * - features() → empty array
 * - get/getMulti/getAll() → empty object (all features disabled)
 * - add/remove/clear/enable/disable() → false
 *
 * @example
 * ```typescript
 * // Wrap external adapter with failsafe
 * const adapter = new Failsafe(
 *   new HttpAdapter('https://flipper.example.com')
 * );
 *
 * // If HTTP adapter fails, features are disabled (fail closed)
 * const enabled = flipper.isEnabled('new-feature'); // false, no error
 *
 * // Custom error handling
 * const adapter = new Failsafe(
 *   myAdapter,
 *   { errors: [NetworkError, TimeoutError] }
 * );
 * ```
 */
export default class Failsafe implements IAdapter {
  /**
   * The wrapped adapter.
   */
  private adapter: IAdapter

  /**
   * Error types to catch and return safe defaults for.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private errors: Array<new (...args: any[]) => Error>

  /**
   * Creates a new Failsafe adapter.
   * @param adapter - The adapter to wrap with failsafe behavior
   * @param options - Configuration options
   */
  constructor(adapter: IAdapter, options: FailsafeOptions = {}) {
    this.adapter = adapter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.errors = (options.errors ?? [Error]) as Array<new (...args: any[]) => Error>
  }

  /**
   * Returns the name of the wrapped adapter.
   * @returns The adapter name
   */
  get name(): string {
    return this.adapter.name
  }

  /**
   * Get all features, returning empty array on error.
   * @returns Array of all features, or empty array on error
   */
  features(): Feature[] {
    try {
      return this.adapter.features()
    } catch (error) {
      if (this.shouldCatch(error)) {
        return []
      }
      throw error
    }
  }

  /**
   * Add a feature, returning false on error.
   * @param feature - Feature to add
   * @returns True if added, false on error
   */
  add(feature: Feature): boolean {
    try {
      return this.adapter.add(feature)
    } catch (error) {
      if (this.shouldCatch(error)) {
        return false
      }
      throw error
    }
  }

  /**
   * Remove a feature, returning false on error.
   * @param feature - Feature to remove
   * @returns True if removed, false on error
   */
  remove(feature: Feature): boolean {
    try {
      return this.adapter.remove(feature)
    } catch (error) {
      if (this.shouldCatch(error)) {
        return false
      }
      throw error
    }
  }

  /**
   * Clear a feature, returning false on error.
   * @param feature - Feature to clear
   * @returns True if cleared, false on error
   */
  clear(feature: Feature): boolean {
    try {
      return this.adapter.clear(feature)
    } catch (error) {
      if (this.shouldCatch(error)) {
        return false
      }
      throw error
    }
  }

  /**
   * Get a feature's state, returning empty object on error.
   * @param feature - Feature to get state for
   * @returns Feature gate values, or empty object on error
   */
  get(feature: Feature): Record<string, unknown> {
    try {
      return this.adapter.get(feature)
    } catch (error) {
      if (this.shouldCatch(error)) {
        return {}
      }
      throw error
    }
  }

  /**
   * Get multiple features' state, returning empty object on error.
   * @param features - Features to get state for
   * @returns Map of feature keys to gate values, or empty object on error
   */
  getMulti(features: Feature[]): Record<string, Record<string, unknown>> {
    try {
      return this.adapter.getMulti(features)
    } catch (error) {
      if (this.shouldCatch(error)) {
        return {}
      }
      throw error
    }
  }

  /**
   * Get all features' state, returning empty object on error.
   * @returns Map of all feature keys to gate values, or empty object on error
   */
  getAll(): Record<string, Record<string, unknown>> {
    try {
      return this.adapter.getAll()
    } catch (error) {
      if (this.shouldCatch(error)) {
        return {}
      }
      throw error
    }
  }

  /**
   * Enable a gate for a feature, returning false on error.
   * @param feature - Feature to enable gate for
   * @param gate - Gate to enable
   * @param thing - Value to enable for the gate
   * @returns True if enabled, false on error
   */
  enable(feature: Feature, gate: IGate, thing: IType): boolean {
    try {
      return this.adapter.enable(feature, gate, thing)
    } catch (error) {
      if (this.shouldCatch(error)) {
        return false
      }
      throw error
    }
  }

  /**
   * Disable a gate for a feature, returning false on error.
   * @param feature - Feature to disable gate for
   * @param gate - Gate to disable
   * @param thing - Value to disable for the gate
   * @returns True if disabled, false on error
   */
  disable(feature: Feature, gate: IGate, thing: IType): boolean {
    try {
      return this.adapter.disable(feature, gate, thing)
    } catch (error) {
      if (this.shouldCatch(error)) {
        return false
      }
      throw error
    }
  }

  /**
   * Check if the adapter is read-only.
   * @returns True if adapter is read-only
   */
  readOnly(): boolean {
    return this.adapter.readOnly()
  }

  /**
   * Export the adapter's features.
   * @param options - Export options
   * @returns Export object
   */
  export(options: { format?: string; version?: number } = {}): Export {
    try {
      return this.adapter.export(options)
    } catch (error) {
      if (this.shouldCatch(error)) {
        // Return empty export
        return new JsonExport({
          contents: JSON.stringify({ version: 1, features: {} }),
          version: 1,
        })
      }
      throw error
    }
  }

  /**
   * Import features to the adapter, returning false on error.
   * @param source - The source to import from
   * @returns True if successful, false on error
   */
  import(source: IAdapter | Export | Dsl): boolean {
    try {
      return this.adapter.import(source)
    } catch (error) {
      if (this.shouldCatch(error)) {
        return false
      }
      throw error
    }
  }

  /**
   * Check if an error should be caught and handled gracefully.
   * @param error - The error to check
   * @returns True if should catch
   */
  private shouldCatch(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false
    }

    return this.errors.some((errorType) => error instanceof errorType)
  }
}
