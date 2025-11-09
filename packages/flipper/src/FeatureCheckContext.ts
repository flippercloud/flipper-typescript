import GateValues from './GateValues'

/**
 * Context for checking if a feature is enabled.
 *
 * Contains all information needed by gates to determine if a feature
 * should be enabled: the feature name, current gate values, and the
 * actor/thing being checked.
 *
 * @example
 * ```typescript
 * const values = new GateValues(rawValues);
 * const actor = { flipperId: 'user-123' };
 * const context = new FeatureCheckContext('new-ui', values, actor);
 *
 * // Gates use context to make decisions
 * if (actorGate.isOpen(context)) {
 *   // Feature is enabled for this actor
 * }
 * ```
 */
class FeatureCheckContext {
  /**
   * The name of the feature being checked.
   */
  public featureName: string

  /**
   * All gate values for the feature.
   */
  public values: GateValues

  /**
   * The actor or thing being checked (optional).
   */
  public thing: unknown

  /**
   * Creates a new FeatureCheckContext.
   * @param featureName - The feature name
   * @param values - Gate values for the feature
   * @param thing - The actor or thing being checked
   */
  constructor(featureName: string, values: GateValues, thing: unknown) {
    this.featureName = featureName
    this.values = values
    this.thing = thing
  }

  /**
   * Get the boolean gate value.
   * @returns True if boolean gate is enabled
   */
  get booleanValue(): boolean {
    return this.values.boolean
  }

  /**
   * Get the actors gate value.
   * @returns Set of enabled actor IDs
   */
  get actorsValue(): Set<string> {
    return this.values.actors
  }

  /**
   * Get the groups gate value.
   * @returns Set of enabled group names
   */
  get groupsValue(): Set<string> {
    return this.values.groups
  }

  /**
   * Get the percentage of actors gate value.
   * @returns Percentage (0-100)
   */
  get percentageOfActorsValue(): number {
    return this.values.percentageOfActors
  }

  /**
   * Get the percentage of time gate value.
   * @returns Percentage (0-100)
   */
  get percentageOfTimeValue(): number {
    return this.values.percentageOfTime
  }

  /**
   * Get the expression gate value.
   * @returns Expression object or null
   */
  get expressionValue(): Record<string, unknown> | null {
    return this.values.expression
  }
}

export default FeatureCheckContext
