import Wrapper from './Wrapper'

/**
 * Error thrown when attempting to write to a read-only adapter.
 */
export class WriteAttemptedError extends Error {
  /**
   * Creates a new WriteAttemptedError.
   * @param message - Error message (defaults to standard message)
   */
  constructor(message = 'write attempted while in read only mode') {
    super(message)
    this.name = 'WriteAttemptedError'
  }
}

/**
 * Adapter wrapper that prevents all write operations.
 *
 * Useful for read-only environments where feature flags should not be modified,
 * or when you want to ensure certain code paths cannot change feature states.
 *
 * @example
 * const memoryAdapter = new MemoryAdapter();
 * const readOnlyAdapter = new ReadOnly(memoryAdapter);
 *
 * // Reads work fine
 * await readOnlyAdapter.features();
 * await readOnlyAdapter.get(feature);
 *
 * // Writes throw errors
 * await readOnlyAdapter.add(feature); // throws WriteAttemptedError
 * await readOnlyAdapter.enable(feature, gate, thing); // throws WriteAttemptedError
 */
export default class ReadOnly extends Wrapper {
  /**
   * Set of method names that are considered write operations.
   */
  private static readonly WRITE_METHODS = new Set([
    'add',
    'remove',
    'clear',
    'enable',
    'disable',
  ])

  /**
   * Always returns true for read-only adapters.
   * @returns True
   */
  override readOnly(): boolean {
    return true
  }

  /**
   * Intercepts all method calls and throws for write operations.
   * @param method - The method name being called
   * @param fn - The function to execute for read operations
   * @returns Result from the function
   * @throws {WriteAttemptedError} If a write method is called
   */
  protected override wrap<T>(method: string, fn: () => T | Promise<T>): T | Promise<T> {
    if (ReadOnly.WRITE_METHODS.has(method)) {
      throw new WriteAttemptedError()
    }
    return fn()
  }
}
