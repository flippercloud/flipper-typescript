import type { EvaluationContext, ExpressionLike } from './types'
import { buildExpression } from './build'

/**
 * Generates a random number between 0 and max (exclusive).
 *
 * @example
 * const expr = Expression.build({ Random: 100 });
 * expr.evaluate({ properties: {} }); // => 0-99
 */
class Random {
  readonly name = 'Random'
  private args: ExpressionLike[]

  constructor(...args: unknown[]) {
    this.args = args.map(arg => buildExpression(arg))
  }

  evaluate(context: EvaluationContext): number {
    const max = Number(this.args[0]?.evaluate(context) ?? 0)
    return Math.floor(Math.random() * max)
  }

  value(): unknown {
    return { [this.name]: this.args[0]?.value() }
  }

  equals(other: unknown): boolean {
    if (!(other instanceof Random)) {
      return false
    }
    if (this.args.length !== other.args.length) {
      return false
    }
    return this.args.every((arg, i) => arg.equals(other.args[i]))
  }
}

export default Random
