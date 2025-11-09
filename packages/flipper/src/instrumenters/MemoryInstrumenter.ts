import { IInstrumenter, InstrumentationPayload } from '../interfaces'

/**
 * Represents a single instrumentation event.
 */
export interface InstrumentationEvent {
  /**
   * The name of the event.
   */
  name: string

  /**
   * The payload containing event details.
   */
  payload: InstrumentationPayload

  /**
   * The result of the instrumented operation.
   */
  result: unknown
}

/**
 * Instrumenter that stores all events in memory.
 *
 * This instrumenter is useful for testing and debugging, as it
 * captures all Flipper operations and allows you to inspect them.
 *
 * @example
 * ```typescript
 * const instrumenter = new MemoryInstrumenter();
 * const dsl = new Dsl(adapter, { instrumenter });
 *
 * dsl.enable('my-feature');
 *
 * // Check what operations occurred
 * console.log(instrumenter.events); // Array of events
 * console.log(instrumenter.count()); // Total event count
 * console.log(instrumenter.count('feature_operation.flipper')); // Count by name
 *
 * // Get specific events
 * const events = instrumenter.eventsByName('feature_operation.flipper');
 *
 * // Reset for next test
 * instrumenter.reset();
 * ```
 */
class MemoryInstrumenter implements IInstrumenter {
  /**
   * All recorded events.
   */
  public events: InstrumentationEvent[]

  constructor() {
    this.events = []
  }

  /**
   * Instrument an operation and record the event.
   *
   * @param name - The name of the instrumentation event
   * @param payload - The payload containing operation details
   * @param fn - The function to execute
   * @returns The result of the function
   */
  instrument<T>(name: string, payload: InstrumentationPayload, fn: (payload: InstrumentationPayload) => T): T {
    // Copy payload to prevent modifications from affecting the recorded event
    // Using Object.assign to avoid spread operator type issues
    const payloadCopy: InstrumentationPayload = Object.assign({}, payload)

    try {
      const result = fn(payloadCopy)
      // Record successful execution
      this.events.push({
        name,
        payload: payloadCopy,
        result,
      })
      return result
    } catch (e) {
      const error = e as Error
      payloadCopy.exception = [error.name, error.message]
      payloadCopy.exception_object = error
      // Record failed execution
      this.events.push({
        name,
        payload: payloadCopy,
        result: undefined,
      })
      throw error
    }
  }

  /**
   * Get all events with a specific name.
   *
   * @param name - The event name to filter by
   * @returns Array of matching events
   */
  eventsByName(name: string): InstrumentationEvent[] {
    return this.events.filter((event) => event.name === name)
  }

  /**
   * Get the first event with a specific name.
   *
   * @param name - The event name to find
   * @returns The first matching event or undefined
   */
  eventByName(name: string): InstrumentationEvent | undefined {
    return this.eventsByName(name)[0]
  }

  /**
   * Count total events or events with a specific name.
   *
   * @param name - Optional event name to filter by
   * @returns Number of matching events
   */
  count(name?: string): number {
    if (name === undefined) {
      return this.events.length
    }
    return this.eventsByName(name).length
  }

  /**
   * Clear all recorded events.
   */
  reset(): void {
    this.events = []
  }
}

export default MemoryInstrumenter
