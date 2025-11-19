import { IActor, IType } from './interfaces'

/**
 * Type wrapper for actors (users, accounts, etc.) in feature flag checks.
 *
 * Actors must have a `flipperId` property that uniquely identifies them.
 * This type is used by ActorGate to determine feature enablement.
 *
 * @example
 * const user = { flipperId: 'user-123', name: 'Alice' };
 * const actorType = ActorType.wrap(user);
 *
 * console.log(actorType.value); // 'user-123'
 */
class ActorType implements IType {
  /**
   * Wrap an actor object in an ActorType.
   * @param thing - An actor object with flipperId or an ActorType instance
   * @returns ActorType instance
   * @throws Error if the value is not a valid actor
   */
  public static wrap(thing: unknown): ActorType {
    if (thing instanceof ActorType) {
      return thing
    }
    if (typeof thing === 'object' && thing !== null && 'flipperId' in thing) {
      return new ActorType(thing as IActor)
    }
    throw new Error('Invalid actor type')
  }

  /**
   * The original actor object.
   */
  public thing: IActor

  /**
   * The unique identifier for this actor (extracted from flipperId).
   */
  public value: string

  /**
   * Creates a new ActorType.
   * @param thing - The actor object with flipperId
   */
  constructor(thing: IActor) {
    this.thing = thing
    this.value = thing.flipperId
  }
}

export default ActorType
