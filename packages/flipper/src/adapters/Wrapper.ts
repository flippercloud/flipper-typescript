import type Feature from '../Feature'
import type { IAdapter, IGate, IType } from '../interfaces'
import type Export from '../Export'
import type Dsl from '../Dsl'

/**
 * Base class for adapter wrappers that delegate to another adapter.
 *
 * All methods delegate to the wrapped adapter by default. Override the `wrap()`
 * method to customize behavior for all methods, or override individual methods
 * for more specific control.
 *
 * @example
 * class MyWrapper extends Wrapper {
 *   protected wrap<T>(method: string, fn: () => T): T {
 *     console.log(`Calling ${method}`)
 *     const result = fn()
 *     console.log(`Result: ${result}`)
 *     return result
 *   }
 * }
 */
export default class Wrapper implements IAdapter {
  /**
   * The wrapped adapter that all operations delegate to.
   */
  protected adapter: IAdapter

  /**
   * Creates a new Wrapper.
   * @param adapter - The adapter to wrap
   */
  constructor(adapter: IAdapter) {
    this.adapter = adapter
  }

  /**
   * Returns the name of the wrapped adapter.
   * @returns The adapter name
   */
  get name(): string {
    return this.adapter.name
  }

  /**
   * Get all features from the wrapped adapter.
   * @returns Array of all features
   */
  async features(): Promise<Feature[]> {
    return await this.wrap('features', () => this.adapter.features())
  }

  /**
   * Add a feature to the wrapped adapter.
   * @param feature - Feature to add
   * @returns True if feature was added successfully
   */
  async add(feature: Feature): Promise<boolean> {
    return await this.wrap('add', () => this.adapter.add(feature))
  }

  /**
   * Remove a feature from the wrapped adapter.
   * @param feature - Feature to remove
   * @returns True if feature was removed successfully
   */
  async remove(feature: Feature): Promise<boolean> {
    return await this.wrap('remove', () => this.adapter.remove(feature))
  }

  /**
   * Clear all gate values for a feature in the wrapped adapter.
   * @param feature - Feature to clear
   * @returns True if feature was cleared successfully
   */
  async clear(feature: Feature): Promise<boolean> {
    return await this.wrap('clear', () => this.adapter.clear(feature))
  }

  /**
   * Get a feature's state from the wrapped adapter.
   * @param feature - Feature to get state for
   * @returns Feature gate values
   */
  async get(feature: Feature): Promise<Record<string, unknown>> {
    return await this.wrap('get', () => this.adapter.get(feature))
  }

  /**
   * Get multiple features' state from the wrapped adapter.
   * @param features - Features to get state for
   * @returns Map of feature keys to gate values
   */
  async getMulti(features: Feature[]): Promise<Record<string, Record<string, unknown>>> {
    return await this.wrap('getMulti', () => this.adapter.getMulti(features))
  }

  /**
   * Get all features' state from the wrapped adapter.
   * @returns Map of all feature keys to gate values
   */
  async getAll(): Promise<Record<string, Record<string, unknown>>> {
    return await this.wrap('getAll', () => this.adapter.getAll())
  }

  /**
   * Enable a gate for a feature in the wrapped adapter.
   * @param feature - Feature to enable gate for
   * @param gate - Gate to enable
   * @param thing - Value to enable for the gate
   * @returns True if gate was enabled successfully
   */
  async enable(feature: Feature, gate: IGate, thing: IType): Promise<boolean> {
    return await this.wrap('enable', () => this.adapter.enable(feature, gate, thing))
  }

  /**
   * Disable a gate for a feature in the wrapped adapter.
   * @param feature - Feature to disable gate for
   * @param gate - Gate to disable
   * @param thing - Value to disable for the gate
   * @returns True if gate was disabled successfully
   */
  async disable(feature: Feature, gate: IGate, thing: IType): Promise<boolean> {
    return await this.wrap('disable', () => this.adapter.disable(feature, gate, thing))
  }

  /**
   * Check if the wrapped adapter is read-only.
   * @returns True if adapter is read-only
   */
  readOnly(): boolean {
    return this.adapter.readOnly()
  }

  /**
   * Export the wrapped adapter's features.
   * @param options - Export options
   * @returns Export object
   */
  async export(options: { format?: string; version?: number } = {}): Promise<Export> {
    return await this.wrap('export', () => this.adapter.export(options))
  }

  /**
   * Import features to the wrapped adapter.
   * @param source - The source to import from
   * @returns True if successful
   */
  async import(source: IAdapter | Export | Dsl): Promise<boolean> {
    return await this.wrap('import', () => this.adapter.import(source))
  }

  /**
   * Hook method called for every delegated method.
   * Override this to customize behavior across all methods.
   *
   * @param _method - The name of the method being called
   * @param fn - Function that calls the wrapped adapter method
   * @returns The result from the wrapped adapter
   */
  protected wrap<T>(_method: string, fn: () => T | Promise<T>): T | Promise<T> {
    return fn()
  }
}
