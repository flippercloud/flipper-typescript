import BooleanType from './BooleanType'
import FeatureCheckContext from './FeatureCheckContext'
import { IGate, IType } from './interfaces'

/**
 * Gate that enables or disables a feature for everyone.
 *
 * The boolean gate is the simplest gate type. When enabled (true),
 * the feature is on for everyone. When disabled (false), other gates
 * may still enable the feature for specific actors or contexts.
 *
 * @example
 * const feature = flipper.feature('maintenance-mode')
 *
 * // Enable for everyone
 * await feature.enable() // Sets boolean gate to true
 *
 * // Check without actor
 * await feature.isEnabled() // true
 *
 * // Disable for everyone (but other gates may still enable it)
 * await feature.disable() // Sets boolean gate to false
 */
class BooleanGate implements IGate {
  /**
   * The name of this gate type.
   */
  public name: string

  /**
   * The storage key for this gate's value.
   */
  public key: string

  /**
   * The data type used for storage.
   */
  public dataType: string

  constructor() {
    this.name = 'boolean'
    this.key = 'boolean'
    this.dataType = 'boolean'
  }

  /**
   * Check if the gate is enabled.
   * @param value - The gate value
   * @returns True if value is exactly true
   */
  public isEnabled(value: unknown): boolean {
    return value === true
  }

  /**
   * Check if the gate is open (always checks the boolean value).
   * @param context - The feature check context
   * @returns True if boolean value is true
   */
  public isOpen(context: FeatureCheckContext): boolean {
    return context.booleanValue === true
  }

  /**
   * Check if this gate can handle the given value type.
   * @param thing - The value to check
   * @returns True if the value is a BooleanType or boolean
   */
  public protectsThing(thing: unknown): boolean {
    if (thing instanceof BooleanType) {
      return true
    }
    if (thing === true) {
      return true
    }
    if (thing === false) {
      return true
    }
    return false
  }

  /**
   * Wrap a value in a BooleanType.
   * @param thing - The boolean value to wrap
   * @returns BooleanType instance
   */
  public wrap(thing: unknown): IType {
    return BooleanType.wrap(thing)
  }
}

export default BooleanGate
