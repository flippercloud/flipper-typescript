import type { EvaluationContext, ExpressionLike } from './types'
import { buildExpression } from './build'

/**
 * Returns the current Unix timestamp in seconds.
 *
 * @example
 * const expr = Expression.build({ Now: [] })
 * expr.evaluate({ properties: {} }) // => 1699459200
 */
class Now {
  readonly name = 'Now'
  private args: ExpressionLike[]

  constructor(...args: unknown[]) {
    this.args = args.map(arg => buildExpression(arg))
  }

  evaluate(_context: EvaluationContext): number {
    return Math.floor(Date.now() / 1000)
  }

  value(): unknown {
    return { [this.name]: this.args.map(arg => arg.value()) }
  }

  equals(other: unknown): boolean {
    return other instanceof Now
  }
}

export default Now
