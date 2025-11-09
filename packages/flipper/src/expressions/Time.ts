import type { EvaluationContext, ExpressionLike } from './types'
import { buildExpression } from './build'

/**
 * Parses a time string into a Unix timestamp.
 *
 * @example
 * const expr = Expression.build({ Time: '2024-01-01T00:00:00Z' });
 * expr.evaluate({ properties: {} }); // => 1704067200
 */
class Time {
  readonly name = 'Time'
  private args: ExpressionLike[]

  constructor(...args: unknown[]) {
    this.args = args.map(arg => buildExpression(arg))
  }

  evaluate(context: EvaluationContext): number {
    const timeValue = this.args[0]?.evaluate(context) ?? ''

    // If timeValue is a number, use it directly (as milliseconds)
    if (typeof timeValue === 'number') {
      return Math.floor(timeValue / 1000)
    }

    const timeString = typeof timeValue === 'string' ? timeValue : ''

    // Try to parse as number first (for numeric strings like '1704067200000')
    const numValue = Number(timeString)
    if (!Number.isNaN(numValue) && /^\d+$/.test(timeString)) {
      // It's a numeric timestamp string - use as milliseconds
      return Math.floor(numValue / 1000)
    }

    // Otherwise parse as date string
    const date = new Date(timeString)
    return Math.floor(date.getTime() / 1000)
  }

  value(): unknown {
    return { [this.name]: this.args[0]?.value() }
  }

  equals(other: unknown): boolean {
    if (!(other instanceof Time)) {
      return false
    }
    if (this.args.length !== other.args.length) {
      return false
    }
    return this.args.every((arg, i) => arg.equals(other.args[i]))
  }
}

export default Time
