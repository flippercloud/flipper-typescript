import type { EvaluationContext, ExpressionLike } from './types'
import { buildExpression } from './build'

/**
 * Base class for comparison expressions.
 * Compares two values using a specific operator.
 */
abstract class Comparable {
  readonly name: string
  protected args: ExpressionLike[]

  /**
   * The comparison operator to use.
   * Subclasses must override this.
   */
  protected abstract operator: string

  constructor(expressionName: string, ...args: unknown[]) {
    this.name = expressionName
    this.args = args.map(arg => buildExpression(arg))
  }

  evaluate(context: EvaluationContext): boolean {
    const left = this.args[0]?.evaluate(context)
    const right = this.args[1]?.evaluate(context)

    // Handle null/undefined
    if (left === null || left === undefined || right === null || right === undefined) {
      return false
    }

    // Perform comparison based on operator
    switch (this.operator) {
      case '==':
        return left === right
      case '!=':
        return left !== right
      case '>':
        return typeof left === 'number' && typeof right === 'number' && left > right
      case '>=':
        return typeof left === 'number' && typeof right === 'number' && left >= right
      case '<':
        return typeof left === 'number' && typeof right === 'number' && left < right
      case '<=':
        return typeof left === 'number' && typeof right === 'number' && left <= right
      default:
        return false
    }
  }

  value(): unknown {
    return { [this.name]: this.args.map(arg => arg.value()) }
  }

  equals(other: unknown): boolean {
    if (!(other instanceof Comparable) || other.name !== this.name) {
      return false
    }
    if (this.args.length !== other.args.length) {
      return false
    }
    return this.args.every((arg, i) => arg.equals(other.args[i]))
  }
}

export default Comparable
