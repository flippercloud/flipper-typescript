import { MemoryAdapter } from '@flippercloud/flipper'
import type { IAdapter } from '@flippercloud/flipper'

export interface PollerOptions {
  /**
   * Remote adapter to sync from (typically HttpAdapter)
   */
  remoteAdapter: IAdapter

  /**
   * Polling interval in milliseconds (default: 10000)
   * Minimum: 10000 (10 seconds)
   */
  interval?: number

  /**
   * Whether to start polling automatically (default: true)
   */
  startAutomatically?: boolean
}

/**
 * Poller manages background synchronization from a remote adapter to a local adapter.
 *
 * The poller runs on an interval, fetching the latest feature flag state from the
 * remote adapter and importing it into a local memory adapter. This local adapter
 * is then used by the Poll wrapper to provide fast reads.
 *
 * @example
 * const poller = new Poller({
 *   remoteAdapter: httpAdapter,
 *   interval: 10000, // 10 seconds
 * })
 *
 * // Access the synced local adapter
 * const features = await poller.adapter.features()
 *
 * // Stop polling when done
 * poller.stop()
 */
export default class Poller {
  /**
   * Minimum allowed poll interval in milliseconds (10 seconds)
   */
  static readonly MINIMUM_POLL_INTERVAL = 10000

  /**
   * Local memory adapter that holds synced state
   */
  readonly adapter: IAdapter

  /**
   * Remote adapter to sync from
   */
  private readonly remoteAdapter: IAdapter

  /**
   * Polling interval in milliseconds
   */
  private readonly interval: number

  /**
   * Interval timer ID
   */
  private timer: ReturnType<typeof setInterval> | null = null

  /**
   * Timestamp of last successful sync (milliseconds since epoch)
   */
  private _lastSyncedAt: number = 0

  /**
   * Creates a new Poller instance.
   * @param options - Poller configuration
   */
  constructor(options: PollerOptions) {
    this.remoteAdapter = options.remoteAdapter
    this.adapter = new MemoryAdapter()

    // Enforce minimum interval
    let interval = options.interval ?? 10000
    if (interval < Poller.MINIMUM_POLL_INTERVAL) {
      console.warn(
        `Flipper Cloud poll interval must be >= ${Poller.MINIMUM_POLL_INTERVAL}ms but was ${interval}ms. ` +
          `Setting interval to ${Poller.MINIMUM_POLL_INTERVAL}ms.`
      )
      interval = Poller.MINIMUM_POLL_INTERVAL
    }
    this.interval = interval

    // Start automatically if requested
    if (options.startAutomatically !== false) {
      this.start()
    }
  }

  /**
   * Gets the timestamp of the last successful sync.
   * @returns Milliseconds since epoch
   */
  get lastSyncedAt(): number {
    return this._lastSyncedAt
  }

  /**
   * Starts the polling background process.
   * Safe to call multiple times - will only start one timer.
   */
  start(): void {
    if (this.timer !== null) {
      return // Already running
    }

    // Run first sync immediately only when we don't already have fresh data
    if (this._lastSyncedAt === 0) {
      void this.sync().catch(error => {
        console.error('Flipper Cloud poller initial sync error:', error)
      })
    }

    // Set up interval for subsequent syncs
    this.timer = setInterval(() => {
      void this.sync().catch(error => {
        // Silently catch errors to prevent the poller from stopping
        // Users can instrument sync calls if they want to track errors
        console.error('Flipper Cloud poller sync error:', error)
      })
    }, this.interval)
  }

  /**
   * Stops the polling background process.
   * Safe to call multiple times.
   */
  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /**
   * Performs a synchronous import from remote to local adapter.
   * Updates the lastSyncedAt timestamp on success.
   * @returns Promise that resolves when sync is complete
   */
  async sync(): Promise<void> {
    const exportData = await this.remoteAdapter.export({ format: 'json', version: 1 })
    await this.adapter.import(exportData)
    this._lastSyncedAt = Date.now()
  }
}
