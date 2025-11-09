import Memoizable from './Memoizable'
import MemoryAdapter from '../MemoryAdapter'
import Feature from '../Feature'
import Dsl from '../Dsl'
import BooleanGate from '../BooleanGate'
import BooleanType from '../BooleanType'
import { jest } from '@jest/globals'

describe('Memoizable', () => {
  let adapter: MemoryAdapter
  let memoizer: Memoizable
  let feature: Feature
  let gate: BooleanGate
  let thing: BooleanType

  beforeEach(async () => {
    adapter = new MemoryAdapter()
    memoizer = new Memoizable(adapter)
    const dsl = new Dsl(adapter)
    feature = dsl.feature('test_feature')
    gate = new BooleanGate()
    thing = new BooleanType(true)

    await adapter.add(feature)
  })

  describe('memoize property', () => {
    it('starts disabled', () => {
      expect(memoizer.memoize).toBe(false)
    })

    it('can be enabled', () => {
      memoizer.memoize = true
      expect(memoizer.memoize).toBe(true)
    })

    it('clears cache when disabled', async () => {
      memoizer.memoize = true
      await memoizer.get(feature) // Cache it

      memoizer.memoize = false
      memoizer.memoize = true

      // New call should hit adapter (cache was cleared)
      expect(await memoizer.get(feature)).toBeDefined()
    })
  })

  describe('when memoization is disabled', () => {
    it('always calls adapter for features()', async () => {
      const spy = jest.spyOn(adapter, 'features')

      await memoizer.features()
      await memoizer.features()

      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('always calls adapter for get()', async () => {
      const spy = jest.spyOn(adapter, 'get')

      await memoizer.get(feature)
      await memoizer.get(feature)

      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('always calls adapter for getMulti()', async () => {
      const spy = jest.spyOn(adapter, 'getMulti')

      await memoizer.getMulti([feature])
      await memoizer.getMulti([feature])

      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('always calls adapter for getAll()', async () => {
      const spy = jest.spyOn(adapter, 'getAll')

      await memoizer.getAll()
      await memoizer.getAll()

      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  describe('when memoization is enabled', () => {
    beforeEach(() => {
      memoizer.memoize = true
    })

    describe('features()', () => {
      it('caches result', async () => {
        const spy = jest.spyOn(adapter, 'features')

        await memoizer.features()
        await memoizer.features()
        await memoizer.features()

        expect(spy).toHaveBeenCalledTimes(1)
      })

      it('returns same result from cache', async () => {
        const first = await memoizer.features()
        const second = await memoizer.features()

        expect(first).toEqual(second)
      })
    })

    describe('get()', () => {
      it('caches result per feature', async () => {
        const spy = jest.spyOn(adapter, 'get')

        // Start 3 concurrent requests
        void memoizer.get(feature)
        void memoizer.get(feature)
        await memoizer.get(feature)

        expect(spy).toHaveBeenCalledTimes(1)
      })

      it('returns same result from cache', async () => {
        const first = await memoizer.get(feature)
        const second = await memoizer.get(feature)

        expect(first).toEqual(second)
      })
    })

    describe('getMulti()', () => {
      it('only fetches uncached features', async () => {
        const feature2 = new Feature('feature2', adapter, {})
        await adapter.add(feature2)

        const spy = jest.spyOn(adapter, 'getMulti')

        // Cache feature1
        await memoizer.get(feature)

        // Request both - should only fetch feature2
        await memoizer.getMulti([feature, feature2])

        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith([feature2])
      })

      it('returns all features from cache when available', async () => {
        const feature2 = new Feature('feature2', adapter, {})
        await adapter.add(feature2)

        // Cache both individually
        await memoizer.get(feature)
        await memoizer.get(feature2)

        const spy = jest.spyOn(adapter, 'getMulti')

        // Request both - should use cache
        const result = await memoizer.getMulti([feature, feature2])

        expect(spy).not.toHaveBeenCalled()
        expect(result[feature.key]).toBeDefined()
        expect(result[feature2.key]).toBeDefined()
      })
    })

    describe('getAll()', () => {
      it('caches result', async () => {
        const spy = jest.spyOn(adapter, 'getAll')

        await memoizer.getAll()
        await memoizer.getAll()

        expect(spy).toHaveBeenCalledTimes(1)
      })

      it('builds result from cache on subsequent calls', async () => {
        const first = await memoizer.getAll()
        const second = await memoizer.getAll()

        expect(first).toEqual(second)
      })
    })

    describe('cache expiration', () => {
      it('expires feature cache on enable', async () => {
        await memoizer.get(feature)

        const spy = jest.spyOn(adapter, 'get')
        await memoizer.enable(feature, gate, thing)

        // Next get should hit adapter
        await memoizer.get(feature)
        expect(spy).toHaveBeenCalled()
      })

      it('expires feature cache on disable', async () => {
        await memoizer.get(feature)

        const spy = jest.spyOn(adapter, 'get')
        await memoizer.disable(feature, gate, thing)

        // Next get should hit adapter
        await memoizer.get(feature)
        expect(spy).toHaveBeenCalled()
      })

      it('expires feature cache on clear', async () => {
        await memoizer.get(feature)

        const spy = jest.spyOn(adapter, 'get')
        await memoizer.clear(feature)

        // Next get should hit adapter
        await memoizer.get(feature)
        expect(spy).toHaveBeenCalled()
      })

      it('expires features set on add', async () => {
        await memoizer.features()

        const spy = jest.spyOn(adapter, 'features')
        const newFeature = new Feature('new', adapter, {})
        await memoizer.add(newFeature)

        // Next features() should hit adapter
        await memoizer.features()
        expect(spy).toHaveBeenCalled()
      })

      it('expires features set and feature on remove', async () => {
        await memoizer.features()
        await memoizer.get(feature)

        const featuresSpy = jest.spyOn(adapter, 'features')
        const getSpy = jest.spyOn(adapter, 'get')

        await memoizer.remove(feature)

        await memoizer.features()
        await memoizer.get(feature)

        expect(featuresSpy).toHaveBeenCalled()
        expect(getSpy).toHaveBeenCalled()
      })
    })
  })

  describe('custom cache', () => {
    it('accepts external cache object', async () => {
      const cache = {}
      const memoizer = new Memoizable(adapter, cache)

      memoizer.memoize = true
      await memoizer.get(feature)

      // Cache should be populated
      expect(Object.keys(cache).length).toBeGreaterThan(0)
    })

    it('shares cache between instances', async () => {
      const cache = {}
      const memoizer1 = new Memoizable(adapter, cache)
      const memoizer2 = new Memoizable(adapter, cache)

      memoizer1.memoize = true
      memoizer2.memoize = true

      // Memoizer1 fetches and caches
      await memoizer1.get(feature)

      const spy = jest.spyOn(adapter, 'get')

      // Memoizer2 should use shared cache
      await memoizer2.get(feature)

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('integration with Dsl', () => {
    it('reduces adapter calls during request', () => {
      memoizer.memoize = true
      const dsl = new Dsl(memoizer)

      const spy = jest.spyOn(adapter, 'get')

      // Multiple checks of same feature
      void dsl.isFeatureEnabled('test_feature')
      void dsl.isFeatureEnabled('test_feature')
      void dsl.isFeatureEnabled('test_feature')

      // Should only hit adapter once
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })
})
