import { crc32 } from 'crc'
import ActorType from './ActorType'
import FeatureCheckContext from './FeatureCheckContext'
import { IActor, IGate, IType } from './interfaces'
import PercentageOfActorsType from './PercentageOfActorsType'

function instanceOfActor(thing: unknown): thing is IActor {
  return typeof thing === 'object' && thing !== null && 'flipperId' in thing
}

/**
 * Gate that enables features for a percentage of actors (deterministic).
 *
 * Uses CRC32 hashing of the feature name + actor ID to deterministically
 * decide if an actor is in the enabled percentage. The same actor will
 * always get the same result for a given feature and percentage.
 *
 * @example
 * const feature = flipper.feature('gradual-rollout')
 *
 * // Enable for 25% of users
 * await feature.enablePercentageOfActors(25)
 *
 * // Check for specific users (deterministic)
 * await feature.isEnabled({ flipperId: 'user-1' }) // May be true or false
 * await feature.isEnabled({ flipperId: 'user-1' }) // Same result every time
 *
 * // Increase rollout to 50%
 * await feature.enablePercentageOfActors(50)
 * // Users who were in 25% are still enabled, plus additional users
 */
class PercentageOfActorsGate implements IGate {
  /**
   * The name of this gate type.
   */
  public name: string

  /**
   * The storage key for this gate's value.
   */
  public key: string

  /**
   * The data type used for storage (number 0-100).
   */
  public dataType: string

  constructor() {
    this.name = 'percentageOfActors'
    this.key = 'percentageOfActors'
    this.dataType = 'number'
  }

  /**
   * Check if the gate is enabled (percentage > 0).
   * @param value - The gate value (percentage 0-100)
   * @returns True if percentage is greater than 0
   */
  public isEnabled(value: unknown): boolean {
    return typeof value === 'number' && value > 0
  }

  /**
   * Check if the gate is open for a specific actor using deterministic hashing.
   * @param context - The feature check context containing the actor
   * @returns True if the actor's hash falls within the enabled percentage
   */
  public isOpen(context: FeatureCheckContext): boolean {
    let usable = false
    if (typeof context.thing === 'undefined') {
      return false
    }
    if (!usable && context.thing instanceof ActorType) {
      usable = true
    }
    if (!usable && instanceOfActor(context.thing)) {
      usable = true
    }
    if (!usable) {
      return false
    }

    const actorType = ActorType.wrap(context.thing)
    const percentage = context.percentageOfActorsValue

    // Ruby parity:
    // - hash input is feature_name + sorted_join(actor_ids)
    // - supports up to 3 decimal places via scaling factor
    const scalingFactor = 1000
    const id = `${context.featureName}${[actorType.value].sort().join('')}`
    const hash = crc32(id).valueOf()

    return hash % (100 * scalingFactor) < percentage * scalingFactor
  }

  /**
   * Check if this gate can handle the given value type.
   * @param thing - The value to check
   * @returns True if the value is a PercentageOfActorsType
   */
  public protectsThing(thing: unknown): boolean {
    if (thing instanceof PercentageOfActorsType) {
      return true
    }
    return false
  }

  /**
   * Wrap a value in a PercentageOfActorsType.
   * @param thing - The percentage value to wrap
   * @returns PercentageOfActorsType instance
   */
  public wrap(thing: unknown): IType {
    return PercentageOfActorsType.wrap(thing)
  }
}

export default PercentageOfActorsGate
