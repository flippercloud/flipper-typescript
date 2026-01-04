import ActorType from './ActorType'
import FeatureCheckContext from './FeatureCheckContext'
import { IGate, IType } from './interfaces'

/**
 * Gate that enables features for specific actors (users, accounts, etc.).
 *
 * The actor gate stores a set of actor IDs that have the feature enabled.
 * Actors must have a `flipperId` property that uniquely identifies them.
 *
 * @example
 * const feature = flipper.feature('beta-features')
 *
 * // Enable for specific user
 * await feature.enableActor({ flipperId: 'user-123' })
 *
 * // Check if enabled for user
 * await feature.isEnabled({ flipperId: 'user-123' }) // true
 * await feature.isEnabled({ flipperId: 'user-456' }) // false
 */
class ActorGate implements IGate {
  /**
   * The name of this gate type.
   */
  public name: string

  /**
   * The storage key for this gate's values.
   */
  public key: string

  /**
   * The data type used for storage (set of actor IDs).
   */
  public dataType: string

  constructor() {
    this.name = 'actor'
    this.key = 'actors'
    this.dataType = 'set'
  }

  /**
   * Check if the gate has any actors enabled.
   * @param value - The gate value (Set or Array of actor IDs)
   * @returns True if any actors are enabled
   */
  public isEnabled(value: unknown): boolean {
    if (!value) return false
    if (value instanceof Set) {
      return value.size > 0
    }
    if (Array.isArray(value)) {
      return value.length > 0
    }
    return false
  }

  /**
   * Check if the gate is open for a specific actor.
   * @param context - The feature check context containing the actor
   * @returns True if the actor is in the enabled set
   */
  public isOpen(context: FeatureCheckContext): boolean {
    if (!this.protectsThing(context.thing)) {
      return false
    }

    const enabledActors = context.actorsValue
    const actorId = context.thing instanceof ActorType ? context.thing.value : (context.thing as any).flipperId

    // Actor ids must be present and string-like (Ruby parity: a missing flipper_id
    // is treated as no actor).
    if (typeof actorId !== 'string' || actorId.length === 0) {
      return false
    }

    return enabledActors.has(actorId)
  }

  /**
   * Check if this gate can handle the given value type.
   * @param thing - The value to check
   * @returns True if the value is an ActorType or has a flipperId property
   */
  public protectsThing(thing: unknown): boolean {
    if (thing instanceof ActorType) {
      return true
    }
    if (typeof thing === 'object' && thing !== null && 'flipperId' in thing) {
      return true
    }
    return false
  }

  /**
   * Wrap a value in an ActorType.
   * @param thing - The actor or ActorType to wrap
   * @returns ActorType instance
   */
  public wrap(thing: unknown): IType {
    return ActorType.wrap(thing)
  }
}

export default ActorGate
