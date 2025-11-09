import Typecast from './Typecast'

/**
 * Container for all gate values of a feature.
 *
 * Encapsulates the state of all gates (boolean, actors, groups, percentages, expression)
 * for a single feature. Values are type-cast to their expected types for
 * consistent access.
 *
 * @example
 * const rawValues = {
 *   boolean: true,
 *   actors: ['user-1', 'user-2'],
 *   groups: ['admins'],
 *   percentageOfActors: 25,
 *   percentageOfTime: 10,
 *   expression: { Property: 'admin' }
 * };
 *
 * const gateValues = new GateValues(rawValues);
 * console.log(gateValues.boolean); // true
 * console.log(gateValues.actors); // Set(['user-1', 'user-2'])
 * console.log(gateValues.expression); // { Property: 'admin' }
 */
class GateValues {
  /**
   * Boolean gate value (true = enabled for all).
   */
  public boolean: boolean

  /**
   * Set of actor IDs that have this feature enabled.
   */
  public actors: Set<string>

  /**
   * Set of group names that have this feature enabled.
   */
  public groups: Set<string>

  /**
   * Percentage of actors that have this feature enabled (0-100).
   */
  public percentageOfActors: number

  /**
   * Percentage of time this feature is enabled (0-100).
   */
  public percentageOfTime: number

  /**
   * Expression gate value (object representation of expression).
   */
  public expression: Record<string, unknown> | null

  /**
   * Creates a new GateValues instance.
   * @param values - Raw gate values from adapter (will be type-cast)
   */
  constructor(values: Record<string, unknown>) {
    this.boolean = Typecast.toBoolean(values.boolean)
    this.actors = Typecast.toSet(values.actors)
    this.groups = Typecast.toSet(values.groups)
    this.percentageOfActors = Typecast.toNumber(values.percentageOfActors)
    this.percentageOfTime = Typecast.toNumber(values.percentageOfTime)
    this.expression = values.expression && typeof values.expression === 'object' && !Array.isArray(values.expression)
      ? values.expression as Record<string, unknown>
      : null
  }
}

export default GateValues
