/**
 * Utility class for type-casting values from storage.
 *
 * Adapters may store values in different formats. This class provides
 * consistent type-casting to ensure gate values are in the expected format.
 *
 * @example
 * ```typescript
 * // Convert various truthy values to boolean
 * Typecast.toBoolean(true); // true
 * Typecast.toBoolean('true'); // true
 * Typecast.toBoolean(1); // true
 * Typecast.toBoolean(false); // false
 *
 * // Convert arrays to Sets
 * Typecast.toSet(['a', 'b']); // Set(['a', 'b'])
 *
 * // Convert strings to numbers
 * Typecast.toNumber('42'); // 42
 * Typecast.toNumber('invalid'); // 0
 * ```
 */
class Typecast {
  /**
   * Convert a value to a boolean.
   * @param value - The value to convert
   * @returns True if value is truthy (true, 1, 'true', '1'), false otherwise
   */
  public static toBoolean(value: unknown): boolean {
    if (value === true || value === 1 || value === 'true' || value === '1') {
      return true
    }
    return false
  }

  /**
   * Convert a value to a Set of strings.
   * @param value - The value to convert (Set or Array)
   * @returns Set of string values, or empty Set if value is invalid
   */
  public static toSet(value: unknown): Set<string> {
    if (value instanceof Set) {
      return new Set(Array.from(value).map(String))
    }
    if (Array.isArray(value)) {
      return new Set(value.map(String))
    }
    return new Set()
  }

  /**
   * Convert a value to a number.
   * @param value - The value to convert
   * @returns Numeric value, or 0 if value cannot be converted
   */
  public static toNumber(value: unknown): number {
    if (typeof value === 'number') { return value }
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }
}

export default Typecast
