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
 * const memoryInstrumenter = new MemoryInstrumenter();
 * const adapter = new Instrumented(new Memory(), { instrumenter: memoryInstrumenter });
 * await adapter.features(); // Emits "adapter_operation.flipper" event
 * console.log(memoryInstrumenter.count()); // 1
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
  protected override wrap<T>(method: string, fn: () => T | Promise<T>): T | Promise<T> {
    return this.instrumenter.instrument<T>(
      Instrumented.INSTRUMENTATION_NAME,
      {
        operation: method,
        adapter_name: this.adapter.name,
      },
      payload => {
        const result = fn()
        // Handle both sync and async results
        if (result instanceof Promise) {
          return result.then(r => {
            payload.result = r
            return r
          })
        } else {
          payload.result = result
          return result
        }
      }
    )
  }

  /**
   * Add a feature with additional instrumentation context.
   */
  override async add(feature: Feature): Promise<boolean> {
    return await this.instrumentWithFeature('add', feature, () => this.adapter.add(feature))
  }

  /**
   * Remove a feature with additional instrumentation context.
   */
  override async remove(feature: Feature): Promise<boolean> {
    return await this.instrumentWithFeature('remove', feature, () => this.adapter.remove(feature))
  }

  /**
   * Clear a feature with additional instrumentation context.
   */
  override async clear(feature: Feature): Promise<boolean> {
    return await this.instrumentWithFeature('clear', feature, () => this.adapter.clear(feature))
  }

  /**
   * Get a feature with additional instrumentation context.
   */
  override async get(feature: Feature): Promise<Record<string, unknown>> {
    return await this.instrumentWithFeature('get', feature, () => this.adapter.get(feature))
  }

  /**
   * Get multiple features with additional instrumentation context.
   */
  override async getMulti(features: Feature[]): Promise<Record<string, Record<string, unknown>>> {
    const result = this.instrumenter.instrument<Promise<Record<string, Record<string, unknown>>>>(
      Instrumented.INSTRUMENTATION_NAME,
      {
        operation: 'getMulti',
        adapter_name: this.adapter.name,
        feature_names: features.map(f => f.name),
      },
      async payload => {
        payload.result = await this.adapter.getMulti(features)
        return payload.result as Record<string, Record<string, unknown>>
      }
    )
    return await result
  }

  /**
   * Enable a gate with additional instrumentation context.
   */
  override async enable(feature: Feature, gate: IGate, thing: IType): Promise<boolean> {
    const result = this.instrumenter.instrument<Promise<boolean>>(
      Instrumented.INSTRUMENTATION_NAME,
      {
        operation: 'enable',
        adapter_name: this.adapter.name,
        feature_name: feature.name,
        gate_name: gate.key,
      },
      async payload => {
        payload.result = await this.adapter.enable(feature, gate, thing)
        return payload.result as boolean
      }
    )
    return await result
  }

  /**
   * Disable a gate with additional instrumentation context.
   */
  override async disable(feature: Feature, gate: IGate, thing: IType): Promise<boolean> {
    const result = this.instrumenter.instrument<Promise<boolean>>(
      Instrumented.INSTRUMENTATION_NAME,
      {
        operation: 'disable',
        adapter_name: this.adapter.name,
        feature_name: feature.name,
        gate_name: gate.key,
      },
      async payload => {
        payload.result = await this.adapter.disable(feature, gate, thing)
        return payload.result as boolean
      }
    )
    return await result
  }

  /**
   * Helper method to instrument operations that take a single feature.
   */
  private async instrumentWithFeature<T>(
    operation: string,
    feature: Feature,
    fn: () => Promise<T>
  ): Promise<T> {
    const result = this.instrumenter.instrument<Promise<T>>(
      Instrumented.INSTRUMENTATION_NAME,
      {
        operation,
        adapter_name: this.adapter.name,
        feature_name: feature.name,
      },
      async payload => {
        payload.result = await fn()
        return payload.result as T
      }
    )
    return await result
  }
}
