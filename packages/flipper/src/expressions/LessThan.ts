import Comparable from './Comparable'

/**
 * Returns true if left is less than right.
 */
class LessThan extends Comparable {
  protected operator = '<'

  constructor(...args: unknown[]) {
    super('LessThan', ...args)
  }
}

export default LessThan
