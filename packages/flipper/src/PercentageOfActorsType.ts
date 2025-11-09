import { IType } from './interfaces'

/**
 * Type wrapper for percentage of actors values (0-100).
 *
 * Used by PercentageOfActorsGate for deterministic percentage-based rollouts.
 * Values must be between 0 and 100 (inclusive).
 *
 * @example
 * const twentyFivePercent = PercentageOfActorsType.wrap(25);
 * console.log(twentyFivePercent.value); // 25
 *
 * // Throws error for invalid values
 * PercentageOfActorsType.wrap(150); // Error: value must be <= 100
 * PercentageOfActorsType.wrap(-10); // Error: value must be >= 0
 */
class PercentageOfActorsType implements IType {
  /**
   * Wrap a percentage value in a PercentageOfActorsType.
   * @param thing - A number (0-100) or PercentageOfActorsType instance
   * @returns PercentageOfActorsType instance
   * @throws Error if the value is not a valid percentage
   */
  public static wrap(thing: unknown): PercentageOfActorsType {
    if (thing instanceof PercentageOfActorsType) { return thing }
    if (typeof thing === 'number') {
      return new PercentageOfActorsType(thing)
    }
    throw new Error('Invalid percentage type')
  }

  /**
   * The percentage value (0-100).
   */
  public value: number

  /**
   * Creates a new PercentageOfActorsType.
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

export default PercentageOfActorsType
