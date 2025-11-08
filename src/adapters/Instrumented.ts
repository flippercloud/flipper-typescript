import type Feature from '../Feature'
import type { IAdapter, IGate, IInstrumenter, IType } from '../interfaces'
import NoopInstrumenter from '../instrumenters/NoopInstrumenter'
import Wrapper from './Wrapper'

/**
 * Adapter wrapper that instruments all adapter operations.
 *
 * Wraps another adapter and emits instrumentation events for every operation,
 * allowing monitoring, logging, and performance tracking of adapter calls.
 *
 * @example
 * ```typescript
 * const memoryInstrumenter = new MemoryInstrumenter();
 * const adapter = new Instrumented(new Memory(), { instrumenter: memoryInstrumenter });
 * adapter.features(); // Emits "adapter_operation.flipper" event
 * console.log(memoryInstrumenter.count()); // 1
 * ```
 */
export default class Instrumented extends Wrapper {
  /**
   * The name of instrumentation events.
   */
  static readonly INSTRUMENTATION_NAME = 'adapter_operation.flipper'

  /**
   * The instrumenter used to emit events.
   */
  private instrumenter: IInstrumenter

  /**
   * Creates a new Instrumented adapter.
   *
   * @param adapter - The adapter to wrap
   * @param options - Configuration options
   * @param options.instrumenter - The instrumenter to use (defaults to NoopInstrumenter)
   */
  constructor(adapter: IAdapter, options: { instrumenter?: IInstrumenter } = {}) {
    super(adapter)
    this.instrumenter = options.instrumenter ?? new NoopInstrumenter()
  }

  /**
   * Hook that instruments every adapter operation.
   *
   * @param method - The name of the adapter method being called
   * @param fn - Function that executes the actual adapter operation
   * @returns The result from the adapter
   */
  protected override wrap<T>(method: string, fn: () => T): T {
    return this.instrumenter.instrument<T>(
      Instrumented.INSTRUMENTATION_NAME,
      {
        operation: method,
        adapter_name: this.adapter.name,
      },
      (payload) => {
        payload.result = fn()
        return payload.result as T
      },
    )
  }

  /**
   * Add a feature with additional instrumentation context.
   */
  override add(feature: Feature): boolean {
    return this.instrumentWithFeature('add', feature, () => this.adapter.add(feature))
  }

  /**
   * Remove a feature with additional instrumentation context.
   */
  override remove(feature: Feature): boolean {
    return this.instrumentWithFeature('remove', feature, () => this.adapter.remove(feature))
  }

  /**
   * Clear a feature with additional instrumentation context.
   */
  override clear(feature: Feature): boolean {
    return this.instrumentWithFeature('clear', feature, () => this.adapter.clear(feature))
  }

  /**
   * Get a feature with additional instrumentation context.
   */
  override get(feature: Feature): Record<string, unknown> {
    return this.instrumentWithFeature('get', feature, () => this.adapter.get(feature))
  }

  /**
   * Get multiple features with additional instrumentation context.
   */
  override getMulti(features: Feature[]): Record<string, Record<string, unknown>> {
    return this.instrumenter.instrument<Record<string, Record<string, unknown>>>(
      Instrumented.INSTRUMENTATION_NAME,
      {
        operation: 'getMulti',
        adapter_name: this.adapter.name,
        feature_names: features.map((f) => f.name),
      },
      (payload) => {
        payload.result = this.adapter.getMulti(features)
        return payload.result as Record<string, Record<string, unknown>>
      },
    )
  }

  /**
   * Enable a gate with additional instrumentation context.
   */
  override enable(feature: Feature, gate: IGate, thing: IType): boolean {
    return this.instrumenter.instrument<boolean>(
      Instrumented.INSTRUMENTATION_NAME,
      {
        operation: 'enable',
        adapter_name: this.adapter.name,
        feature_name: feature.name,
        gate_name: gate.key,
      },
      (payload) => {
        payload.result = this.adapter.enable(feature, gate, thing)
        return payload.result as boolean
      },
    )
  }

  /**
   * Disable a gate with additional instrumentation context.
   */
  override disable(feature: Feature, gate: IGate, thing: IType): boolean {
    return this.instrumenter.instrument<boolean>(
      Instrumented.INSTRUMENTATION_NAME,
      {
        operation: 'disable',
        adapter_name: this.adapter.name,
        feature_name: feature.name,
        gate_name: gate.key,
      },
      (payload) => {
        payload.result = this.adapter.disable(feature, gate, thing)
        return payload.result as boolean
      },
    )
  }

  /**
   * Helper method to instrument operations that take a single feature.
   */
  private instrumentWithFeature<T>(operation: string, feature: Feature, fn: () => T): T {
    return this.instrumenter.instrument<T>(
      Instrumented.INSTRUMENTATION_NAME,
      {
        operation,
        adapter_name: this.adapter.name,
        feature_name: feature.name,
      },
      (payload) => {
        payload.result = fn()
        return payload.result as T
      },
    )
  }
}
