import Wrapper from './Wrapper'

/**
 * Represents a single adapter operation.
 */
export interface Operation {
  /** The name of the operation (e.g., 'add', 'enable') */
  type: string
  /** Arguments passed to the operation */
  args: unknown[]
}

/**
 * Adapter wrapper that logs all operations.
 *
 * Useful for testing and debugging to verify adapter calls and their order.
 * Never use in production - for testing only.
 *
 * @example
 * ```typescript
 * const adapter = new MemoryAdapter();
 * const logger = new OperationLogger(adapter);
 *
 * logger.add(feature);
 * logger.enable(feature, gate, thing);
 *
 * // Check operations
 * logger.count(); // 2
 * logger.count('add'); // 1
 * logger.count('enable'); // 1
 *
 * // Get operations of a type
 * logger.type('enable'); // [{ type: 'enable', args: [...] }]
 *
 * // Get last operation of a type
 * logger.last('enable'); // { type: 'enable', args: [...] }
 *
 * // Reset log
 * logger.reset();
 * logger.count(); // 0
 * ```
 */
export default class OperationLogger extends Wrapper {
  /**
   * Array of logged operations.
   */
  private operations: Operation[]

  /**
   * Creates a new OperationLogger.
   * @param adapter - The adapter to wrap with operation logging
   * @param operations - Optional initial operations array (defaults to empty)
   */
  constructor(adapter: IAdapter, operations: Operation[] = []) {
    super(adapter)
    this.operations = operations
  }

  /**
   * Count the number of operations.
   * @param type - Optional: count only operations of this type
   * @returns Total count or count for specific type
   */
  count(type?: string): number {
    if (type) {
      return this.type(type).length
    }
    return this.operations.length
  }

  /**
   * Get all operations of a specific type.
   * @param type - The operation type to filter by
   * @returns Array of matching operations
   */
  type(type: string): Operation[] {
    return this.operations.filter((op) => op.type === type)
  }

  /**
   * Get the last operation of a specific type.
   * @param type - The operation type to find
   * @returns The last matching operation, or undefined
   */
  last(type: string): Operation | undefined {
    const ops = this.operations.slice().reverse()
    return ops.find((op) => op.type === type)
  }

  /**
   * Reset the operation log to empty.
   */
  reset(): void {
    this.operations = []
  }

  /**
   * Get all operations.
   * @returns Array of all operations
   */
  getOperations(): Operation[] {
    return [...this.operations]
  }

  /**
   * Logs the operation before delegating to the wrapped adapter.
   * @param method - The name of the method being called
   * @param fn - Function that calls the wrapped adapter method
   * @returns The result from the wrapped adapter
   */
  protected override wrap<T>(method: string, fn: () => T): T {
    // Log the operation
    this.operations.push({
      type: method,
      args: [],
    })
    return fn()
  }

  /**
   * Get a string representation of the logger.
   * @returns String representation
   */
  override toString(): string {
    return `OperationLogger(adapter=${this.adapter.name}, operations=${this.operations.length})`
  }

  /**
   * Get a JSON representation of the logger.
   * @returns Object with adapter name, operation count, and operations
   */
  toJSON(): {
    adapter: string
    operationCount: number
    operations: Operation[]
  } {
    return {
      adapter: this.adapter.name,
      operationCount: this.operations.length,
      operations: this.operations,
    }
  }
}

// Fix import
import type { IAdapter } from '../interfaces'
