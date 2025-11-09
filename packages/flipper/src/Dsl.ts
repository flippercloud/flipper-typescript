import Feature from './Feature'
import GroupType from './GroupType'
import { GroupCallback, IActor, IAdapter, IInstrumenter } from './interfaces'
import NoopInstrumenter from './instrumenters/NoopInstrumenter'
import type Export from './Export'

/**
 * Domain-Specific Language for feature flag operations.
 *
 * Provides a fluent API for managing feature flags, including enabling/disabling
 * features, checking state, registering groups, and preloading feature data.
 *
 * This class is the foundation of the Flipper API, extended by the Flipper class.
 *
 * @example
 * const adapter = new MemoryAdapter();
 * const dsl = new Dsl(adapter);
 *
 * // Register a group
 * dsl.register('admins', (actor) => actor.isAdmin === true);
 *
 * // Enable feature for a group
 * await dsl.enableGroup('admin-panel', 'admins');
 *
 * // Check if enabled for an actor
 * const user = { flipperId: 'user-123', isAdmin: true };
 * await dsl.isFeatureEnabled('admin-panel', user); // true
 *
 * // Preload features for efficiency
 * await dsl.preloadAll();
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
  public async isFeatureEnabled(featureName: string, thing?: unknown): Promise<boolean> {
    return await this.feature(featureName).isEnabled(thing)
  }

  /**
   * Fully enable a feature for everyone.
   * @param featureName - The name of the feature to enable
   * @returns True if successful
   */
  public async enable(featureName: string): Promise<boolean> {
    await this.feature(featureName).enable()
    return true
  }

  /**
   * Enable a feature for a specific actor.
   * @param featureName - The name of the feature
   * @param actor - The actor to enable the feature for
   * @returns True if successful
   */
  public async enableActor(featureName: string, actor: IActor): Promise<boolean> {
    await this.feature(featureName).enableActor(actor)
    return true
  }

  /**
   * Enable a feature for a specific group.
   * @param featureName - The name of the feature
   * @param groupName - The name of the group to enable for
   * @returns True if successful
   */
  public async enableGroup(featureName: string, groupName: string): Promise<boolean> {
    await this.feature(featureName).enableGroup(groupName)
    return true
  }

  /**
   * Enable a feature for a percentage of actors (deterministic based on actor ID).
   * @param featureName - The name of the feature
   * @param percentage - Percentage of actors (0-100)
   */
  public async enablePercentageOfActors(featureName: string, percentage: number): Promise<boolean> {
    return await this.feature(featureName).enablePercentageOfActors(percentage)
  }

  /**
   * Enable a feature for a percentage of time (random).
   * @param featureName - The name of the feature
   * @param percentage - Percentage of time (0-100)
   */
  public async enablePercentageOfTime(featureName: string, percentage: number): Promise<boolean> {
    return await this.feature(featureName).enablePercentageOfTime(percentage)
  }

  /**
   * Fully disable a feature for everyone.
   * @param featureName - The name of the feature to disable
   * @returns True if successful
   */
  public async disable(featureName: string): Promise<boolean> {
    await this.feature(featureName).disable()
    return true
  }

  /**
   * Disable a feature for a specific actor.
   * @param featureName - The name of the feature
   * @param actor - The actor to disable the feature for
   * @returns True if successful
   */
  public async disableActor(featureName: string, actor: IActor): Promise<boolean> {
    await this.feature(featureName).disableActor(actor)
    return true
  }

  /**
   * Disable a feature for a specific group.
   * @param featureName - The name of the feature
   * @param groupName - The name of the group to disable for
   * @returns True if successful
   */
  public async disableGroup(featureName: string, groupName: string): Promise<boolean> {
    await this.feature(featureName).disableGroup(groupName)
    return true
  }

  /**
   * Disable percentage of actors gate (sets to 0%).
   * @param featureName - The name of the feature
   * @returns True if successful
   */
  public async disablePercentageOfActors(featureName: string): Promise<boolean> {
    await this.feature(featureName).disablePercentageOfActors()
    return true
  }

  /**
   * Disable percentage of time gate (sets to 0%).
   * @param featureName - The name of the feature
   * @returns True if successful
   */
  public async disablePercentageOfTime(featureName: string): Promise<boolean> {
    await this.feature(featureName).disablePercentageOfTime()
    return true
  }

  /**
   * Add a feature to the adapter (creates it if it doesn't exist).
   * @param featureName - The name of the feature to add
   * @returns True if successful
   */
  public async add(featureName: string): Promise<boolean> {
    return await this.feature(featureName).add()
  }

  /**
   * Check if a feature exists in the adapter.
   * @param featureName - The name of the feature to check
   * @returns True if the feature exists
   */
  public async exist(featureName: string): Promise<boolean> {
    return await this.feature(featureName).exist()
  }

  /**
   * Remove a feature from the adapter (deletes it completely).
   * @param featureName - The name of the feature to remove
   * @returns True if successful
   */
  public async remove(featureName: string): Promise<boolean> {
    return await this.feature(featureName).remove()
  }

  /**
   * Get all features from the adapter.
   * @returns Array of Feature instances
   */
  public async features(): Promise<Feature[]> {
    const featureObjects = await this.adapter.features()
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
  public async preload(featureNames: string[]): Promise<Feature[]> {
    const features = featureNames.map(name => this.feature(name))
    await this.adapter.getMulti(features)
    return features
  }

  /**
   * Preload all features from the adapter in a single call.
   * @returns Array of all Feature instances
   */
  public async preloadAll(): Promise<Feature[]> {
    const allData = await this.adapter.getAll()
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
   * flipper.register('admins', (actor) => actor.role === 'admin');
   * await flipper.enableGroup('admin-features', 'admins');
   */
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

  /**
   * Export all features to a portable format.
   *
   * @param options - Export options
   * @returns Export object containing serialized feature data
   *
   * @example
   * // Export to JSON
   * const exportObj = await flipper.export({ format: 'json', version: 1 });
   * const jsonString = exportObj.contents;
   *
   * // Save to file
   * fs.writeFileSync('backup.json', jsonString);
   */
  async export(options?: { format?: string; version?: number }): Promise<Export> {
    return await this.adapter.export(options)
  }

  /**
   * Import features from another source.
   *
   * This is a destructive operation - it will remove features not present
   * in the source and sync all features to match the source exactly.
   *
   * @param source - The source to import from (Dsl, Adapter, or Export)
   * @returns True if successful
   *
   * @example
   * // Import from another Flipper instance
   * const source = new Flipper(sourceAdapter);
   * await destination.import(source);
   *
   * // Import from an export
   * const contents = fs.readFileSync('backup.json', 'utf-8');
   * const exportObj = new JsonExport({ contents });
   * await flipper.import(exportObj);
   *
   * // Import from another adapter
   * await flipper.import(sourceAdapter);
   */
  async import(source: IAdapter | Export | Dsl): Promise<boolean> {
    return await this.adapter.import(source)
  }
}

export default Dsl
