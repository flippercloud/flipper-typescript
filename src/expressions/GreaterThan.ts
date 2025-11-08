import Comparable from './Comparable'

/**
 * Returns true if left is greater than right.
 */
class GreaterThan extends Comparable {
  protected operator = '>'

  constructor(...args: unknown[]) {
    super('GreaterThan', ...args)
  }
}

export default GreaterThan
