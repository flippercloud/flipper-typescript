import Feature from './Feature'
import GroupType from './GroupType'
import { GroupCallback, IActor, IAdapter, IInstrumenter } from './interfaces'
import NoopInstrumenter from './instrumenters/NoopInstrumenter'

/**
 * Domain-Specific Language for feature flag operations.
 *
 * Provides a fluent API for managing feature flags, including enabling/disabling
 * features, checking state, registering groups, and preloading feature data.
 *
 * This class is the foundation of the Flipper API, extended by the Flipper class.
 *
 * @example
 * ```typescript
 * const adapter = new MemoryAdapter();
 * const dsl = new Dsl(adapter);
 *
 * // Register a group
 * dsl.register('admins', (actor) => actor.isAdmin === true);
 *
 * // Enable feature for a group
 * dsl.enableGroup('admin-panel', 'admins');
 *
 * // Check if enabled for an actor
 * const user = { flipperId: 'user-123', isAdmin: true };
 * dsl.isFeatureEnabled('admin-panel', user); // true
 *
 * // Preload features for efficiency
 * dsl.preloadAll();
 * ```
 */
class Dsl {
  /**
   * The adapter used for persisting feature flag state.
   */
  public adapter: IAdapter

  /**
   * Registry of all registered groups.
   */
  public groups: Record<string, GroupType>

  /**
   * Internal cache of Feature instances.
   */
  private memoizedFeatures: Record<string, Feature>

  /**
   * The instrumenter used for tracking operations.
   */
  public instrumenter: IInstrumenter

  /**
   * Creates a new Dsl instance.
   * @param adapter - The adapter to use for persistence
   * @param options - Optional configuration
   * @param options.instrumenter - The instrumenter to use for tracking operations
   */
  constructor(adapter: IAdapter, options: { instrumenter?: IInstrumenter } = {}) {
    this.adapter = adapter
    this.groups = {}
    this.memoizedFeatures = {}
    this.instrumenter = options.instrumenter ?? new NoopInstrumenter()
  }

  /**
   * Check if a feature is enabled for a given actor or context.
   * @param featureName - The name of the feature to check
   * @param thing - Optional actor or context to check against
   * @returns True if the feature is enabled
   */
  public isFeatureEnabled(featureName: string, thing?: unknown): boolean {
    return this.feature(featureName).isEnabled(thing)
  }

  /**
   * Fully enable a feature for everyone.
   * @param featureName - The name of the feature to enable
   * @returns True if successful
   */
  public enable(featureName: string) {
    this.feature(featureName).enable()
    return true
  }

  /**
   * Enable a feature for a specific actor.
   * @param featureName - The name of the feature
   * @param actor - The actor to enable the feature for
   * @returns True if successful
   */
  public enableActor(featureName: string, actor: IActor) {
    this.feature(featureName).enableActor(actor)
    return true
  }

  /**
   * Enable a feature for a specific group.
   * @param featureName - The name of the feature
   * @param groupName - The name of the group to enable for
   * @returns True if successful
   */
  public enableGroup(featureName: string, groupName: string) {
    this.feature(featureName).enableGroup(groupName)
    return true
  }

  /**
   * Enable a feature for a percentage of actors (deterministic based on actor ID).
   * @param featureName - The name of the feature
   * @param percentage - Percentage of actors (0-100)
   */
  public enablePercentageOfActors(featureName: string, percentage: number) {
    this.feature(featureName).enablePercentageOfActors(percentage)
  }

  /**
   * Enable a feature for a percentage of time (random).
   * @param featureName - The name of the feature
   * @param percentage - Percentage of time (0-100)
   */
  public enablePercentageOfTime(featureName: string, percentage: number) {
    this.feature(featureName).enablePercentageOfTime(percentage)
  }

  /**
   * Fully disable a feature for everyone.
   * @param featureName - The name of the feature to disable
   * @returns True if successful
   */
  public disable(featureName: string) {
    this.feature(featureName).disable()
    return true
  }

  /**
   * Disable a feature for a specific actor.
   * @param featureName - The name of the feature
   * @param actor - The actor to disable the feature for
   * @returns True if successful
   */
  public disableActor(featureName: string, actor: IActor) {
    this.feature(featureName).disableActor(actor)
    return true
  }

  /**
   * Disable a feature for a specific group.
   * @param featureName - The name of the feature
   * @param groupName - The name of the group to disable for
   * @returns True if successful
   */
  public disableGroup(featureName: string, groupName: string) {
    this.feature(featureName).disableGroup(groupName)
    return true
  }

  /**
   * Add a feature to the adapter (creates it if it doesn't exist).
   * @param featureName - The name of the feature to add
   * @returns True if successful
   */
  public add(featureName: string): boolean {
    return this.feature(featureName).add()
  }

  /**
   * Check if a feature exists in the adapter.
   * @param featureName - The name of the feature to check
   * @returns True if the feature exists
   */
  public exist(featureName: string): boolean {
    return this.feature(featureName).exist()
  }

  /**
   * Remove a feature from the adapter (deletes it completely).
   * @param featureName - The name of the feature to remove
   * @returns True if successful
   */
  public remove(featureName: string): boolean {
    return this.feature(featureName).remove()
  }

  /**
   * Get all features from the adapter.
   * @returns Array of Feature instances
   */
  public features(): Feature[] {
    const featureObjects = this.adapter.features()
    // Return memoized versions or create new ones
    return featureObjects.map(f => this.feature(f.name))
  }

  /**
   * Get or create a Feature instance for the given name.
   * Feature instances are memoized for performance.
   * @param featureName - The name of the feature
   * @returns Feature instance
   */
  public feature(featureName: string) {
    let feature = this.memoizedFeatures[featureName]

    if (feature === undefined) {
      feature = new Feature(featureName, this.adapter, this.groups, { instrumenter: this.instrumenter })
      this.memoizedFeatures[featureName] = feature
    }

    return feature
  }

  /**
   * Preload multiple features in a single adapter call for efficiency.
   * @param featureNames - Array of feature names to preload
   * @returns Array of preloaded Feature instances
   */
  public preload(featureNames: string[]): Feature[] {
    const features = featureNames.map(name => this.feature(name))
    this.adapter.getMulti(features)
    return features
  }

  /**
   * Preload all features from the adapter in a single call.
   * @returns Array of all Feature instances
   */
  public preloadAll(): Feature[] {
    const allData = this.adapter.getAll()
    const keys = Object.keys(allData)
    return keys.map(key => this.feature(key))
  }

  /**
   * Check if the adapter is read-only.
   * @returns True if adapter is read-only
   */
  public readOnly(): boolean {
    return this.adapter.readOnly()
  }

  /**
   * Register a group with a callback to determine membership.
   * @param groupName - The name of the group
   * @param callback - Function that returns true if actor is in the group
   *
   * @example
   * ```typescript
   * flipper.register('admins', (actor) => actor.role === 'admin');\n * flipper.enableGroup('admin-features', 'admins');\n * ```\n   */
  public register(groupName: string, callback: GroupCallback): void {
    this.groups[groupName] = new GroupType(groupName, callback)
  }

  /**
   * Alias for feature() - provides shorthand access to Feature instances.
   * @param featureName - The name of the feature
   * @returns Feature instance
   */
  public get(featureName: string): Feature {
    return this.feature(featureName)
  }

  /**
   * Get a registered group by name.
   * @param groupName - The name of the group
   * @returns GroupType instance or undefined if not found
   */
  public group(groupName: string): GroupType | undefined {
    return this.groups[groupName]
  }
}

export default Dsl
