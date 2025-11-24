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
 * const local = new MemoryAdapter()
 * const remote = new RedisAdapter()
 * const dualWrite = new DualWrite(local, remote)
 *
 * // Writes go to both (remote first, then local)
 * await dualWrite.enable(feature, gate, thing)
 *
 * // Reads come from local only
 * await dualWrite.get(feature)
 *
 * // Migration pattern: gradually shift reads to remote
 * // Step 1: DualWrite(old, new) - write to both, read from old
 * // Step 2: Verify new adapter has all data
 * // Step 3: Switch to reading from new adapter
 * // Step 4: Remove dual write
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
  async features(): Promise<Feature[]> {
    return await this.local.features()
  }

  /**
   * Get feature state from the local adapter.
   * @param feature - Feature to get state for
   * @returns Feature gate values
   */
  async get(feature: Feature): Promise<Record<string, unknown>> {
    return await this.local.get(feature)
  }

  /**
   * Get multiple features' state from the local adapter.
   * @param features - Features to get state for
   * @returns Map of feature keys to gate values
   */
  async getMulti(features: Feature[]): Promise<Record<string, Record<string, unknown>>> {
    return await this.local.getMulti(features)
  }

  /**
   * Get all features' state from the local adapter.
   * @returns Map of all feature keys to gate values
   */
  async getAll(): Promise<Record<string, Record<string, unknown>>> {
    return await this.local.getAll()
  }

  /**
   * Add a feature to both remote and local adapters.
   * Writes to remote first, then local.
   * @param feature - Feature to add
   * @returns Result from the remote adapter
   */
  async add(feature: Feature): Promise<boolean> {
    const result = await this.remote.add(feature)
    await this.local.add(feature)
    return result
  }

  /**
   * Remove a feature from both remote and local adapters.
   * Writes to remote first, then local.
   * @param feature - Feature to remove
   * @returns Result from the remote adapter
   */
  async remove(feature: Feature): Promise<boolean> {
    const result = await this.remote.remove(feature)
    await this.local.remove(feature)
    return result
  }

  /**
   * Clear all gate values for a feature in both remote and local adapters.
   * Writes to remote first, then local.
   * @param feature - Feature to clear
   * @returns Result from the remote adapter
   */
  async clear(feature: Feature): Promise<boolean> {
    const result = await this.remote.clear(feature)
    await this.local.clear(feature)
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
  async enable(feature: Feature, gate: IGate, thing: IType): Promise<boolean> {
    const result = await this.remote.enable(feature, gate, thing)
    await this.local.enable(feature, gate, thing)
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
  async disable(feature: Feature, gate: IGate, thing: IType): Promise<boolean> {
    const result = await this.remote.disable(feature, gate, thing)
    await this.local.disable(feature, gate, thing)
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
  async export(options: { format?: string; version?: number } = {}): Promise<Export> {
    return await this.local.export(options)
  }

  /**
   * Import features to both remote and local adapters.
   * Imports to remote first, then local.
   * @param source - The source to import from
   * @returns Result from the remote adapter
   */
  async import(source: IAdapter | Export | Dsl): Promise<boolean> {
    const result = await this.remote.import(source)
    await this.local.import(source)
    return result
  }
}
