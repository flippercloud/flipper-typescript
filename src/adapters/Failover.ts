import type Feature from '../Feature'
import type { IAdapter, IGate, IType } from '../interfaces'
import type Export from '../Export'
import type Dsl from '../Dsl'

/**
 * Options for configuring Failover adapter behavior.
 */
export interface FailoverOptions {
  /**
   * Whether to write to both primary and secondary adapters.
   * Default: false
   */
  dualWrite?: boolean

  /**
   * Array of error constructors to catch and trigger failover.
   * Default: [Error]
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors?: Array<new (...args: any[]) => Error>
}

/**
 * High availability adapter that fails over from primary to secondary on errors.
 *
 * The Failover adapter provides resilience by automatically switching to a
 * secondary adapter when the primary adapter fails. This is useful for:
 * - Cache + database setups (fast cache with reliable database fallback)
 * - Multi-region deployments (primary region with backup region)
 * - Graceful degradation during outages
 *
 * @example
 * ```typescript
 * // Simple failover: try cache, fall back to database
 * const adapter = new Failover(
 *   cacheAdapter,     // Fast but might fail
 *   databaseAdapter   // Slower but reliable
 * );
 *
 * // Dual write mode: keep both adapters in sync
 * const adapter = new Failover(
 *   cacheAdapter,
 *   databaseAdapter,
 *   { dualWrite: true }
 * );
 *
 * // Custom error handling
 * const adapter = new Failover(
 *   primaryAdapter,
 *   secondaryAdapter,
 *   { errors: [NetworkError, TimeoutError] }
 * );
 * ```
 */
export default class Failover implements IAdapter {
  /**
   * Primary adapter (source of truth).
   */
  private primary: IAdapter

  /**
   * Secondary adapter (fallback).
   */
  private secondary: IAdapter

  /**
   * Whether to write to both adapters.
   */
  private dualWrite: boolean

  /**
   * Error types to catch and trigger failover.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private errors: Array<new (...args: any[]) => Error>

  /**
   * Creates a new Failover adapter.
   * @param primary - The primary adapter
   * @param secondary - The secondary (fallback) adapter
   * @param options - Configuration options
   */
  constructor(primary: IAdapter, secondary: IAdapter, options: FailoverOptions = {}) {
    this.primary = primary
    this.secondary = secondary
    this.dualWrite = options.dualWrite ?? false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.errors = (options.errors ?? [Error]) as Array<new (...args: any[]) => Error>
  }

  /**
   * Returns the name of the primary adapter.
   * @returns The adapter name
   */
  get name(): string {
    return this.primary.name
  }

  /**
   * Get all features, failing over to secondary on error.
   * @returns Array of all features
   */
  features(): Feature[] {
    try {
      return this.primary.features()
    } catch (error) {
      if (this.shouldFailover(error)) {
        return this.secondary.features()
      }
      throw error
    }
  }

  /**
   * Add a feature, optionally writing to both adapters.
   * @param feature - Feature to add
   * @returns True if feature was added successfully
   */
  add(feature: Feature): boolean {
    const result = this.primary.add(feature)
    if (this.dualWrite) {
      this.secondary.add(feature)
    }
    return result
  }

  /**
   * Remove a feature, optionally removing from both adapters.
   * @param feature - Feature to remove
   * @returns True if feature was removed successfully
   */
  remove(feature: Feature): boolean {
    const result = this.primary.remove(feature)
    if (this.dualWrite) {
      this.secondary.remove(feature)
    }
    return result
  }

  /**
   * Clear a feature, optionally clearing from both adapters.
   * @param feature - Feature to clear
   * @returns True if feature was cleared successfully
   */
  clear(feature: Feature): boolean {
    const result = this.primary.clear(feature)
    if (this.dualWrite) {
      this.secondary.clear(feature)
    }
    return result
  }

  /**
   * Get a feature's state, failing over to secondary on error.
   * @param feature - Feature to get state for
   * @returns Feature gate values
   */
  get(feature: Feature): Record<string, unknown> {
    try {
      return this.primary.get(feature)
    } catch (error) {
      if (this.shouldFailover(error)) {
        return this.secondary.get(feature)
      }
      throw error
    }
  }

  /**
   * Get multiple features' state, failing over to secondary on error.
   * @param features - Features to get state for
   * @returns Map of feature keys to gate values
   */
  getMulti(features: Feature[]): Record<string, Record<string, unknown>> {
    try {
      return this.primary.getMulti(features)
    } catch (error) {
      if (this.shouldFailover(error)) {
        return this.secondary.getMulti(features)
      }
      throw error
    }
  }

  /**
   * Get all features' state, failing over to secondary on error.
   * @returns Map of all feature keys to gate values
   */
  getAll(): Record<string, Record<string, unknown>> {
    try {
      return this.primary.getAll()
    } catch (error) {
      if (this.shouldFailover(error)) {
        return this.secondary.getAll()
      }
      throw error
    }
  }

  /**
   * Enable a gate for a feature, optionally enabling in both adapters.
   * @param feature - Feature to enable gate for
   * @param gate - Gate to enable
   * @param thing - Value to enable for the gate
   * @returns True if gate was enabled successfully
   */
  enable(feature: Feature, gate: IGate, thing: IType): boolean {
    const result = this.primary.enable(feature, gate, thing)
    if (this.dualWrite) {
      this.secondary.enable(feature, gate, thing)
    }
    return result
  }

  /**
   * Disable a gate for a feature, optionally disabling in both adapters.
   * @param feature - Feature to disable gate for
   * @param gate - Gate to disable
   * @param thing - Value to disable for the gate
   * @returns True if gate was disabled successfully
   */
  disable(feature: Feature, gate: IGate, thing: IType): boolean {
    const result = this.primary.disable(feature, gate, thing)
    if (this.dualWrite) {
      this.secondary.disable(feature, gate, thing)
    }
    return result
  }

  /**
   * Check if the adapter is read-only.
   * @returns True if adapter is read-only
   */
  readOnly(): boolean {
    return this.primary.readOnly()
  }

  /**
   * Export the primary adapter's features.
   * @param options - Export options
   * @returns Export object
   */
  export(options: { format?: string; version?: number } = {}): Export {
    try {
      return this.primary.export(options)
    } catch (error) {
      if (this.shouldFailover(error)) {
        return this.secondary.export(options)
      }
      throw error
    }
  }

  /**
   * Import features to the primary adapter, optionally importing to both.
   * @param source - The source to import from
   * @returns True if successful
   */
  import(source: IAdapter | Export | Dsl): boolean {
    const result = this.primary.import(source)
    if (this.dualWrite) {
      this.secondary.import(source)
    }
    return result
  }

  /**
   * Check if an error should trigger failover to secondary.
   * @param error - The error to check
   * @returns True if should failover
   */
  private shouldFailover(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false
    }

    return this.errors.some((errorType) => error instanceof errorType)
  }
}
