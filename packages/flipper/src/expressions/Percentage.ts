import type { EvaluationContext, ExpressionLike } from './types'
import { buildExpression } from './build'

/**
 * Checks if a value is less than a percentage.
 *
 * @example
 * const expr = Expression.build({
 *   Percentage: [45, 50]
 * });
 * expr.evaluate({ properties: {} }); // => true (45 < 50)
 */
class Percentage {
  readonly name = 'Percentage'
  private args: ExpressionLike[]

  constructor(...args: unknown[]) {
    this.args = args.map(arg => buildExpression(arg))
  }

  evaluate(context: EvaluationContext): boolean {
    const value = Number(this.args[0]?.evaluate(context) ?? 0)
    const percentage = Number(this.args[1]?.evaluate(context) ?? 0)
    return value < percentage
  }

  value(): unknown {
    return { [this.name]: this.args.map(arg => arg.value()) }
  }

  equals(other: unknown): boolean {
    if (!(other instanceof Percentage)) {
      return false
    }
    if (this.args.length !== other.args.length) {
      return false
    }
    return this.args.every((arg, i) => arg.equals(other.args[i]))
  }
}

export default Percentage
