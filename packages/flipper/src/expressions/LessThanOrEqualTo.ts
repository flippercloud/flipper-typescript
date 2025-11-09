import Comparable from './Comparable'

/**
 * Returns true if left is less than or equal to right.
 */
class LessThanOrEqualTo extends Comparable {
  protected operator = '<='

  constructor(...args: unknown[]) {
    super('LessThanOrEqualTo', ...args)
  }
}

export default LessThanOrEqualTo
