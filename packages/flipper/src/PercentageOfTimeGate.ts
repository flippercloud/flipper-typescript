import FeatureCheckContext from './FeatureCheckContext'
import { IGate, IType } from './interfaces'
import PercentageOfTimeType from './PercentageOfTimeType'

/**
 * Gate that enables features for a percentage of requests (non-deterministic).
 *
 * Uses random number generation to decide if a feature is enabled for each check.
 * The same actor/request may get different results on subsequent checks.
 *
 * Useful for canary deployments or testing features under load.
 *
 * @example
 * ```typescript
 * const feature = flipper.feature('load-test');
 *
 * // Enable for 10% of requests
 * feature.enablePercentageOfTime(10);
 *
 * // Each check is independent and random
 * feature.isEnabled(); // May be true
 * feature.isEnabled(); // May be false
 * feature.isEnabled(); // May be true
 *
 * // Approximately 10% of checks will return true
 * ```
 */
class PercentageOfTimeGate implements IGate {
  /**
   * The name of this gate type.
   */
  public name: string

  /**
   * The storage key for this gate's value.
   */
  public key: string

  /**
   * The data type used for storage (number 0-100).
   */
  public dataType: string

  constructor() {
    this.name = 'percentageOfTime'
    this.key = 'percentageOfTime'
    this.dataType = 'number'
  }

  /**
   * Check if the gate is enabled (percentage > 0).
   * @param value - The gate value (percentage 0-100)
   * @returns True if percentage is greater than 0
   */
  public isEnabled(value: unknown): boolean {
    return typeof value === 'number' && value > 0
  }

  /**
   * Check if the gate is open using random chance.
   * @param context - The feature check context
   * @returns True if random number falls within the percentage
   */
  public isOpen(context: FeatureCheckContext): boolean {
    return Math.random() < (context.percentageOfTimeValue / 100)
  }

  /**
   * Check if this gate can handle the given value type.
   * @param thing - The value to check
   * @returns True if the value is a PercentageOfTimeType
   */
  public protectsThing(thing: unknown): boolean {
    if (thing instanceof PercentageOfTimeType) { return true }
    return false
  }

  /**
   * Wrap a value in a PercentageOfTimeType.
   * @param thing - The percentage value to wrap
   * @returns PercentageOfTimeType instance
   */
  public wrap(thing: unknown): IType {
    return PercentageOfTimeType.wrap(thing)
  }
}

export default PercentageOfTimeGate
