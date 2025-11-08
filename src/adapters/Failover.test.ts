import Failover from './Failover'
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

describe('Failover', () => {
  let primary: MemoryAdapter
  let secondary: MemoryAdapter
  let failover: Failover
  let feature: Feature
  let gate: BooleanGate
  let thing: BooleanType

  beforeEach(() => {
    primary = new MemoryAdapter()
    secondary = new MemoryAdapter()
    failover = new Failover(primary, secondary)
    const dsl = new Dsl(primary)
    feature = dsl.feature('test_feature')
    gate = new BooleanGate()
    thing = new BooleanType(true)
  })

  describe('name', () => {
    it('returns primary adapter name', () => {
      expect(failover.name).toBe('memory')
    })
  })

  describe('read operations without errors', () => {
    it('reads features from primary', () => {
      primary.add(feature)

      expect(failover.features()).toEqual([feature])
    })

    it('reads get from primary', () => {
      primary.add(feature)
      const primarySpy = jest.spyOn(primary, 'get')

      failover.get(feature)

      expect(primarySpy).toHaveBeenCalled()
    })

    it('reads getMulti from primary', () => {
      primary.add(feature)
      const primarySpy = jest.spyOn(primary, 'getMulti')

      failover.getMulti([feature])

      expect(primarySpy).toHaveBeenCalled()
    })

    it('reads getAll from primary', () => {
      primary.add(feature)
      const primarySpy = jest.spyOn(primary, 'getAll')

      failover.getAll()

      expect(primarySpy).toHaveBeenCalled()
    })
  })

  describe('read operations with errors', () => {
    it('fails over to secondary when primary features() fails', () => {
      jest.spyOn(primary, 'features').mockImplementation(() => {
        throw new Error('Primary failed')
      })

      secondary.add(feature)

      expect(failover.features()).toEqual([feature])
    })

    it('fails over to secondary when primary get() fails', () => {
      jest.spyOn(primary, 'get').mockImplementation(() => {
        throw new Error('Primary failed')
      })

      secondary.add(feature)
      secondary.enable(feature, gate, thing)

      const result = failover.get(feature)
      expect(result).toEqual(secondary.get(feature))
    })

    it('fails over to secondary when primary getMulti() fails', () => {
      jest.spyOn(primary, 'getMulti').mockImplementation(() => {
        throw new Error('Primary failed')
      })

      secondary.add(feature)

      const result = failover.getMulti([feature])
      expect(result).toEqual(secondary.getMulti([feature]))
    })

    it('fails over to secondary when primary getAll() fails', () => {
      jest.spyOn(primary, 'getAll').mockImplementation(() => {
        throw new Error('Primary failed')
      })

      secondary.add(feature)

      const result = failover.getAll()
      expect(result).toEqual(secondary.getAll())
    })

    it('fails over to secondary when primary export() fails', () => {
      jest.spyOn(primary, 'export').mockImplementation(() => {
        throw new Error('Primary failed')
      })

      secondary.add(feature)

      const result = failover.export()
      expect(result).toBeTruthy()
    })
  })

  describe('write operations without dual write', () => {
    it('writes add to primary only', () => {
      const primarySpy = jest.spyOn(primary, 'add')
      const secondarySpy = jest.spyOn(secondary, 'add')

      failover.add(feature)

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).not.toHaveBeenCalled()
    })

    it('writes remove to primary only', () => {
      primary.add(feature)
      const primarySpy = jest.spyOn(primary, 'remove')
      const secondarySpy = jest.spyOn(secondary, 'remove')

      failover.remove(feature)

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).not.toHaveBeenCalled()
    })

    it('writes clear to primary only', () => {
      primary.add(feature)
      const primarySpy = jest.spyOn(primary, 'clear')
      const secondarySpy = jest.spyOn(secondary, 'clear')

      failover.clear(feature)

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).not.toHaveBeenCalled()
    })

    it('writes enable to primary only', () => {
      primary.add(feature)
      const primarySpy = jest.spyOn(primary, 'enable')
      const secondarySpy = jest.spyOn(secondary, 'enable')

      failover.enable(feature, gate, thing)

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).not.toHaveBeenCalled()
    })

    it('writes disable to primary only', () => {
      primary.add(feature)
      const primarySpy = jest.spyOn(primary, 'disable')
      const secondarySpy = jest.spyOn(secondary, 'disable')

      failover.disable(feature, gate, thing)

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).not.toHaveBeenCalled()
    })

    it('writes import to primary only', () => {
      const primarySpy = jest.spyOn(primary, 'import')
      const secondarySpy = jest.spyOn(secondary, 'import')

      failover.import(new Dsl(primary))

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).not.toHaveBeenCalled()
    })
  })

  describe('write operations with dual write', () => {
    beforeEach(() => {
      failover = new Failover(primary, secondary, { dualWrite: true })
    })

    it('writes add to both adapters', () => {
      failover.add(feature)

      expect(primary.features()).toContainEqual(feature)
      expect(secondary.features()).toContainEqual(feature)
    })

    it('writes remove to both adapters', () => {
      primary.add(feature)
      secondary.add(feature)

      failover.remove(feature)

      expect(primary.features()).toHaveLength(0)
      expect(secondary.features()).toHaveLength(0)
    })

    it('writes clear to both adapters', () => {
      primary.add(feature)
      secondary.add(feature)

      const primarySpy = jest.spyOn(primary, 'clear')
      const secondarySpy = jest.spyOn(secondary, 'clear')

      failover.clear(feature)

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).toHaveBeenCalled()
    })

    it('writes enable to both adapters', () => {
      primary.add(feature)
      secondary.add(feature)

      const primarySpy = jest.spyOn(primary, 'enable')
      const secondarySpy = jest.spyOn(secondary, 'enable')

      failover.enable(feature, gate, thing)

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).toHaveBeenCalled()
    })

    it('writes disable to both adapters', () => {
      primary.add(feature)
      secondary.add(feature)

      const primarySpy = jest.spyOn(primary, 'disable')
      const secondarySpy = jest.spyOn(secondary, 'disable')

      failover.disable(feature, gate, thing)

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).toHaveBeenCalled()
    })

    it('writes import to both adapters', () => {
      const primarySpy = jest.spyOn(primary, 'import')
      const secondarySpy = jest.spyOn(secondary, 'import')

      failover.import(new Dsl(primary))

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).toHaveBeenCalled()
    })
  })

  describe('custom error types', () => {
    it('only fails over for specified error types', () => {
      failover = new Failover(primary, secondary, { errors: [CustomError] })

      jest.spyOn(primary, 'features').mockImplementation(() => {
        throw new CustomError('Custom error')
      })

      secondary.add(feature)

      // Should failover for CustomError
      expect(failover.features()).toEqual([feature])
    })

    it('does not failover for non-specified error types', () => {
      failover = new Failover(primary, secondary, { errors: [CustomError] })

      jest.spyOn(primary, 'features').mockImplementation(() => {
        throw new Error('Regular error')
      })

      // Should throw regular error
      expect(() => failover.features()).toThrow('Regular error')
    })

    it('supports multiple error types', () => {
      class AnotherError extends Error {}

      failover = new Failover(primary, secondary, {
        errors: [CustomError, AnotherError],
      })

      // Test CustomError
      jest.spyOn(primary, 'features').mockImplementation(() => {
        throw new CustomError('Custom error')
      })
      secondary.add(feature)
      expect(failover.features()).toEqual([feature])

      // Test AnotherError
      jest.spyOn(primary, 'features').mockImplementation(() => {
        throw new AnotherError('Another error')
      })
      expect(failover.features()).toEqual([feature])
    })
  })

  describe('default error handling', () => {
    it('fails over for any Error by default', () => {
      jest.spyOn(primary, 'features').mockImplementation(() => {
        throw new Error('Any error')
      })

      secondary.add(feature)

      expect(failover.features()).toEqual([feature])
    })

    it('fails over for custom errors by default', () => {
      jest.spyOn(primary, 'features').mockImplementation(() => {
        throw new CustomError('Custom error')
      })

      secondary.add(feature)

      expect(failover.features()).toEqual([feature])
    })
  })

  describe('readOnly', () => {
    it('delegates to primary adapter', () => {
      expect(failover.readOnly()).toBe(primary.readOnly())
    })
  })

  describe('integration scenario', () => {
    it('provides high availability for cache + database', () => {
      // Simulate cache (fast but can fail) + database (reliable)
      const cache = new MemoryAdapter()
      const database = new MemoryAdapter()
      const ha = new Failover(cache, database, { dualWrite: true })

      // Normal operation: writes to both
      ha.add(feature)
      expect(cache.features()).toContainEqual(feature)
      expect(database.features()).toContainEqual(feature)

      // Cache fails: reads from database
      jest.spyOn(cache, 'get').mockImplementation(() => {
        throw new Error('Cache unavailable')
      })

      database.enable(feature, gate, thing)
      const result = ha.get(feature)
      expect(result).toEqual(database.get(feature))
    })
  })

  describe('write order', () => {
    it('writes to primary first', () => {
      const order: string[] = []

      const primarySpy = jest.spyOn(primary, 'add').mockImplementation(() => {
        order.push('primary')
        return true
      })

      const secondarySpy = jest.spyOn(secondary, 'add').mockImplementation(() => {
        order.push('secondary')
        return true
      })

      failover = new Failover(primary, secondary, { dualWrite: true })
      failover.add(feature)

      expect(order).toEqual(['primary', 'secondary'])

      primarySpy.mockRestore()
      secondarySpy.mockRestore()
    })
  })
})
