import { MemoryAdapter, Feature, BooleanGate, BooleanType, Dsl } from '@flippercloud/flipper'
import Cache from './Cache'
import MemoryCache from './MemoryCache'

describe('Cache adapter', () => {
  let store: MemoryAdapter
  let cache: MemoryCache
  let cachedStore: Cache
  let feature: Feature
  let gate: BooleanGate
  let thing: BooleanType

  beforeEach(async () => {
    store = new MemoryAdapter()
    cache = new MemoryCache()
    cachedStore = new Cache(store, cache, { ttlSeconds: 60, prefix: 'test:' })

    const dsl = new Dsl(store)
    feature = dsl.feature('search')
    gate = new BooleanGate()
    thing = new BooleanType(true)
    await store.add(feature)
  })

  it('caches features()', async () => {
    const features1 = await cachedStore.features()
    const features2 = await cachedStore.features()
    expect(features1).toEqual(features2)
  })

  it('read-through caches get()', async () => {
    const first = await cachedStore.get(feature)
    const second = await cachedStore.get(feature)
    expect(second).toEqual(first)
  })

  it('getMulti caches missing and returns merged', async () => {
    const f2 = new Feature('reports', store, {})
    await store.add(f2)
    const result = await cachedStore.getMulti([feature, f2])
    expect(Object.keys(result)).toEqual(['search', 'reports'])
  })

  it('getAll returns all cached values', async () => {
    const all = await cachedStore.getAll()
    expect(all).toHaveProperty('search')
  })

  it('invalidates cache on add/remove/clear', async () => {
    await cachedStore.features()
    await cachedStore.add(new Feature('reports', store, {}))
    const features = await cachedStore.features()
    expect(features.map(f => f.key)).toContain('reports')

    await cachedStore.clear(feature)
    const afterClear = await cachedStore.get(feature)
    expect(afterClear).toEqual({})

    await cachedStore.remove(feature)
    const featuresAfterRemove = await cachedStore.features()
    expect(featuresAfterRemove.map(f => f.key)).not.toContain('search')
  })

  it('writeThrough updates cache on enable/disable when enabled', async () => {
    const wt = new Cache(store, cache, { writeThrough: true })
    const dsl = new Dsl(wt)
    const feat = dsl.feature('wt')
    await wt.add(feat)
    await wt.enable(feat, gate, thing)

    const cached = await cache.get((wt as any).featureCacheKey('wt'))
    expect(cached).toBeTruthy()
  })
})
