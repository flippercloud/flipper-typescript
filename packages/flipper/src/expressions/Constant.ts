import type { EvaluationContext } from './types'

/**
 * A constant value expression.
 *
 * Wraps primitive values (strings, numbers, booleans, null) as expressions.
 *
 * @example
 * const str = new Constant('hello')
 * str.evaluate({ properties: {} }) // => 'hello'
 */
class Constant {
  private constantValue: unknown

  constructor(value: unknown) {
    this.constantValue = value
  }

  evaluate(_context: EvaluationContext): unknown {
    return this.constantValue
  }

  value(): unknown {
    // Return the constant value directly for serialization
    // Constants represent literal values and should not be wrapped
    return this.constantValue
  }

  equals(other: unknown): boolean {
    if (!(other instanceof Constant)) {
      return false
    }
    return this.constantValue === other.constantValue
  }
}

export default Constant
