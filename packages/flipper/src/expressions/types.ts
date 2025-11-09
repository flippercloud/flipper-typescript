/**
 * Evaluation context passed to expression evaluate methods.
 */
export interface EvaluationContext {
  /** The name of the feature being evaluated (for percentage rollouts) */
  feature_name?: string
  /** Actor properties from flipper_properties */
  properties: Record<string, unknown>
}

/**
 * Common interface for all expression types (Expression and Constant).
 */
export interface ExpressionLike {
  /** Evaluates the expression with given context */
  evaluate(context: EvaluationContext): unknown
  /** Converts to serializable representation */
  value(): unknown
  /** Checks equality with another expression */
  equals(other: unknown): boolean
}
