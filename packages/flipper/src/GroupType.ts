import ActorType from './ActorType'
import FeatureCheckContext from './FeatureCheckContext'
import { GroupCallback, IType } from './interfaces'

/**
 * Type wrapper for groups in feature flag operations.
 *
 * Groups represent named sets of actors determined by a callback function.
 * The callback is evaluated at check time to determine group membership.
 *
 * @example
 * // Define group callback
 * const isAdmin = (actor) => actor.role === 'admin';
 * const adminGroup = new GroupType('admins', isAdmin);
 *
 * // Check membership
 * const user = { flipperId: 'user-1', role: 'admin' };
 * const actorType = ActorType.wrap(user);
 * adminGroup.isMatch(actorType, context); // true
 */
class GroupType implements IType {
  /**
   * Wrap a group name in a GroupType.
   * @param thing - A group name string or GroupType instance
   * @returns GroupType instance
   * @throws Error if the value is not a valid group
   */
  public static wrap(thing: unknown): GroupType {
    if (thing instanceof GroupType) {
      return thing
    }
    if (typeof thing === 'string') {
      return new GroupType(thing)
    }
    throw new Error('Invalid group type')
  }

  /**
   * Optional callback function to determine group membership.
   */
  public callback?: GroupCallback

  /**
   * The group name.
   */
  public value: string

  /**
   * Creates a new GroupType.
   * @param value - The group name
   * @param callback - Optional callback to determine membership
   */
  constructor(value: string, callback?: GroupCallback) {
    this.value = value
    this.callback = callback
  }

  /**
   * Check if an actor matches this group.
   * @param actorType - The actor to check
   * @param _context - The feature check context (unused)
   * @returns True if the actor belongs to this group
   */
  public isMatch(actorType: ActorType, _context: FeatureCheckContext): boolean {
    if (!this.callback) {
      return false
    }
    return Boolean(this.callback(actorType.thing))
  }
}

export default GroupType
