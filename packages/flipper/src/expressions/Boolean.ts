import type { EvaluationContext, ExpressionLike } from './types'
import { buildExpression } from './build'

/**
 * Converts argument to boolean.
 *
 * @example
 * const expr = Expression.build({ Boolean: 'truthy' })
 * expr.evaluate({ properties: {} }) // => true
 */
class BooleanExpression {
  readonly name = 'Boolean'
  private args: ExpressionLike[]

  constructor(...args: unknown[]) {
    this.args = args.map(arg => buildExpression(arg))
  }

  evaluate(context: EvaluationContext): boolean {
    return Boolean(this.args[0]?.evaluate(context))
  }

  value(): unknown {
    return { [this.name]: this.args[0]?.value() }
  }

  equals(other: unknown): boolean {
    if (!(other instanceof BooleanExpression)) {
      return false
    }
    if (this.args.length !== other.args.length) {
      return false
    }
    return this.args.every((arg, i) => arg.equals(other.args[i]))
  }
}

export default BooleanExpression
