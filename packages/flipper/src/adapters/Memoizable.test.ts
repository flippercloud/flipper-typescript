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

  beforeEach(() => {
    adapter = new MemoryAdapter()
    memoizer = new Memoizable(adapter)
    const dsl = new Dsl(adapter)
    feature = dsl.feature('test_feature')
    gate = new BooleanGate()
    thing = new BooleanType(true)

    adapter.add(feature)
  })

  describe('memoize property', () => {
    it('starts disabled', () => {
      expect(memoizer.memoize).toBe(false)
    })

    it('can be enabled', () => {
      memoizer.memoize = true
      expect(memoizer.memoize).toBe(true)
    })

    it('clears cache when disabled', () => {
      memoizer.memoize = true
      memoizer.get(feature) // Cache it

      memoizer.memoize = false
      memoizer.memoize = true

      // New call should hit adapter (cache was cleared)
      expect(memoizer.get(feature)).toBeDefined()
    })
  })

  describe('when memoization is disabled', () => {
    it('always calls adapter for features()', () => {
      const spy = jest.spyOn(adapter, 'features')

      memoizer.features()
      memoizer.features()

      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('always calls adapter for get()', () => {
      const spy = jest.spyOn(adapter, 'get')

      memoizer.get(feature)
      memoizer.get(feature)

      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('always calls adapter for getMulti()', () => {
      const spy = jest.spyOn(adapter, 'getMulti')

      memoizer.getMulti([feature])
      memoizer.getMulti([feature])

      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('always calls adapter for getAll()', () => {
      const spy = jest.spyOn(adapter, 'getAll')

      memoizer.getAll()
      memoizer.getAll()

      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  describe('when memoization is enabled', () => {
    beforeEach(() => {
      memoizer.memoize = true
    })

    describe('features()', () => {
      it('caches result', () => {
        const spy = jest.spyOn(adapter, 'features')

        memoizer.features()
        memoizer.features()
        memoizer.features()

        expect(spy).toHaveBeenCalledTimes(1)
      })

      it('returns same result from cache', () => {
        const first = memoizer.features()
        const second = memoizer.features()

        expect(first).toEqual(second)
      })
    })

    describe('get()', () => {
      it('caches result per feature', () => {
        const spy = jest.spyOn(adapter, 'get')

        memoizer.get(feature)
        memoizer.get(feature)
        memoizer.get(feature)

        expect(spy).toHaveBeenCalledTimes(1)
      })

      it('returns same result from cache', () => {
        const first = memoizer.get(feature)
        const second = memoizer.get(feature)

        expect(first).toEqual(second)
      })
    })

    describe('getMulti()', () => {
      it('only fetches uncached features', () => {
        const feature2 = new Feature('feature2', adapter, {})
        adapter.add(feature2)

        const spy = jest.spyOn(adapter, 'getMulti')

        // Cache feature1
        memoizer.get(feature)

        // Request both - should only fetch feature2
        memoizer.getMulti([feature, feature2])

        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith([feature2])
      })

      it('returns all features from cache when available', () => {
        const feature2 = new Feature('feature2', adapter, {})
        adapter.add(feature2)

        // Cache both individually
        memoizer.get(feature)
        memoizer.get(feature2)

        const spy = jest.spyOn(adapter, 'getMulti')

        // Request both - should use cache
        const result = memoizer.getMulti([feature, feature2])

        expect(spy).not.toHaveBeenCalled()
        expect(result[feature.key]).toBeDefined()
        expect(result[feature2.key]).toBeDefined()
      })
    })

    describe('getAll()', () => {
      it('caches result', () => {
        const spy = jest.spyOn(adapter, 'getAll')

        memoizer.getAll()
        memoizer.getAll()

        expect(spy).toHaveBeenCalledTimes(1)
      })

      it('builds result from cache on subsequent calls', () => {
        const first = memoizer.getAll()
        const second = memoizer.getAll()

        expect(first).toEqual(second)
      })
    })

    describe('cache expiration', () => {
      it('expires feature cache on enable', () => {
        memoizer.get(feature)

        const spy = jest.spyOn(adapter, 'get')
        memoizer.enable(feature, gate, thing)

        // Next get should hit adapter
        memoizer.get(feature)
        expect(spy).toHaveBeenCalled()
      })

      it('expires feature cache on disable', () => {
        memoizer.get(feature)

        const spy = jest.spyOn(adapter, 'get')
        memoizer.disable(feature, gate, thing)

        // Next get should hit adapter
        memoizer.get(feature)
        expect(spy).toHaveBeenCalled()
      })

      it('expires feature cache on clear', () => {
        memoizer.get(feature)

        const spy = jest.spyOn(adapter, 'get')
        memoizer.clear(feature)

        // Next get should hit adapter
        memoizer.get(feature)
        expect(spy).toHaveBeenCalled()
      })

      it('expires features set on add', () => {
        memoizer.features()

        const spy = jest.spyOn(adapter, 'features')
        const newFeature = new Feature('new', adapter, {})
        memoizer.add(newFeature)

        // Next features() should hit adapter
        memoizer.features()
        expect(spy).toHaveBeenCalled()
      })

      it('expires features set and feature on remove', () => {
        memoizer.features()
        memoizer.get(feature)

        const featuresSpy = jest.spyOn(adapter, 'features')
        const getSpy = jest.spyOn(adapter, 'get')

        memoizer.remove(feature)

        memoizer.features()
        memoizer.get(feature)

        expect(featuresSpy).toHaveBeenCalled()
        expect(getSpy).toHaveBeenCalled()
      })
    })
  })

  describe('custom cache', () => {
    it('accepts external cache object', () => {
      const cache = {}
      const memoizer = new Memoizable(adapter, cache)

      memoizer.memoize = true
      memoizer.get(feature)

      // Cache should be populated
      expect(Object.keys(cache).length).toBeGreaterThan(0)
    })

    it('shares cache between instances', () => {
      const cache = {}
      const memoizer1 = new Memoizable(adapter, cache)
      const memoizer2 = new Memoizable(adapter, cache)

      memoizer1.memoize = true
      memoizer2.memoize = true

      // Memoizer1 fetches and caches
      memoizer1.get(feature)

      const spy = jest.spyOn(adapter, 'get')

      // Memoizer2 should use shared cache
      memoizer2.get(feature)

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('integration with Dsl', () => {
    it('reduces adapter calls during request', () => {
      memoizer.memoize = true
      const dsl = new Dsl(memoizer)

      const spy = jest.spyOn(adapter, 'get')

      // Multiple checks of same feature
      dsl.isFeatureEnabled('test_feature')
      dsl.isFeatureEnabled('test_feature')
      dsl.isFeatureEnabled('test_feature')

      // Should only hit adapter once
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })
})
