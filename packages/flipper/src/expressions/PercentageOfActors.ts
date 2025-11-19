import { crc32 } from 'crc'
import { buildExpression } from './build'
import type { EvaluationContext, ExpressionLike } from './types'

/**
 * Consistent percentage rollout based on actor ID.
 * The same actor ID will always get the same result.
 *
 * @example
 * const expr = Expression.build({
 *   PercentageOfActors: [{ Property: 'flipper_id' }, 25]
 * });
 * // Returns true for 25% of actors consistently
 */
class PercentageOfActors {
  readonly name = 'PercentageOfActors'
  private args: ExpressionLike[]
  private static readonly SCALING_FACTOR = 1000

  constructor(...args: unknown[]) {
    this.args = args.map(arg => buildExpression(arg))
  }

  evaluate(context: EvaluationContext): boolean {
    const textValue = this.args[0]?.evaluate(context) ?? ''
    const text =
      typeof textValue === 'string' || typeof textValue === 'number' ? String(textValue) : ''
    const percentage = Number(this.args[1]?.evaluate(context) ?? 0)

    if (!text || percentage === 0) {
      return false
    }

    // Prefix with feature name for consistency with Ruby implementation
    const prefix = context.feature_name ?? ''
    const hash = crc32(prefix + text)
    const scaledPercentage = percentage * PercentageOfActors.SCALING_FACTOR
    const scaledThreshold = 100 * PercentageOfActors.SCALING_FACTOR

    return hash % scaledThreshold < scaledPercentage
  }

  value(): unknown {
    return { [this.name]: this.args.map(arg => arg.value()) }
  }

  equals(other: unknown): boolean {
    if (!(other instanceof PercentageOfActors)) {
      return false
    }
    if (this.args.length !== other.args.length) {
      return false
    }
    return this.args.every((arg, i) => arg.equals(other.args[i]))
  }
}

export default PercentageOfActors
