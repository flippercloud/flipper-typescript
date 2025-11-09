import { IType } from './interfaces'

/**
 * Type wrapper for boolean values in feature flag operations.
 *
 * Used by BooleanGate to enable or disable features for everyone.
 *
 * @example
 * const enabled = BooleanType.wrap(true);
 * console.log(enabled.value); // true
 *
 * const disabled = BooleanType.wrap(false);
 * console.log(disabled.value); // false
 */
class BooleanType implements IType {
  /**
   * Wrap a boolean value in a BooleanType.
   * @param thing - A boolean or BooleanType instance
   * @returns BooleanType instance
   * @throws Error if the value is not a boolean
   */
  public static wrap(thing: unknown): BooleanType {
    if (thing instanceof BooleanType) { return thing }
    if (typeof thing === 'boolean') {
      return new BooleanType(thing)
    }
    throw new Error('Invalid boolean type')
  }

  /**
   * The boolean value.
   */
  public value: boolean

  /**
   * Creates a new BooleanType.
   * @param thing - The boolean value
   */
  constructor(thing: boolean) {
    this.value = thing
  }
}

export default BooleanType
