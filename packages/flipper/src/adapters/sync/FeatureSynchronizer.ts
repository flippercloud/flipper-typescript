import type Feature from '../../Feature'
import type GateValues from '../../GateValues'

/**
 * Synchronizes gate values for a single feature.
 *
 * Compares local and remote gate values and performs the minimum
 * necessary enable/disable operations to sync the local feature.
 *
 * @example
 * const synchronizer = new FeatureSynchronizer(
 *   feature,
 *   localGateValues,
 *   remoteGateValues
 * )
 * synchronizer.call()
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
  public async call(): Promise<void> {
    // Note: Feature methods will be async in Phase 2, for now just wrap in async
    await this.syncBoolean()
    await this.syncActors()
    await this.syncGroups()
    await this.syncPercentageOfActors()
    await this.syncPercentageOfTime()
    // Note: Expression sync would go here when expressions are implemented
  }

  /**
   * Sync the boolean gate.
   */
  private async syncBoolean(): Promise<void> {
    const localValue = this.local.boolean
    const remoteValue = this.remote.boolean

    if (localValue === remoteValue) {
      return
    }

    if (remoteValue) {
      await this.feature.enable()
    } else {
      await this.feature.disable()
    }
  }

  /**
   * Sync the actors gate.
   */
  private async syncActors(): Promise<void> {
    const localSet = this.local.actors
    const remoteSet = this.remote.actors

    // Disable actors that are in local but not in remote
    for (const actorId of localSet) {
      if (!remoteSet.has(actorId)) {
        await this.feature.disableActor({ flipperId: actorId })
      }
    }

    // Enable actors that are in remote but not in local
    for (const actorId of remoteSet) {
      if (!localSet.has(actorId)) {
        await this.feature.enableActor({ flipperId: actorId })
      }
    }
  }

  /**
   * Sync the groups gate.
   */
  private async syncGroups(): Promise<void> {
    const localSet = this.local.groups
    const remoteSet = this.remote.groups

    // Disable groups that are in local but not in remote
    for (const groupName of localSet) {
      if (!remoteSet.has(groupName)) {
        await this.feature.disableGroup(groupName)
      }
    }

    // Enable groups that are in remote but not in local
    for (const groupName of remoteSet) {
      if (!localSet.has(groupName)) {
        await this.feature.enableGroup(groupName)
      }
    }
  }

  /**
   * Sync the percentage of actors gate.
   */
  private async syncPercentageOfActors(): Promise<void> {
    const localValue = this.local.percentageOfActors
    const remoteValue = this.remote.percentageOfActors

    if (localValue === remoteValue) {
      return
    }

    if (remoteValue === null || remoteValue === undefined) {
      await this.feature.disablePercentageOfActors()
    } else {
      await this.feature.enablePercentageOfActors(parseInt(String(remoteValue), 10))
    }
  }

  /**
   * Sync the percentage of time gate.
   */
  private async syncPercentageOfTime(): Promise<void> {
    const localValue = this.local.percentageOfTime
    const remoteValue = this.remote.percentageOfTime

    if (localValue === remoteValue) {
      return
    }

    if (remoteValue === null || remoteValue === undefined) {
      await this.feature.disablePercentageOfTime()
    } else {
      await this.feature.enablePercentageOfTime(parseInt(String(remoteValue), 10))
    }
  }
}

export default FeatureSynchronizer
