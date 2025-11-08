import Comparable from './Comparable'

/**
 * Returns true if left does not equal right.
 */
class NotEqual extends Comparable {
  protected operator = '!='

  constructor(...args: unknown[]) {
    super('NotEqual', ...args)
  }
}

export default NotEqual
