import { IInstrumenter, InstrumentationPayload } from '../interfaces'

/**
 * No-op instrumenter that does nothing.
 *
 * This is the default instrumenter used by Flipper when no custom
 * instrumenter is provided. It simply executes the operation without
 * any instrumentation overhead.
 *
 * @example
 * ```typescript
 * const instrumenter = new NoopInstrumenter();
 * const result = instrumenter.instrument('operation', {}, (payload) => {
 *   return 'result';
 * });
 * // result === 'result'
 * ```
 */
class NoopInstrumenter implements IInstrumenter {
  /**
   * Execute the operation without instrumentation.
   *
   * @param _name - The name of the instrumentation event (ignored)
   * @param payload - The payload containing operation details
   * @param fn - The function to execute
   * @returns The result of the function
   */
  instrument<T>(_name: string, payload: InstrumentationPayload, fn: (payload: InstrumentationPayload) => T): T {
    return fn(payload)
  }
}

export default NoopInstrumenter
