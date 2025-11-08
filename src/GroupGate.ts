import ActorType from './ActorType'
import FeatureCheckContext from './FeatureCheckContext'
import GroupType from './GroupType'
import { IGate, IType } from './interfaces'

/**
 * Gate that enables features for groups of actors.
 *
 * Groups are defined by registering a callback function that determines
 * if an actor belongs to the group. This allows for dynamic, rule-based
 * feature enablement.
 *
 * @example
 * ```typescript
 * // Register groups
 * flipper.register('admins', (actor) => actor.role === 'admin');
 * flipper.register('beta_users', (actor) => actor.betaOptIn === true);
 *
 * // Enable feature for group
 * flipper.enableGroup('admin-panel', 'admins');
 *
 * // Check if enabled for actor
 * const admin = { flipperId: '1', role: 'admin' };
 * flipper.isFeatureEnabled('admin-panel', admin); // true
 *
 * const user = { flipperId: '2', role: 'user' };
 * flipper.isFeatureEnabled('admin-panel', user); // false
 * ```
 */
class GroupGate implements IGate {
  /**
   * The name of this gate type.
   */
  public name: string

  /**
   * The storage key for this gate's values.
   */
  public key: string

  /**
   * The data type used for storage (set of group names).
   */
  public dataType: string

  /**
   * Registry of all registered groups.
   */
  private groups: Record<string, GroupType>

  /**
   * Creates a new GroupGate.
   * @param groups - Registry of registered groups
   */
  constructor(groups: Record<string, GroupType>) {
    this.name = 'group'
    this.key = 'groups'
    this.dataType = 'set'
    this.groups = groups
  }

  /**
   * Check if the gate has any groups enabled.
   * @param value - The gate value (Set or Array of group names)
   * @returns True if any groups are enabled
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
   * Check if the gate is open for a specific actor based on group membership.
   * @param context - The feature check context containing the actor
   * @returns True if the actor belongs to any enabled group
   */
  public isOpen(context: FeatureCheckContext): boolean {
    if (context.thing === 'undefined') { return false }

    const groupNames = Array.from(context.groupsValue)
    let groupMatch = false

    groupNames.some((groupName) => {
      const groupType = this.groups[groupName]

      if (groupType && context.thing instanceof ActorType) {
        groupMatch = groupType.isMatch(context.thing, context)
      }

      return groupMatch
    })

    return groupMatch
  }

  /**
   * Check if this gate can handle the given value type.
   * @param thing - The value to check
   * @returns True if the value is a GroupType or string
   */
  public protectsThing(thing: unknown): boolean {
    if (thing instanceof GroupType) { return true }
    if (typeof(thing) === 'string') { return true }
    return false
  }

  /**
   * Wrap a value in a GroupType.
   * @param thing - The group name or GroupType to wrap
   * @returns GroupType instance
   */
  public wrap(thing: unknown): IType {
    return GroupType.wrap(thing)
  }
}

export default GroupGate
