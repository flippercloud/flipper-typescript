import { Flipper, MemoryAdapter, DualWrite } from '@flippercloud/flipper'
import type { IAdapter } from '@flippercloud/flipper'
import HttpAdapter from './HttpAdapter'
import type { HttpAdapterOptions } from './HttpAdapter'
import Poller from './Poller'

export interface CloudConfiguration {
  /**
   * Flipper Cloud token for your environment
   */
  token: string

  /**
   * Flipper Cloud URL (default: 'https://www.flippercloud.io/adapter')
   */
  url?: string

  /**
   * HTTP timeout in milliseconds (default: 5000)
   */
  timeout?: number

  /**
   * Local adapter for fast reads (default: MemoryAdapter)
   * Use RedisAdapter or SequelizeAdapter for distributed systems
   */
  localAdapter?: IAdapter

  /**
   * Polling interval in milliseconds (default: 10000, minimum: 10000)
   */
  syncInterval?: number

  /**
   * Additional headers to send with HTTP requests
   */
  headers?: Record<string, string>

  /**
   * Whether the adapter should be read-only (default: false)
   */
  readOnly?: boolean
}

/**
 * Extended Flipper instance with Cloud-specific methods
 */
export interface CloudFlipper extends Flipper {
  /**
   * Force a manual sync from Flipper Cloud
   */
  sync(): Promise<void>

  /**
   * Stop the background polling
   */
  stopPolling(): void

  /**
   * Get the underlying adapter (CloudAdapter wrapper)
   */
  readonly adapter: CloudAdapter
}

/**
 * Creates a Flipper Cloud instance with automatic background sync.
 *
 * This function sets up a complete Flipper Cloud integration with:
 * - HttpAdapter for communicating with Flipper Cloud
 * - Local adapter (Memory by default) for fast reads
 * - DualWrite to keep local and cloud in sync
 * - Poller for background synchronization
 *
 * The returned Flipper instance reads from the local adapter (fast) and writes
 * to both local and cloud (dual-write). A background poller keeps the local
 * adapter synchronized with cloud changes.
 *
 * @param config - Cloud configuration
 * @returns Promise that resolves to a Flipper instance with cloud methods
 *
 * @example
 * // Basic usage with memory adapter
 * const flipper = await FlipperCloud({
 *   token: process.env.FLIPPER_CLOUD_TOKEN!,
 * })
 *
 * @example
 * // Production usage with Redis for distributed systems
 * import { RedisAdapter } from '@flippercloud/flipper-redis'
 * import Redis from 'ioredis'
 *
 * const redis = new Redis()
 * const flipper = await FlipperCloud({
 *   token: process.env.FLIPPER_CLOUD_TOKEN!,
 *   localAdapter: new RedisAdapter({ client: redis }),
 *   syncInterval: 30000, // 30 seconds
 * })
 *
 * @example
 * // Read-only mode for worker processes
 * const flipper = await FlipperCloud({
 *   token: process.env.FLIPPER_CLOUD_TOKEN!,
 *   readOnly: true,
 * })
 */
export async function FlipperCloud(config: CloudConfiguration): Promise<CloudFlipper> {
  const {
    token,
    url = 'https://www.flippercloud.io/adapter',
    timeout = 5000,
    localAdapter = new MemoryAdapter(),
    syncInterval = 10000,
    headers = {},
    readOnly = false,
  } = config

  // Create HTTP adapter for cloud communication
  const httpOptions: HttpAdapterOptions = {
    url,
    timeout,
    readOnly,
    headers: {
      ...headers,
      'flipper-cloud-token': token,
    },
  }

  const httpAdapter = new HttpAdapter(httpOptions)

  // Create poller for background sync
  const poller = new Poller({
    remoteAdapter: httpAdapter,
    interval: syncInterval,
    startAutomatically: false, // We'll start after initial sync
  })

  // Perform initial sync before starting poller
  // This ensures the local adapter has data before we start
  try {
    await poller.sync()
  } catch (error) {
    // Log but don't fail - we can still operate with empty local cache
    console.error('Flipper Cloud initial sync failed:', error)
  }

  // Start background polling to keep local adapter in sync with cloud
  // Following Ruby pattern: ensure initial data is available, then start background polling
  poller.start()

  // Create dual-write adapter (writes to cloud, reads from local with poller sync)
  const cloudAdapter = new CloudAdapter(localAdapter, httpAdapter, poller)

  // Create Flipper instance
  const flipper = new Flipper(cloudAdapter) as CloudFlipper

  // Add cloud-specific methods
  flipper.sync = async (): Promise<void> => {
    await cloudAdapter.sync()
  }

  flipper.stopPolling = (): void => {
    poller.stop()
  }

  return flipper
}

