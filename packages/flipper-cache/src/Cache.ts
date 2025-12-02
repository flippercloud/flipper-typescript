import type { IAdapter, IGate, IType } from '@flippercloud/flipper'
import type { Feature, Export, Dsl } from '@flippercloud/flipper'
import { Synchronizer } from '@flippercloud/flipper'
import type { ICache, CacheOptions } from './types'

/**
 * Cache adapter: wraps a storage adapter with read-through and write-through caching.
 * Inspired by Ruby's CacheBase and ActiveSupportCacheStore.
 */
export default class Cache implements IAdapter {
  public readonly name: string
  private adapter: IAdapter
  private cache: ICache
  private ttlSeconds?: number
  private namespace: string
  private writeThrough: boolean

  constructor(adapter: IAdapter, cache: ICache, options: CacheOptions = {}) {
    this.adapter = adapter
    this.cache = cache
    this.ttlSeconds = options.ttlSeconds
    const cacheVersion = 'v1'
    const prefix = options.prefix ?? ''
    this.namespace = `${prefix}flipper/${cacheVersion}`
    this.writeThrough = options.writeThrough ?? false
    this.name = adapter.name
  }

  private featuresCacheKey(): string {
    return `${this.namespace}/features`
  }

  private featureCacheKey(key: string): string {
    return `${this.namespace}/feature/${key}`
  }

  private async expireFeaturesCache(): Promise<void> {
    await this.cache.delete(this.featuresCacheKey())
  }

  private async expireFeatureCache(key: string): Promise<void> {
    await this.cache.delete(this.featureCacheKey(key))
  }

  async features(): Promise<Feature[]> {
    const cached = await this.cache.get<Feature[]>(this.featuresCacheKey())
    if (cached.hit) return cached.value

    const value = await this.adapter.features()
    await this.cache.set(this.featuresCacheKey(), value, this.ttlSeconds)
    return value
  }

  async add(feature: Feature): Promise<boolean> {
    const result = await this.adapter.add(feature)
    await this.expireFeaturesCache()
    return result
  }

  async remove(feature: Feature): Promise<boolean> {
    const result = await this.adapter.remove(feature)
    await this.expireFeaturesCache()
    await this.expireFeatureCache(feature.key)
    return result
  }

  async clear(feature: Feature): Promise<boolean> {
    const result = await this.adapter.clear(feature)
    await this.expireFeatureCache(feature.key)
    return result
  }

  async get(feature: Feature): Promise<Record<string, unknown>> {
    const key = this.featureCacheKey(feature.key)
    const cached = await this.cache.get<Record<string, unknown>>(key)
    if (cached.hit) return cached.value

    const value = await this.adapter.get(feature)
    await this.cache.set(key, value, this.ttlSeconds)
    return value
  }

  async getMulti(features: Feature[]): Promise<Record<string, Record<string, unknown>>> {
    const keys = features.map(f => this.featureCacheKey(f.key))
    const cacheResult = await this.cache.getMulti(keys)

    const uncached = features.filter(f => !(this.featureCacheKey(f.key) in cacheResult))

    if (uncached.length > 0) {
      const response = await this.adapter.getMulti(uncached)
      for (const [featureKey, value] of Object.entries(response)) {
        await this.cache.set(this.featureCacheKey(featureKey), value, this.ttlSeconds)
        cacheResult[this.featureCacheKey(featureKey)] = value
      }
    }

    const result: Record<string, Record<string, unknown>> = {}
    for (const feature of features) {
      const value = cacheResult[this.featureCacheKey(feature.key)]
      result[feature.key] = (value && typeof value === 'object' ? (value as Record<string, unknown>) : {})
    }
    return result
  }

  async getAll(): Promise<Record<string, Record<string, unknown>>> {
    const features = await this.features()
    return await this.getMulti(features)
  }

  async enable(feature: Feature, gate: IGate, thing: IType): Promise<boolean> {
    const result = await this.adapter.enable(feature, gate, thing)
    if (this.writeThrough) {
      const value = await this.adapter.get(feature)
      await this.cache.set(this.featureCacheKey(feature.key), value, this.ttlSeconds)
    } else {
      await this.expireFeatureCache(feature.key)
    }
    return result
  }

  async disable(feature: Feature, gate: IGate, thing: IType): Promise<boolean> {
    const result = await this.adapter.disable(feature, gate, thing)
    if (this.writeThrough) {
      const value = await this.adapter.get(feature)
      await this.cache.set(this.featureCacheKey(feature.key), value, this.ttlSeconds)
    } else {
      await this.expireFeatureCache(feature.key)
    }
    return result
  }

  readOnly(): boolean {
    return this.adapter.readOnly()
  }

  async export(options: { format?: string; version?: number } = {}): Promise<Export> {
    // Export underlying adapter state (cache is derivative)
    return await this.adapter.export(options)
  }

  async import(source: IAdapter | Export | Dsl): Promise<boolean> {
    const sourceAdapter = await this.getSourceAdapter(source)
    const synchronizer = new Synchronizer(this.adapter, sourceAdapter, { raise: true })
    const result = await synchronizer.call()
    // Invalidate caches after import
    await this.cache.delete(this.featuresCacheKey())
    return result
  }

  private async getSourceAdapter(source: IAdapter | Export | Dsl): Promise<IAdapter> {
    type AdapterValue = { adapter: IAdapter }
    type AdapterFunc = { adapter: () => Promise<IAdapter> }
    const hasAdapter = (x: unknown): x is { adapter: unknown } =>
      typeof x === 'object' && x !== null && 'adapter' in (x as Record<string, unknown>)
    const isDsl = (x: unknown): x is AdapterValue =>
      hasAdapter(x) && typeof (x as { adapter: unknown }).adapter !== 'function'
    const isExport = (x: unknown): x is AdapterFunc =>
      hasAdapter(x) && typeof (x as { adapter: unknown }).adapter === 'function'

    if (isDsl(source)) {
      return source.adapter
    }
    if (isExport(source)) {
      return await source.adapter()
    }
    return source
  }
}
