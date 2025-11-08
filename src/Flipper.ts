import Dsl from './Dsl'

/**
 * Main entry point for Flipper feature flag management.
 *
 * Flipper is the primary class for managing feature flags. It extends Dsl
 * to provide a simple, intuitive API for enabling/disabling features and
 * checking their state.
 *
 * @example
 * ```typescript
 * const adapter = new MemoryAdapter();
 * const flipper = new Flipper(adapter);
 *
 * // Enable a feature for everyone
 * flipper.enable('new-ui');
 *
 * // Check if feature is enabled
 * if (flipper.isFeatureEnabled('new-ui')) {
 *   // Show new UI
 * }
 *
 * // Enable for specific actor
 * flipper.enableActor('beta-features', { flipperId: 'user-123' });
 *
 * // Enable for percentage of users
 * flipper.enablePercentageOfActors('gradual-rollout', 25);
 * ```
 */
class Flipper extends Dsl {
  /**
   * Get the names of all registered groups.
   * @returns Array of group names
   *
   * @example
   * ```typescript
   * flipper.register('admins', (actor) => actor.isAdmin);
   * flipper.register('beta-users', (actor) => actor.betaTester);
   * flipper.groupNames(); // ['admins', 'beta-users']
   * ```
   */
  public groupNames(): string[] {
    return Object.keys(this.groups)
  }

  /**
   * Check if a group exists by name.
   * @param groupName - The name of the group to check
   * @returns True if the group is registered
   *
   * @example
   * ```typescript
   * flipper.register('admins', (actor) => actor.isAdmin);
   * flipper.groupExists('admins'); // true
   * flipper.groupExists('unknown'); // false
   * ```
   */
  public groupExists(groupName: string): boolean {
    return groupName in this.groups
  }

  /**
   * Clear all registered groups.
   * @returns void
   *
   * @example
   * ```typescript
   * flipper.register('admins', (actor) => actor.isAdmin);
   * flipper.groupNames(); // ['admins']
   * flipper.unregisterGroups();
   * flipper.groupNames(); // []
   * ```
   */
  public unregisterGroups(): void {
    this.groups = {}
  }
}

export default Flipper
