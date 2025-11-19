import type { EvaluationContext, ExpressionLike } from './types'
import { buildExpression } from './build'

/**
 * Converts argument to string.
 *
 * @example
 * const expr = Expression.build({ String: 42 });
 * expr.evaluate({ properties: {} }); // => '42'
 */
class StringExpression {
  readonly name = 'String'
  private args: ExpressionLike[]

  constructor(...args: unknown[]) {
    this.args = args.map(arg => buildExpression(arg))
  }

  evaluate(context: EvaluationContext): string {
    const value = this.args[0]?.evaluate(context) ?? ''
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
      ? String(value)
      : ''
  }

  value(): unknown {
    return { [this.name]: this.args[0]?.value() }
  }

  equals(other: unknown): boolean {
    if (!(other instanceof StringExpression)) {
      return false
    }
    if (this.args.length !== other.args.length) {
      return false
    }
    return this.args.every((arg, i) => arg.equals(other.args[i]))
  }
}

export default StringExpression
