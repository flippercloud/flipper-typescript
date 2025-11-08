import Comparable from './Comparable'

/**
 * Returns true if left equals right.
 *
 * @example
 * const expr = Expression.build({
 *   Equal: [{ Property: 'plan' }, 'enterprise']
 * });
 * expr.evaluate({
 *   properties: { plan: 'enterprise' }
 * }); // => true
 */
class Equal extends Comparable {
  protected operator = '=='

  constructor(...args: unknown[]) {
    super('Equal', ...args)
  }
}

export default Equal
