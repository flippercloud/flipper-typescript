/**
 * Expression system for Flipper.
 *
 * This module provides all expression types and the build function
 * for creating expressions from object notation.
 */

import { setRegistry, buildExpression } from './build'
import type { ExpressionLike, EvaluationContext } from './types'

// Import all expression types
import All from './All'
import Any from './Any'
import BooleanExpression from './Boolean'
import Comparable from './Comparable'
import Constant from './Constant'
import Duration from './Duration'
import Equal from './Equal'
import GreaterThan from './GreaterThan'
import GreaterThanOrEqualTo from './GreaterThanOrEqualTo'
import LessThan from './LessThan'
import LessThanOrEqualTo from './LessThanOrEqualTo'
import NotEqual from './NotEqual'
import Now from './Now'
import NumberExpression from './Number'
import Percentage from './Percentage'
import PercentageOfActors from './PercentageOfActors'
import Property from './Property'
import Random from './Random'
import StringExpression from './String'
import Time from './Time'

// Create expression registry
const expressions = {
  All,
  Any,
  Boolean: BooleanExpression,
  Constant,
  Duration,
  Equal,
  GreaterThan,
  GreaterThanOrEqualTo,
  LessThan,
  LessThanOrEqualTo,
  NotEqual,
  Now,
  Number: NumberExpression,
  Percentage,
  PercentageOfActors,
  Property,
  Random,
  String: StringExpression,
  Time
}

// Register expressions with the build function
setRegistry(expressions)

// Export everything
export {
  // Types
  type EvaluationContext,
  type ExpressionLike,

  // Build function
  buildExpression,

  // Expression classes
  All,
  Any,
  BooleanExpression,
  Comparable,
  Constant,
  Duration,
  Equal,
  GreaterThan,
  GreaterThanOrEqualTo,
  LessThan,
  LessThanOrEqualTo,
  NotEqual,
  Now,
  NumberExpression,
  Percentage,
  PercentageOfActors,
  Property,
  Random,
  StringExpression,
  Time,

  // Registry for advanced usage
  expressions
}

// Default export for convenience
export default {
  build: buildExpression,
  expressions
}
