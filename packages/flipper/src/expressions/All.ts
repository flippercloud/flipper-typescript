import type { EvaluationContext, ExpressionLike } from './types'
import { buildExpression } from './build'

/**
 * Returns true if all arguments evaluate to truthy.
 * Equivalent to logical AND.
 *
 * @example
 * const expr = Expression.build({
 *   All: [
 *     { Property: 'admin' },
 *     { Property: 'active' }
 *   ]
 * })
 * expr.evaluate({
 *   properties: { admin: true, active: true }
 * }) // => true
 */
class All {
  readonly name = 'All'
  private args: ExpressionLike[]

  constructor(...args: unknown[]) {
    this.args = args.map(arg => buildExpression(arg))
  }

  evaluate(context: EvaluationContext): boolean {
    return this.args.every(arg => Boolean(arg.evaluate(context)))
  }

  value(): unknown {
    return { [this.name]: this.args.map(arg => arg.value()) }
  }

  equals(other: unknown): boolean {
    if (!(other instanceof All)) {
      return false
    }
    if (this.args.length !== other.args.length) {
      return false
    }
    return this.args.every((arg, i) => arg.equals(other.args[i]))
  }
}

export default All
