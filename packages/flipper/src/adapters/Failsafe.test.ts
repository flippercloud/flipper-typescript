import Failsafe from './Failsafe'
import MemoryAdapter from '../MemoryAdapter'
import Feature from '../Feature'
import Dsl from '../Dsl'
import BooleanGate from '../BooleanGate'
import BooleanType from '../BooleanType'
import { jest } from '@jest/globals'

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
    it('passes through features() when successful', () => {
      adapter.add(feature)

      expect(failsafe.features()).toEqual([feature])
    })

    it('passes through get() when successful', () => {
      adapter.add(feature)
      adapter.enable(feature, gate, thing)

      const result = failsafe.get(feature)
      expect(result).toEqual(adapter.get(feature))
    })

    it('passes through getMulti() when successful', () => {
      adapter.add(feature)

      const result = failsafe.getMulti([feature])
      expect(result).toEqual(adapter.getMulti([feature]))
    })

    it('passes through getAll() when successful', () => {
      adapter.add(feature)

      const result = failsafe.getAll()
      expect(result).toEqual(adapter.getAll())
    })

    it('passes through add() when successful', () => {
      const result = failsafe.add(feature)
      expect(result).toBe(true)
      expect(adapter.features()).toContainEqual(feature)
    })

    it('passes through remove() when successful', () => {
      adapter.add(feature)

      const result = failsafe.remove(feature)
      expect(result).toBe(true)
      expect(adapter.features()).toHaveLength(0)
    })

    it('passes through clear() when successful', () => {
      adapter.add(feature)

      const result = failsafe.clear(feature)
      expect(result).toBe(true)
    })

    it('passes through enable() when successful', () => {
      adapter.add(feature)

      const result = failsafe.enable(feature, gate, thing)
      expect(result).toBe(true)
    })

    it('passes through disable() when successful', () => {
      adapter.add(feature)

      const result = failsafe.disable(feature, gate, thing)
      expect(result).toBe(true)
    })

    it('passes through export() when successful', () => {
      adapter.add(feature)

      const result = failsafe.export()
      expect(result).toBeTruthy()
    })

    it('passes through import() when successful', () => {
      const result = failsafe.import(new Dsl(adapter))
      expect(result).toBe(true)
    })
  })

  describe('failed operations', () => {
    describe('features()', () => {
      it('returns empty array on error', () => {
        jest.spyOn(adapter, 'features').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(failsafe.features()).toEqual([])
      })
    })

    describe('get()', () => {
      it('returns empty object on error', () => {
        jest.spyOn(adapter, 'get').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(failsafe.get(feature)).toEqual({})
      })
    })

    describe('getMulti()', () => {
      it('returns empty object on error', () => {
        jest.spyOn(adapter, 'getMulti').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(failsafe.getMulti([feature])).toEqual({})
      })
    })

    describe('getAll()', () => {
      it('returns empty object on error', () => {
        jest.spyOn(adapter, 'getAll').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(failsafe.getAll()).toEqual({})
      })
    })

    describe('add()', () => {
      it('returns false on error', () => {
        jest.spyOn(adapter, 'add').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(failsafe.add(feature)).toBe(false)
      })
    })

    describe('remove()', () => {
      it('returns false on error', () => {
        jest.spyOn(adapter, 'remove').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(failsafe.remove(feature)).toBe(false)
      })
    })

    describe('clear()', () => {
      it('returns false on error', () => {
        jest.spyOn(adapter, 'clear').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(failsafe.clear(feature)).toBe(false)
      })
    })

    describe('enable()', () => {
      it('returns false on error', () => {
        jest.spyOn(adapter, 'enable').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(failsafe.enable(feature, gate, thing)).toBe(false)
      })
    })

    describe('disable()', () => {
      it('returns false on error', () => {
        jest.spyOn(adapter, 'disable').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(failsafe.disable(feature, gate, thing)).toBe(false)
      })
    })

    describe('export()', () => {
      it('returns empty export on error', () => {
        jest.spyOn(adapter, 'export').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        const result = failsafe.export()
        expect(result).toBeTruthy()
        expect(result.features()).toEqual({})
      })
    })

    describe('import()', () => {
      it('returns false on error', () => {
        jest.spyOn(adapter, 'import').mockImplementation(() => {
          throw new Error('Adapter failed')
        })

        expect(failsafe.import(new Dsl(adapter))).toBe(false)
      })
    })
  })

  describe('custom error types', () => {
    it('only catches specified error types', () => {
      failsafe = new Failsafe(adapter, { errors: [CustomError] })

      jest.spyOn(adapter, 'features').mockImplementation(() => {
        throw new CustomError('Custom error')
      })

      // Should catch CustomError
      expect(failsafe.features()).toEqual([])
    })

    it('does not catch non-specified error types', () => {
      failsafe = new Failsafe(adapter, { errors: [CustomError] })

      jest.spyOn(adapter, 'features').mockImplementation(() => {
        throw new Error('Regular error')
      })

      // Should throw regular error
      expect(() => failsafe.features()).toThrow('Regular error')
    })

    it('supports multiple error types', () => {
      class AnotherError extends Error {}

      failsafe = new Failsafe(adapter, {
        errors: [CustomError, AnotherError],
      })

      // Test CustomError
      jest.spyOn(adapter, 'features').mockImplementation(() => {
        throw new CustomError('Custom error')
      })
      expect(failsafe.features()).toEqual([])

      // Test AnotherError
      jest.spyOn(adapter, 'features').mockImplementation(() => {
        throw new AnotherError('Another error')
      })
      expect(failsafe.features()).toEqual([])
    })
  })

  describe('default error handling', () => {
    it('catches any Error by default', () => {
      jest.spyOn(adapter, 'features').mockImplementation(() => {
        throw new Error('Any error')
      })

      expect(failsafe.features()).toEqual([])
    })

    it('catches custom errors by default', () => {
      jest.spyOn(adapter, 'features').mockImplementation(() => {
        throw new CustomError('Custom error')
      })

      expect(failsafe.features()).toEqual([])
    })
  })

  describe('readOnly', () => {
    it('delegates to wrapped adapter', () => {
      expect(failsafe.readOnly()).toBe(adapter.readOnly())
    })
  })

  describe('fail closed behavior', () => {
    it('disables all features when adapter fails', () => {
      const dsl = new Dsl(failsafe)

      // Add feature normally
      dsl.add('new_feature')
      dsl.enable('new_feature')

      // Verify it's enabled
      expect(dsl.isFeatureEnabled('new_feature')).toBe(true)

      // Simulate adapter failure
      jest.spyOn(adapter, 'get').mockImplementation(() => {
        throw new Error('Adapter failed')
      })

      // Feature should now be disabled (fail closed)
      expect(dsl.isFeatureEnabled('new_feature')).toBe(false)
    })

    it('returns safe defaults for all operations', () => {
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
      expect(failsafe.features()).toEqual([])
      expect(failsafe.get(feature)).toEqual({})
      expect(failsafe.getAll()).toEqual({})

      // Feature checks should return false
      expect(dsl.isFeatureEnabled('any_feature')).toBe(false)
    })
  })

  describe('integration scenario', () => {
    it('allows application to continue when storage fails', () => {
      const dsl = new Dsl(failsafe)

      // Setup features normally
      dsl.add('feature1')
      dsl.add('feature2')
      dsl.enable('feature1')

      // Verify normal operation
      expect(dsl.isFeatureEnabled('feature1')).toBe(true)
      expect(dsl.isFeatureEnabled('feature2')).toBe(false)

      // Storage becomes unavailable
      jest.spyOn(adapter, 'get').mockImplementation(() => {
        throw new Error('Redis connection lost')
      })
      jest.spyOn(adapter, 'enable').mockImplementation(() => {
        throw new Error('Redis connection lost')
      })

      // Application continues, all features disabled
      expect(dsl.isFeatureEnabled('feature1')).toBe(false)
      expect(dsl.isFeatureEnabled('feature2')).toBe(false)

      // Write operations fail gracefully
      expect(() => dsl.enable('feature1')).not.toThrow()
      expect(() => dsl.disable('feature1')).not.toThrow()
    })
  })

  describe('non-Error throws', () => {
    it('does not catch non-Error throws', () => {
      jest.spyOn(adapter, 'features').mockImplementation(() => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw 'string error'
      })

      expect(() => failsafe.features()).toThrow('string error')
    })
  })
})
