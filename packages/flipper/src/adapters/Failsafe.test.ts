import Failsafe from './Failsafe'
import MemoryAdapter from '../MemoryAdapter'
import Feature from '../Feature'
import Dsl from '../Dsl'
import BooleanGate from '../BooleanGate'
import BooleanType from '../BooleanType'
import { jest, describe, it, beforeEach, expect } from '@jest/globals'

class CustomError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CustomError'
  }
}

describe('Failsafe', () => {
  let adapter: MemoryAdapter
  let failsafe: Failsafe
  let feature: Feature
  let gate: BooleanGate
  let thing: BooleanType

  beforeEach(() => {
    adapter = new MemoryAdapter()
    failsafe = new Failsafe(adapter)
    const dsl = new Dsl(adapter)
    feature = dsl.feature('test_feature')
    gate = new BooleanGate()
    thing = new BooleanType(true)
  })

  describe('name', () => {
    it('returns wrapped adapter name', () => {
      expect(failsafe.name).toBe('memory')
    })
  })

  describe('successful operations', () => {
    it('passes through features() when successful', async () => {
      await adapter.add(feature)

      expect(await failsafe.features()).toEqual([feature])
    })

    it('passes through get() when successful', async () => {
      await adapter.add(feature)
      await adapter.enable(feature, gate, thing)

      const result = await failsafe.get(feature)
      expect(result).toEqual(await adapter.get(feature))
    })

    it('passes through getMulti() when successful', async () => {
      await adapter.add(feature)

      const result = await failsafe.getMulti([feature])
      expect(result).toEqual(await adapter.getMulti([feature]))
    })

    it('passes through getAll() when successful', async () => {
      await adapter.add(feature)

      const result = await failsafe.getAll()
      expect(result).toEqual(await adapter.getAll())
    })

    it('passes through add() when successful', async () => {
      const result = await failsafe.add(feature)
      expect(result).toBe(true)
      expect(await adapter.features()).toContainEqual(feature)
    })

    it('passes through remove() when successful', async () => {
      await adapter.add(feature)

      const result = await failsafe.remove(feature)
      expect(result).toBe(true)
      expect(await adapter.features()).toHaveLength(0)
    })

    it('passes through clear() when successful', async () => {
      await adapter.add(feature)

      const result = await failsafe.clear(feature)
      expect(result).toBe(true)
    })

    it('passes through enable() when successful', async () => {
      await adapter.add(feature)

      const result = await failsafe.enable(feature, gate, thing)
      expect(result).toBe(true)
    })

    it('passes through disable() when successful', async () => {
      await adapter.add(feature)

      const result = await failsafe.disable(feature, gate, thing)
      expect(result).toBe(true)
    })

    it('passes through export() when successful', async () => {
      await adapter.add(feature)

      const result = await failsafe.export()
      expect(result).toBeTruthy()
    })

    it('passes through import() when successful', async () => {
      const result = await failsafe.import(new Dsl(adapter))
      expect(result).toBe(true)
    })
  })

  describe('failed operations', () => {
    describe('features()', () => {
      it('returns empty array on error', async () => {
        jest.spyOn(adapter, 'features').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(await failsafe.features()).toEqual([])
      })
    })

    describe('get()', () => {
      it('returns empty object on error', async () => {
        jest.spyOn(adapter, 'get').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(await failsafe.get(feature)).toEqual({})
      })
    })

    describe('getMulti()', () => {
      it('returns empty object on error', async () => {
        jest.spyOn(adapter, 'getMulti').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(await failsafe.getMulti([feature])).toEqual({})
      })
    })

    describe('getAll()', () => {
      it('returns empty object on error', async () => {
        jest.spyOn(adapter, 'getAll').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(await failsafe.getAll()).toEqual({})
      })
    })

    describe('add()', () => {
      it('returns false on error', async () => {
        jest.spyOn(adapter, 'add').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(await failsafe.add(feature)).toBe(false)
      })
    })

    describe('remove()', () => {
      it('returns false on error', async () => {
        jest.spyOn(adapter, 'remove').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(await failsafe.remove(feature)).toBe(false)
      })
    })

    describe('clear()', () => {
      it('returns false on error', async () => {
        jest.spyOn(adapter, 'clear').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(await failsafe.clear(feature)).toBe(false)
      })
    })

    describe('enable()', () => {
      it('returns false on error', async () => {
        jest.spyOn(adapter, 'enable').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(await failsafe.enable(feature, gate, thing)).toBe(false)
      })
    })

    describe('disable()', () => {
      it('returns false on error', async () => {
        jest.spyOn(adapter, 'disable').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(await failsafe.disable(feature, gate, thing)).toBe(false)
      })
    })

    describe('export()', () => {
      it('returns empty export on error', async () => {
        jest.spyOn(adapter, 'export').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        const result = await failsafe.export()
        expect(result).toBeTruthy()
        expect(result.features()).toEqual({})
      })
    })

    describe('import()', () => {
      it('returns false on error', async () => {
        jest.spyOn(adapter, 'import').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(await failsafe.import(new Dsl(adapter))).toBe(false)
      })
    })
  })

  describe('custom error types', () => {
    it('only catches specified error types', async () => {
      failsafe = new Failsafe(adapter, { errors: [CustomError] })

      jest.spyOn(adapter, 'features').mockImplementation(() => {
        throw new CustomError('Custom error')
      })

      // Should catch CustomError
      expect(await failsafe.features()).toEqual([])
    })

    it('does not catch non-specified error types', async () => {
      failsafe = new Failsafe(adapter, { errors: [CustomError] })

      jest.spyOn(adapter, 'features').mockImplementation(() => {
        throw new Error('Regular error')
      })

      // Should throw regular error
      await expect(failsafe.features()).rejects.toThrow('Regular error')
    })

    it('supports multiple error types', async () => {
      class AnotherError extends Error {}

      failsafe = new Failsafe(adapter, {
        errors: [CustomError, AnotherError],
      })

      // Test CustomError
      jest.spyOn(adapter, 'features').mockImplementation(() => {
        throw new CustomError('Custom error')
      })
      expect(await failsafe.features()).toEqual([])

      // Test AnotherError
      jest.spyOn(adapter, 'features').mockImplementation(() => {
        throw new AnotherError('Another error')
      })
      expect(await failsafe.features()).toEqual([])
    })
  })

  describe('default error handling', () => {
    it('catches any Error by default', async () => {
      jest.spyOn(adapter, 'features').mockImplementation(() => {
        throw new Error('Any error')
      })

      expect(await failsafe.features()).toEqual([])
    })

    it('catches custom errors by default', async () => {
      jest.spyOn(adapter, 'features').mockImplementation(() => {
        throw new CustomError('Custom error')
      })

      expect(await failsafe.features()).toEqual([])
    })
  })

  describe('readOnly', () => {
    it('delegates to wrapped adapter', () => {
      expect(failsafe.readOnly()).toBe(adapter.readOnly())
    })
  })

  describe('fail closed behavior', () => {
    it('disables all features when adapter fails', async () => {
      const dsl = new Dsl(failsafe)

      // Add feature normally
      await dsl.add('new_feature')
      await dsl.enable('new_feature')

      // Verify it's enabled
      expect(await dsl.isFeatureEnabled('new_feature')).toBe(true)

      // Simulate adapter failure
      jest.spyOn(adapter, 'get').mockImplementation(() => {
        throw new Error('Adapter failed')
      })

      // Feature should now be disabled (fail closed)
      expect(await dsl.isFeatureEnabled('new_feature')).toBe(false)
    })

    it('returns safe defaults for all operations', async () => {
      // Simulate complete adapter failure
      jest.spyOn(adapter, 'features').mockImplementation(() => {
        throw new Error('Adapter failed')
      })
      jest.spyOn(adapter, 'get').mockImplementation(() => {
        throw new Error('Adapter failed')
      })
      jest.spyOn(adapter, 'getAll').mockImplementation(() => {
        throw new Error('Adapter failed')
      })

      const dsl = new Dsl(failsafe)

      // All operations should return safe defaults
      expect(await failsafe.features()).toEqual([])
      expect(await failsafe.get(feature)).toEqual({})
      expect(await failsafe.getAll()).toEqual({})

      // Feature checks should return false
      expect(await dsl.isFeatureEnabled('any_feature')).toBe(false)
    })
  })

  describe('integration scenario', () => {
    it('allows application to continue when storage fails', async () => {
      const dsl = new Dsl(failsafe)

      // Setup features normally
      await dsl.add('feature1')
      await dsl.add('feature2')
      await dsl.enable('feature1')

      // Verify normal operation
      expect(await dsl.isFeatureEnabled('feature1')).toBe(true)
      expect(await dsl.isFeatureEnabled('feature2')).toBe(false)

      // Storage becomes unavailable
      jest.spyOn(adapter, 'get').mockImplementation(() => {
        throw new Error('Redis connection lost')
      })
      jest.spyOn(adapter, 'enable').mockImplementation(() => {
        throw new Error('Redis connection lost')
      })

      // Application continues, all features disabled
      expect(await dsl.isFeatureEnabled('feature1')).toBe(false)
      expect(await dsl.isFeatureEnabled('feature2')).toBe(false)

      // Write operations fail gracefully - DSL methods don't throw
      const result1 = await dsl.enable('feature1')
      expect(result1).toBe(true) // DSL.enable always returns true, it doesn't propagate adapter failures

      // But the underlying adapter call returned false due to failsafe catching the error
      const adapterResult = await failsafe.enable(feature, gate, thing)
      expect(adapterResult).toBe(false)
    })
  })

  describe('non-Error throws', () => {
    it('does not catch non-Error throws', async () => {
      jest.spyOn(adapter, 'features').mockImplementation(() => {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject('string error')
      })

      await expect(failsafe.features()).rejects.toBe('string error')
    })
  })
})
