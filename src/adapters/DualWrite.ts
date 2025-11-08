import type Feature from '../Feature'
import type { IAdapter, IGate, IType } from '../interfaces'
import Export from '../Export'
import Dsl from '../Dsl'

/**
 * Adapter that writes to two adapters but reads from only one (local).
 *
 * Useful for migrating between adapters or keeping a local cache in sync with
 * a remote store. Writes go to the remote adapter first, then to local.
 * All reads come from the local adapter only.
 *
 * @example
 * ```typescript
 * const local = new MemoryAdapter();
 * const remote = new RedisAdapter();
 * const dualWrite = new DualWrite(local, remote);
 *
 * // Writes go to both (remote first, then local)
 * dualWrite.enable(feature, gate, thing);
 *
 * // Reads come from local only
 * dualWrite.get(feature);
 *
 * // Migration pattern: gradually shift reads to remote
 * // Step 1: DualWrite(old, new) - write to both, read from old
 * // Step 2: Verify new adapter has all data
 * // Step 3: Switch to reading from new adapter
 * // Step 4: Remove dual write
 * ```
 */
export default class DualWrite implements IAdapter {
  /**
   * The local adapter used for all read operations.
   */
  private local: IAdapter

  /**
   * The remote adapter that receives writes first.
   */
  private remote: IAdapter

  /**
   * Creates a new DualWrite adapter.
   * @param local - Adapter to use for all reads and as the secondary write target
   * @param remote - Adapter to use as the primary write target
   */
  constructor(local: IAdapter, remote: IAdapter) {
    this.local = local
    this.remote = remote
  }

  /**
   * Returns the name of the local adapter.
   * @returns The adapter name
   */
  get name(): string {
    return this.local.name
  }

  /**
   * Get all features from the local adapter.
   * @returns Array of all features
   */
  features(): Feature[] {
    return this.local.features()
  }

  /**
   * Get feature state from the local adapter.
   * @param feature - Feature to get state for
   * @returns Feature gate values
   */
  get(feature: Feature): Record<string, unknown> {
    return this.local.get(feature)
  }

  /**
   * Get multiple features' state from the local adapter.
   * @param features - Features to get state for
   * @returns Map of feature keys to gate values
   */
  getMulti(features: Feature[]): Record<string, Record<string, unknown>> {
    return this.local.getMulti(features)
  }

  /**
   * Get all features' state from the local adapter.
   * @returns Map of all feature keys to gate values
   */
  getAll(): Record<string, Record<string, unknown>> {
    return this.local.getAll()
  }

  /**
   * Add a feature to both remote and local adapters.
   * Writes to remote first, then local.
   * @param feature - Feature to add
   * @returns Result from the remote adapter
   */
  add(feature: Feature): boolean {
    const result = this.remote.add(feature)
    this.local.add(feature)
    return result
  }

  /**
   * Remove a feature from both remote and local adapters.
   * Writes to remote first, then local.
   * @param feature - Feature to remove
   * @returns Result from the remote adapter
   */
  remove(feature: Feature): boolean {
    const result = this.remote.remove(feature)
    this.local.remove(feature)
    return result
  }

  /**
   * Clear all gate values for a feature in both remote and local adapters.
   * Writes to remote first, then local.
   * @param feature - Feature to clear
   * @returns Result from the remote adapter
   */
  clear(feature: Feature): boolean {
    const result = this.remote.clear(feature)
    this.local.clear(feature)
    return result
  }

  /**
   * Enable a gate for a feature in both remote and local adapters.
   * Writes to remote first, then local.
   * @param feature - Feature to enable gate for
   * @param gate - Gate to enable
   * @param thing - Value to enable for the gate
   * @returns Result from the remote adapter
   */
  enable(feature: Feature, gate: IGate, thing: IType): boolean {
    const result = this.remote.enable(feature, gate, thing)
    this.local.enable(feature, gate, thing)
    return result
  }

  /**
   * Disable a gate for a feature in both remote and local adapters.
   * Writes to remote first, then local.
   * @param feature - Feature to disable gate for
   * @param gate - Gate to disable
   * @param thing - Value to disable for the gate
   * @returns Result from the remote adapter
   */
  disable(feature: Feature, gate: IGate, thing: IType): boolean {
    const result = this.remote.disable(feature, gate, thing)
    this.local.disable(feature, gate, thing)
    return result
  }

  /**
   * Check if the local adapter is read-only.
   * @returns True if local adapter is read-only
   */
  readOnly(): boolean {
    return this.local.readOnly()
  }

  /**
   * Export the local adapter's features.
   * @param options - Export options
   * @returns Export object
   */
  export(options: { format?: string; version?: number } = {}): Export {
    return this.local.export(options)
  }

  /**
   * Import features to both remote and local adapters.
   * Imports to remote first, then local.
   * @param source - The source to import from
   * @returns Result from the remote adapter
   */
  import(source: IAdapter | Export | Dsl): boolean {
    const result = this.remote.import(source)
    this.local.import(source)
    return result
  }
}
