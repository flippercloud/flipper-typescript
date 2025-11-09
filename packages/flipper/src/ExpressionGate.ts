import { buildExpression } from './expressions'
import ExpressionType from './ExpressionType'
import FeatureCheckContext from './FeatureCheckContext'
import { IGate, IType } from './interfaces'

/**
 * Gate that enables features based on expression evaluation.
 *
 * Expressions provide complex conditional logic using actor properties.
 * Actors must have a `flipperProperties` property containing the properties
 * to be evaluated.
 *
 * @example
 * const feature = flipper.feature('beta-features');
 *
 * // Enable for admins
 * await feature.enableExpression({ Property: 'admin' });
 *
 * // Enable for enterprise plans OR admins
 * await feature.enableExpression({
 *   Any: [
 *     { Property: 'admin' },
 *     { Equal: [{ Property: 'plan' }, 'enterprise'] }
 *   ]
 * });
 *
 * // Check if enabled
 * const user = {
 *   flipperId: 'user-123',
 *   flipperProperties: { admin: false, plan: 'enterprise' }
 * };
 * await feature.isEnabled(user); // true
 */
class ExpressionGate implements IGate {
  /**
   * The name of this gate type.
   */
  public name: string

  /**
   * The storage key for this gate's value.
   */
  public key: string

  /**
   * The data type used for storage.
   */
  public dataType: string

  constructor() {
    this.name = 'expression'
    this.key = 'expression'
    this.dataType = 'json'
  }

  /**
   * Check if the gate is enabled.
   * @param value - The gate value (expression object)
   * @returns True if value is a non-empty object
   */
  public isEnabled(value: unknown): boolean {
    return (
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).length > 0
    )
  }

  /**
   * Check if the gate is open for the given context.
   * @param context - The feature check context
   * @returns True if expression evaluates to truthy
   */
  public isOpen(context: FeatureCheckContext): boolean {
    const expressionValue = context.values.expression
    if (!expressionValue || typeof expressionValue !== 'object') {
      return false
    }

    try {
      const expression = buildExpression(expressionValue)

      // If we have an actor, evaluate with their properties
      if (context.thing && typeof context.thing === 'object' && 'flipperProperties' in context.thing) {
        const actor = context.thing as { flipperProperties?: Record<string, unknown> }
        const properties = actor.flipperProperties ?? {}

        return Boolean(expression.evaluate({
          feature_name: context.featureName,
          properties
        }))
      }

      // No actor - evaluate constant expressions
      return Boolean(expression.evaluate({
        feature_name: context.featureName,
        properties: {}
      }))
    } catch {
      // TODO: Check strict configuration
      // For now, return false on error (lenient mode)
      return false
    }
  }

  /**
   * Check if this gate can handle the given value type.
   * @param thing - The value to check
   * @returns True if the value is an expression object or has flipperProperties
   */
  public protectsThing(thing: unknown): boolean {
    // Check if it's an ExpressionType instance
    if (thing instanceof ExpressionType) {
      return true
    }

    // Can protect expression objects
    if (thing && typeof thing === 'object' && !Array.isArray(thing)) {
      // Check if it's an expression object
      const keys = Object.keys(thing)
      if (keys.length > 0 && 'evaluate' in thing && 'value' in thing) {
        return true
      }
    }

    return false
  }

  /**
   * Wrap a value as an ExpressionType.
   * @param thing - The value to wrap (expression object or ExpressionLike)
   * @returns ExpressionType instance
   */
  public wrap(thing: unknown): IType {
    return ExpressionType.wrap(thing)
  }
}

export default ExpressionGate
