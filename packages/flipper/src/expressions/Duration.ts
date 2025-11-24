import type { EvaluationContext, ExpressionLike } from './types'
import { buildExpression } from './build'

/**
 * Converts a duration into seconds.
 *
 * @example
 * const expr = Expression.build({ Duration: [5, 'minutes'] })
 * expr.evaluate({ properties: {} }) // => 300
 */
class Duration {
  readonly name = 'Duration'
  private args: ExpressionLike[]

  private static readonly SECONDS_PER: Record<string, number> = {
    second: 1,
    minute: 60,
    hour: 3600,
    day: 86400,
    week: 604800,
    month: 2629746, // 1/12 of a gregorian year
    year: 31556952, // length of a gregorian year (365.2425 days)
  }

  constructor(...args: unknown[]) {
    this.args = args.map(arg => buildExpression(arg))
  }

  evaluate(context: EvaluationContext): number {
    const scalar = Number(this.args[0]?.evaluate(context) ?? 0)
    const unitValue = this.args[1]?.evaluate(context) ?? 'second'
    let unit = (
      typeof unitValue === 'string' || typeof unitValue === 'number' ? String(unitValue) : 'second'
    ).toLowerCase()

    // Remove trailing 's' if present
    if (unit.endsWith('s')) {
      unit = unit.slice(0, -1)
    }

    const secondsPerUnit = Duration.SECONDS_PER[unit]
    if (!secondsPerUnit) {
      throw new Error(
        `Duration unit ${unit} must be one of: ${Object.keys(Duration.SECONDS_PER).join(', ')}`
      )
    }

    if (typeof scalar !== 'number' || Number.isNaN(scalar)) {
      throw new Error(`Duration value must be a number but was ${scalar}`)
    }

    return scalar * secondsPerUnit
  }

  value(): unknown {
    return { [this.name]: this.args.map(arg => arg.value()) }
  }

  equals(other: unknown): boolean {
    if (!(other instanceof Duration)) {
      return false
    }
    if (this.args.length !== other.args.length) {
      return false
    }
    return this.args.every((arg, i) => arg.equals(other.args[i]))
  }
}

export default Duration
