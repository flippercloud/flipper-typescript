import type Feature from '../Feature'
import type { IGate, IType } from '../interfaces'
import ActorGate from '../ActorGate'
import Wrapper from './Wrapper'

/**
 * Error thrown when actor limit is exceeded.
 */
export class ActorLimitExceededError extends Error {
  /**
   * Creates a new ActorLimitExceededError.
   * @param featureName - The name of the feature
   * @param limit - The configured limit
   */
  constructor(featureName: string, limit: number) {
    super(
      `Actor limit of ${limit} exceeded for feature ${featureName}. See https://www.flippercloud.io/docs/features/actors#limitations`
    )
    this.name = 'ActorLimitExceededError'
  }
}

/**
 * Adapter wrapper that limits the number of individual actors per feature.
 *
 * This wrapper prevents performance issues from enabling a feature for too many
 * individual actors. When the limit is reached, attempting to enable another actor
 * will throw an error.
 *
 * This only applies to the actor gate - other gates (boolean, groups, percentages)
 * are not affected by this limit.
 *
 * @example
 * const adapter = new ActorLimit(new MemoryAdapter(), 100);
 *
 * // Enable for up to 100 actors
 * for (let i = 0; i < 100; i++) {
 *   await feature.enableActor({ flipperId: `user-${i}` }); // OK
 * }
 *
 * // 101st actor throws error
 * await feature.enableActor({ flipperId: 'user-100' });
 * // => ActorLimitExceededError: Actor limit of 100 exceeded
 *
 * // Other gates still work
 * await feature.enable(); // OK - boolean gate
 * await feature.enablePercentageOfActors(25); // OK - percentage gate
 */
export default class ActorLimit extends Wrapper {
  /**
   * Maximum number of actors allowed per feature.
   */
  private limit: number

  /**
   * Creates a new ActorLimit adapter.
   * @param adapter - The adapter to wrap with actor limiting
   * @param limit - Maximum actors per feature (default: 100)
   */
  constructor(adapter: IAdapter, limit: number = 100) {
    super(adapter)
    this.limit = limit
  }

  /**
   * Enable a gate for a feature, checking actor limit first.
   * @param feature - Feature to enable gate for
   * @param gate - Gate to enable
   * @param thing - Value to enable for the gate
   * @returns True if gate was enabled successfully
   * @throws {ActorLimitExceededError} If enabling an actor would exceed the limit
   */
  override async enable(feature: Feature, gate: IGate, thing: IType): Promise<boolean> {
    if (gate instanceof ActorGate && (await this.isOverLimit(feature))) {
      throw new ActorLimitExceededError(feature.name, this.limit)
    }
    return await super.enable(feature, gate, thing)
  }

  /**
   * Check if a feature has reached the actor limit.
   * @param feature - Feature to check
   * @returns True if the feature has reached the limit
   */
  private async isOverLimit(feature: Feature): Promise<boolean> {
    const actorsValue = await feature.actorsValue()
    return actorsValue.size >= this.limit
  }
}

// Fix import
import type { IAdapter } from '../interfaces'
