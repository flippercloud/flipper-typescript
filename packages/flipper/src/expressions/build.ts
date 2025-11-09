import type { ExpressionLike } from './types'
import Constant from './Constant'

// Expression class registry
let registry: Record<string, new (...args: unknown[]) => ExpressionLike> = {}

/**
 * Sets the expression registry.
 * Called by expressions/index.ts after all expressions are loaded.
 * @internal
 */
export function setRegistry(reg: Record<string, new (...args: unknown[]) => ExpressionLike>): void {
  registry = reg
}

/**
 * Builds an expression from an object representation.
 *
 * @param object - Expression object, primitive value, or nested structure
 * @returns Expression instance
 * @throws {Error} If object cannot be converted to an expression
 * @example
 * // From object
 * const expr1 = buildExpression({ Property: 'admin' });
 *
 * // From primitive (creates Constant)
 * const expr2 = buildExpression('hello');
 * const expr3 = buildExpression(42);
 */
export function buildExpression(object: unknown): ExpressionLike {
  // Return existing expression or constant as-is
  if (object && typeof object === 'object' && 'evaluate' in object && 'value' in object && 'equals' in object) {
    return object as ExpressionLike
  }

  // Handle object notation { FunctionName: [args] }
  if (typeof object === 'object' && object !== null && !Array.isArray(object)) {
    const keys = Object.keys(object)
    if (keys.length === 0) {
      throw new Error('Cannot build expression from empty object')
    }

    const name = keys[0] as string
    if (!name) {
      throw new Error('Cannot build expression from object with undefined key')
    }

    const args = (object as Record<string, unknown>)[name]

    // Get expression class from registry
    const ExpressionClass = registry[name]
    if (!ExpressionClass) {
      throw new Error(`Unknown expression type: ${name}`)
    }

    const argsArray: unknown[] = Array.isArray(args) ? args : [args]
    return new ExpressionClass(...argsArray)
  }

  // Handle primitives - convert to Constant
  if (['string', 'number', 'boolean'].includes(typeof object) || object === null) {
    return new Constant(object)
  }

  throw new Error(`${JSON.stringify(object)} cannot be converted into an expression`)
}
