import type { EvaluationContext, ExpressionLike } from './types'
import { buildExpression } from './build'

/**
 * Converts argument to number.
 *
 * @example
 * const expr = Expression.build({ Number: '42' });
 * expr.evaluate({ properties: {} }); // => 42
 */
class NumberExpression {
  readonly name = 'Number'
  private args: ExpressionLike[]

  constructor(...args: unknown[]) {
    this.args = args.map(arg => buildExpression(arg))
  }

  evaluate(context: EvaluationContext): number {
    const value = this.args[0]?.evaluate(context)
    const num = Number(value)
    return Number.isNaN(num) ? 0 : num
  }

  value(): unknown {
    return { [this.name]: this.args[0]?.value() }
  }

  equals(other: unknown): boolean {
    if (!(other instanceof NumberExpression)) {
      return false
    }
    if (this.args.length !== other.args.length) {
      return false
    }
    return this.args.every((arg, i) => arg.equals(other.args[i]))
  }
}

export default NumberExpression
