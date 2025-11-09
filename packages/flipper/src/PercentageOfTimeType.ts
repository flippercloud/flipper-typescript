import { IType } from './interfaces'

/**
 * Type wrapper for percentage of time values (0-100).
 *
 * Used by PercentageOfTimeGate for non-deterministic percentage-based checks.
 * Values must be between 0 and 100 (inclusive).
 *
 * @example
 * const tenPercent = PercentageOfTimeType.wrap(10);
 * console.log(tenPercent.value); // 10
 *
 * // Throws error for invalid values
 * PercentageOfTimeType.wrap(200); // Error: value must be <= 100
 * PercentageOfTimeType.wrap(-5); // Error: value must be >= 0
 */
class PercentageOfTimeType implements IType {
  /**
   * Wrap a percentage value in a PercentageOfTimeType.
   * @param thing - A number (0-100) or PercentageOfTimeType instance
   * @returns PercentageOfTimeType instance
   * @throws Error if the value is not a valid percentage
   */
  public static wrap(thing: unknown): PercentageOfTimeType {
    if (thing instanceof PercentageOfTimeType) { return thing }
    if (typeof thing === 'number') {
      return new PercentageOfTimeType(thing)
    }
    throw new Error('Invalid percentage type')
  }

  /**
   * The percentage value (0-100).
   */
  public value: number

  /**
   * Creates a new PercentageOfTimeType.
   * @param value - The percentage value (0-100)
   * @throws Error if value is outside the valid range
   */
  constructor(value: number) {
    if (value < 0 || value > 100) {
      throw new Error(`value must be a positive number less than or equal to 100, but was ${value}`)
    }

    this.value = value
  }
}

export default PercentageOfTimeType
