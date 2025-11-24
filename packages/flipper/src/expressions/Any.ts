import type { EvaluationContext, ExpressionLike } from './types'
import { buildExpression } from './build'

/**
 * Returns true if any argument evaluates to truthy.
 * Equivalent to logical OR.
 *
 * @example
 * const expr = Expression.build({
 *   Any: [
 *     { Property: 'admin' },
 *     { Property: 'beta_user' }
 *   ]
 * })
 * expr.evaluate({
 *   properties: { admin: false, beta_user: true }
 * }) // => true
 */
class Any {
  readonly name = 'Any'
  private args: ExpressionLike[]

  constructor(...args: unknown[]) {
    this.args = args.map(arg => buildExpression(arg))
  }

  evaluate(context: EvaluationContext): boolean {
    return this.args.some(arg => Boolean(arg.evaluate(context)))
  }

  value(): unknown {
    return { [this.name]: this.args.map(arg => arg.value()) }
  }

  equals(other: unknown): boolean {
    if (!(other instanceof Any)) {
      return false
    }
    if (this.args.length !== other.args.length) {
      return false
    }
    return this.args.every((arg, i) => arg.equals(other.args[i]))
  }
}

export default Any