/**
 * Cloud adapter that combines DualWrite with Poller-based synchronization.
 *
 * This adapter:
 * - Reads from local adapter (fast, low latency)
 * - Writes to both local and remote (dual-write pattern)
 * - Syncs from poller's adapter (which is kept up-to-date in background)
 *
 * The key difference from plain DualWrite is that reads check if the poller
 * has synced new data and copies it to the local adapter before returning.
 */
export class CloudAdapter extends DualWrite {
  private poller: Poller
  private localAdapter: IAdapter
  private lastSyncedAt: number = 0

  constructor(localAdapter: IAdapter, remoteAdapter: IAdapter, poller: Poller) {
    super(localAdapter, remoteAdapter)
    this.localAdapter = localAdapter
    this.poller = poller
  }

  private async markLocalChange(): Promise<void> {
    // No need to sync back to poller's adapter - poller will sync from remote on next cycle
    this.lastSyncedAt = Date.now()
  }

  /**
   * Ensure local adapter is synced with poller before read operations
   */
  private async ensureSynced(): Promise<void> {
    const pollerLastSync = this.poller.lastSyncedAt
    if (pollerLastSync > this.lastSyncedAt) {
      // Poller has new data, copy it to local adapter
      await this.localAdapter.import(this.poller.adapter)
      this.lastSyncedAt = pollerLastSync
    }
  }

  override async add(feature: Parameters<IAdapter['add']>[0]): Promise<Awaited<ReturnType<IAdapter['add']>>> {
    // Avoid extra network round-trips: creating the feature locally is enough,
    // since subsequent enable/disable calls will create/update it remotely.
    await this.localAdapter.add(feature)
    await this.markLocalChange()
    return true
  }

  override async features(): Promise<Awaited<ReturnType<IAdapter['features']>>> {
    await this.ensureSynced()
    return await super.features()
  }

  override async get(feature: Parameters<IAdapter['get']>[0]): Promise<Awaited<ReturnType<IAdapter['get']>>> {
    await this.ensureSynced()
    return await super.get(feature)
  }

  override async getMulti(
    features: Parameters<IAdapter['getMulti']>[0]
  ): Promise<Awaited<ReturnType<IAdapter['getMulti']>>> {
    await this.ensureSynced()
    return await super.getMulti(features)
  }

  override async getAll(): Promise<Awaited<ReturnType<IAdapter['getAll']>>> {
    await this.ensureSynced()
    return await super.getAll()
  }

  override async remove(feature: Parameters<IAdapter['remove']>[0]): Promise<Awaited<ReturnType<IAdapter['remove']>>> {
    const result = await super.remove(feature)
    await this.markLocalChange()
    return result
  }

  override async clear(feature: Parameters<IAdapter['clear']>[0]): Promise<Awaited<ReturnType<IAdapter['clear']>>> {
    const result = await super.clear(feature)
    await this.markLocalChange()
    return result
  }

  override async enable(
    feature: Parameters<IAdapter['enable']>[0],
    gate: Parameters<IAdapter['enable']>[1],
    thing: Parameters<IAdapter['enable']>[2]
  ): Promise<Awaited<ReturnType<IAdapter['enable']>>> {
    const result = await super.enable(feature, gate, thing)
    await this.markLocalChange()
    return result
  }

  override async disable(
    feature: Parameters<IAdapter['disable']>[0],
    gate: Parameters<IAdapter['disable']>[1],
    thing: Parameters<IAdapter['disable']>[2]
  ): Promise<Awaited<ReturnType<IAdapter['disable']>>> {
    const result = await super.disable(feature, gate, thing)
    await this.markLocalChange()
    return result
  }

  /**
   * Manual sync from cloud
   */
  async sync(): Promise<void> {
    await this.poller.sync()
    await this.ensureSynced()
  }
}
