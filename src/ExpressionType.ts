import { IType } from './interfaces'
import { buildExpression, type ExpressionLike } from './expressions'

/**
 * Type wrapper for expressions in feature flag checks.
 *
 * Wraps expression objects for use with the ExpressionGate.
 *
 * @example
 * ```typescript
 * const expr = { Property: 'admin' };
 * const exprType = ExpressionType.wrap(expr);
 *
 * console.log(exprType.value); // JSON string of expression
 * ```
 */
class ExpressionType implements IType {
  /**
   * Wrap an expression object in an ExpressionType.
   * @param thing - An expression object or ExpressionLike instance
   * @returns ExpressionType instance
   * @throws Error if the value is not a valid expression
   */
  public static wrap(thing: unknown): ExpressionType {
    if (thing instanceof ExpressionType) { return thing }

    // Check if it's an ExpressionLike
    if (thing && typeof thing === 'object' && 'evaluate' in thing && 'value' in thing && 'equals' in thing) {
      return new ExpressionType(thing as ExpressionLike)
    }

    // Try to build from object
    if (thing && typeof thing === 'object' && !Array.isArray(thing)) {
      const expr = buildExpression(thing)
      return new ExpressionType(expr)
    }

    throw new Error('Invalid expression type')
  }

  /**
   * The original expression.
   */
  public thing: ExpressionLike

  /**
   * The serialized value for storage (JSON string).
   */
  public value: string

  /**
   * Creates a new ExpressionType.
   * @param thing - The expression
   */
  constructor(thing: ExpressionLike) {
    this.thing = thing
    // Store the expression structure (object notation)
    const val = thing.value()

    // For Constants, we need to wrap the primitive value in { Constant: value }
    // so it's recognized as an expression when stored and retrieved
    if (thing.constructor.name === 'Constant' && (
      typeof val === 'string' ||
      typeof val === 'number' ||
      typeof val === 'boolean' ||
      val === null
    )) {
      this.value = JSON.stringify({ Constant: val })
    } else {
      this.value = JSON.stringify(val)
    }
  }
}

export default ExpressionType
