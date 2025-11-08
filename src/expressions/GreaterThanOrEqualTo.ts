import Comparable from './Comparable'

/**
 * Returns true if left is greater than or equal to right.
 */
class GreaterThanOrEqualTo extends Comparable {
  protected operator = '>='

  constructor(...args: unknown[]) {
    super('GreaterThanOrEqualTo', ...args)
  }
}

export default GreaterThanOrEqualTo
