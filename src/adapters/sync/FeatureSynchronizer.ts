import type Feature from '../../Feature'
import type GateValues from '../../GateValues'

/**
 * Synchronizes gate values for a single feature.
 *
 * Compares local and remote gate values and performs the minimum
 * necessary enable/disable operations to sync the local feature.
 *
 * @example
 * ```typescript
 * const synchronizer = new FeatureSynchronizer(
 *   feature,
 *   localGateValues,
 *   remoteGateValues
 * );
 * synchronizer.call();
 * ```
 */
class FeatureSynchronizer {
  private readonly feature: Feature
  private readonly local: GateValues
  private readonly remote: GateValues

  /**
   * Create a new FeatureSynchronizer.
   * @param feature - The feature to synchronize
   * @param local - The local (current) gate values
   * @param remote - The remote (target) gate values
   */
  constructor(feature: Feature, local: GateValues, remote: GateValues) {
    this.feature = feature
    this.local = local
    this.remote = remote
  }

  /**
   * Perform the synchronization.
   *
   * Compares each gate's values and enables/disables as needed
   * to match the remote state.
   */
  public call(): void {
    this.syncBoolean()
    this.syncActors()
    this.syncGroups()
    this.syncPercentageOfActors()
    this.syncPercentageOfTime()
    // Note: Expression sync would go here when expressions are implemented
  }

  /**
   * Sync the boolean gate.
   */
  private syncBoolean(): void {
    const localValue = this.local.boolean
    const remoteValue = this.remote.boolean

    if (localValue === remoteValue) {
      return
    }

    if (remoteValue) {
      this.feature.enable()
    } else {
      this.feature.disable()
    }
  }

  /**
   * Sync the actors gate.
   */
  private syncActors(): void {
    const localSet = this.local.actors
    const remoteSet = this.remote.actors

    // Disable actors that are in local but not in remote
    localSet.forEach((actorId) => {
      if (!remoteSet.has(actorId)) {
        this.feature.disableActor({ flipperId: actorId })
      }
    })

    // Enable actors that are in remote but not in local
    remoteSet.forEach((actorId) => {
      if (!localSet.has(actorId)) {
        this.feature.enableActor({ flipperId: actorId })
      }
    })
  }

  /**
   * Sync the groups gate.
   */
  private syncGroups(): void {
    const localSet = this.local.groups
    const remoteSet = this.remote.groups

    // Disable groups that are in local but not in remote
    localSet.forEach((groupName) => {
      if (!remoteSet.has(groupName)) {
        this.feature.disableGroup(groupName)
      }
    })

    // Enable groups that are in remote but not in local
    remoteSet.forEach((groupName) => {
      if (!localSet.has(groupName)) {
        this.feature.enableGroup(groupName)
      }
    })
  }

  /**
   * Sync the percentage of actors gate.
   */
  private syncPercentageOfActors(): void {
    const localValue = this.local.percentageOfActors
    const remoteValue = this.remote.percentageOfActors

    if (localValue === remoteValue) {
      return
    }

    if (remoteValue === null || remoteValue === undefined) {
      this.feature.disablePercentageOfActors()
    } else {
      this.feature.enablePercentageOfActors(parseInt(String(remoteValue), 10))
    }
  }

  /**
   * Sync the percentage of time gate.
   */
  private syncPercentageOfTime(): void {
    const localValue = this.local.percentageOfTime
    const remoteValue = this.remote.percentageOfTime

    if (localValue === remoteValue) {
      return
    }

    if (remoteValue === null || remoteValue === undefined) {
      this.feature.disablePercentageOfTime()
    } else {
      this.feature.enablePercentageOfTime(parseInt(String(remoteValue), 10))
    }
  }
}

export default FeatureSynchronizer
