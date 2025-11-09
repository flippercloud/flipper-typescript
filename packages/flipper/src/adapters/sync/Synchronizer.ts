import type { IAdapter, IInstrumenter } from '../../interfaces'
import type GroupType from '../../GroupType'
import Feature from '../../Feature'
import GateValues from '../../GateValues'
import FeatureSynchronizer from './FeatureSynchronizer'
import NoopInstrumenter from '../../instrumenters/NoopInstrumenter'

/**
 * Synchronizes a local adapter with a remote source.
 *
 * Given a local and remote adapter, updates the local to match the remote
 * by performing only the necessary enable/disable operations.
 *
 * This is the core of the import functionality - it destructively replaces
 * all local features with the remote features.
 *
 * @example
 * const synchronizer = new Synchronizer(
 *   localAdapter,
 *   remoteAdapter,
 *   { raise: true }
 * );
 * synchronizer.call();
 */
class Synchronizer {
  private readonly local: IAdapter
  private readonly remote: IAdapter
  private readonly instrumenter: IInstrumenter
  private readonly raise: boolean
  private readonly groups: Record<string, GroupType>

  /**
   * Create a new Synchronizer.
   * @param local - The local adapter to sync (destination)
   * @param remote - The remote adapter to sync from (source)
   * @param options - Synchronization options
   */
  constructor(
    local: IAdapter,
    remote: IAdapter,
    options: {
      instrumenter?: IInstrumenter
      raise?: boolean
      groups?: Record<string, GroupType>
    } = {}
  ) {
    this.local = local
    this.remote = remote
    this.instrumenter = options.instrumenter ?? new NoopInstrumenter()
    this.raise = options.raise ?? true
    this.groups = options.groups ?? {}
  }

  /**
   * Perform the synchronization.
   *
   * @returns True if successful, false if an error occurred and raise=false
   * @throws {Error} If an error occurs and raise=true
   */
  public async call(): Promise<boolean> {
    return await this.instrumenter.instrument(
      'synchronizer_call.flipper',
      {},
      async () => {
        try {
          await this.sync()
          return true
        } catch (error) {
          await this.instrumenter.instrument(
            'synchronizer_exception.flipper',
            { exception: error },
            () => undefined
          )
          if (this.raise) {
            throw error
          }
          return false
        }
      }
    )
  }

  /**
   * Internal sync implementation.
   */
  private async sync(): Promise<void> {
    const localGetAll = await this.local.getAll()
    const remoteGetAll = await this.remote.getAll()

    // Sync all the gate values
    for (const featureKey of Object.keys(remoteGetAll)) {
      const feature = new Feature(featureKey, this.local, this.groups)
      const remoteGatesHash = remoteGetAll[featureKey]

      if (!remoteGatesHash) {
        continue
      }

      // Get local gates or use default config
      const localGatesHash = localGetAll[featureKey] ?? this.defaultConfig()

      const localGateValues = new GateValues(localGatesHash)
      const remoteGateValues = new GateValues(remoteGatesHash)

      await new FeatureSynchronizer(feature, localGateValues, remoteGateValues).call()
    }

    // Add features that are missing in local and present in remote
    const featuresToAdd = Object.keys(remoteGetAll).filter(
      (key) => !Object.prototype.hasOwnProperty.call(localGetAll, key)
    )
    for (const key of featuresToAdd) {
      await new Feature(key, this.local, this.groups).add()
    }

    // Remove features that are present in local and missing in remote
    const featuresToRemove = Object.keys(localGetAll).filter(
      (key) => !Object.prototype.hasOwnProperty.call(remoteGetAll, key)
    )
    for (const key of featuresToRemove) {
      await new Feature(key, this.local, this.groups).remove()
    }
  }

  /**
   * Get default config for a feature.
   */
  private defaultConfig(): Record<string, unknown> {
    return {
      boolean: null,
      groups: new Set<string>(),
      actors: new Set<string>(),
      expression: null,
      percentageOfActors: null,
      percentageOfTime: null,
    }
  }
}

export default Synchronizer
