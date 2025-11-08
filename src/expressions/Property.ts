import type { EvaluationContext, ExpressionLike } from './types'
import { buildExpression } from './build'

/**
 * Accesses a property from the actor's flipper_properties.
 *
 * @example
 * const expr = Expression.build({ Property: 'plan' });
 * expr.evaluate({
 *   properties: { plan: 'enterprise' }
 * }); // => 'enterprise'
 */
class Property {
  readonly name = 'Property'
  private args: ExpressionLike[]

  constructor(...args: unknown[]) {
    this.args = args.map(arg => buildExpression(arg))
  }

  evaluate(context: EvaluationContext): unknown {
    const keyValue = this.args[0]?.evaluate(context) ?? ''
    const key = typeof keyValue === 'string' || typeof keyValue === 'number' ? String(keyValue) : ''
    return context.properties[key]
  }

  value(): unknown {
    // Property takes a single argument (the property name)
    return { [this.name]: this.args[0]?.value() }
  }

  equals(other: unknown): boolean {
    if (!(other instanceof Property)) {
      return false
    }
    if (this.args.length !== other.args.length) {
      return false
    }
    return this.args.every((arg, i) => arg.equals(other.args[i]))
  }
}

export default Property
