import Failover from './Failover'
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
    it('reads features from primary', async () => {
      await primary.add(feature)

      const features = await failover.features()
      expect(features).toHaveLength(1)
      expect(features[0]?.key).toBe(feature.key)
    })

    it('reads get from primary', async () => {
      await primary.add(feature)
      const primarySpy = jest.spyOn(primary, 'get')

      await failover.get(feature)

      expect(primarySpy).toHaveBeenCalled()
    })

    it('reads getMulti from primary', async () => {
      await primary.add(feature)
      const primarySpy = jest.spyOn(primary, 'getMulti')

      await failover.getMulti([feature])

      expect(primarySpy).toHaveBeenCalled()
    })

    it('reads getAll from primary', async () => {
      await primary.add(feature)
      const primarySpy = jest.spyOn(primary, 'getAll')

      await failover.getAll()

      expect(primarySpy).toHaveBeenCalled()
    })
  })

  describe('read operations with errors', () => {
    it('fails over to secondary when primary features() fails', async () => {
      jest.spyOn(primary, 'features').mockImplementation(() => {
        throw new Error('Primary failed')
      })

      await secondary.add(feature)

      const features = await failover.features()
      expect(features).toHaveLength(1)
      expect(features[0]?.key).toBe(feature.key)
    })

    it('fails over to secondary when primary get() fails', async () => {
      jest.spyOn(primary, 'get').mockImplementation(() => {
        throw new Error('Primary failed')
      })

      await secondary.add(feature)
      await secondary.enable(feature, gate, thing)

      const result = await failover.get(feature)
      expect(result).toEqual(await secondary.get(feature))
    })

    it('fails over to secondary when primary getMulti() fails', async () => {
      jest.spyOn(primary, 'getMulti').mockImplementation(() => {
        throw new Error('Primary failed')
      })

      await secondary.add(feature)

      const result = await failover.getMulti([feature])
      expect(result).toEqual(await secondary.getMulti([feature]))
    })

    it('fails over to secondary when primary getAll() fails', async () => {
      jest.spyOn(primary, 'getAll').mockImplementation(() => {
        throw new Error('Primary failed')
      })

      await secondary.add(feature)

      const result = await failover.getAll()
      expect(result).toEqual(await secondary.getAll())
    })

    it('fails over to secondary when primary export() fails', async () => {
      jest.spyOn(primary, 'export').mockImplementation(() => {
        throw new Error('Primary failed')
      })

      await secondary.add(feature)

      const result = await failover.export()
      expect(result).toBeTruthy()
    })
  })

  describe('write operations without dual write', () => {
    it('writes add to primary only', async () => {
      const primarySpy = jest.spyOn(primary, 'add')
      const secondarySpy = jest.spyOn(secondary, 'add')

      await failover.add(feature)

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).not.toHaveBeenCalled()
    })

    it('writes remove to primary only', async () => {
      await primary.add(feature)
      const primarySpy = jest.spyOn(primary, 'remove')
      const secondarySpy = jest.spyOn(secondary, 'remove')

      await failover.remove(feature)

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).not.toHaveBeenCalled()
    })

    it('writes clear to primary only', async () => {
      await primary.add(feature)
      const primarySpy = jest.spyOn(primary, 'clear')
      const secondarySpy = jest.spyOn(secondary, 'clear')

      await failover.clear(feature)

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).not.toHaveBeenCalled()
    })

    it('writes enable to primary only', async () => {
      await primary.add(feature)
      const primarySpy = jest.spyOn(primary, 'enable')
      const secondarySpy = jest.spyOn(secondary, 'enable')

      await failover.enable(feature, gate, thing)

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).not.toHaveBeenCalled()
    })

    it('writes disable to primary only', async () => {
      await primary.add(feature)
      const primarySpy = jest.spyOn(primary, 'disable')
      const secondarySpy = jest.spyOn(secondary, 'disable')

      await failover.disable(feature, gate, thing)

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).not.toHaveBeenCalled()
    })

    it('writes import to primary only', async () => {
      const primarySpy = jest.spyOn(primary, 'import')
      const secondarySpy = jest.spyOn(secondary, 'import')

      await failover.import(new Dsl(primary))

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).not.toHaveBeenCalled()
    })
  })

  describe('write operations with dual write', () => {
    beforeEach(() => {
      failover = new Failover(primary, secondary, { dualWrite: true })
    })

    it('writes add to both adapters', async () => {
      await failover.add(feature)

      const primaryFeatures = await primary.features()
      expect(primaryFeatures.map(f => f.key)).toContain(feature.key)
      const secondaryFeatures = await secondary.features()
      expect(secondaryFeatures.map(f => f.key)).toContain(feature.key)
    })

    it('writes remove to both adapters', async () => {
      await primary.add(feature)
      await secondary.add(feature)

      await failover.remove(feature)

      expect(await primary.features()).toHaveLength(0)
      expect(await secondary.features()).toHaveLength(0)
    })

    it('writes clear to both adapters', async () => {
      await primary.add(feature)
      await secondary.add(feature)

      const primarySpy = jest.spyOn(primary, 'clear')
      const secondarySpy = jest.spyOn(secondary, 'clear')

      await failover.clear(feature)

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).toHaveBeenCalled()
    })

    it('writes enable to both adapters', async () => {
      await primary.add(feature)
      await secondary.add(feature)

      const primarySpy = jest.spyOn(primary, 'enable')
      const secondarySpy = jest.spyOn(secondary, 'enable')

      await failover.enable(feature, gate, thing)

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).toHaveBeenCalled()
    })

    it('writes disable to both adapters', async () => {
      await primary.add(feature)
      await secondary.add(feature)

      const primarySpy = jest.spyOn(primary, 'disable')
      const secondarySpy = jest.spyOn(secondary, 'disable')

      await failover.disable(feature, gate, thing)

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).toHaveBeenCalled()
    })

    it('writes import to both adapters', async () => {
      const primarySpy = jest.spyOn(primary, 'import')
      const secondarySpy = jest.spyOn(secondary, 'import')

      await failover.import(new Dsl(primary))

      expect(primarySpy).toHaveBeenCalled()
      expect(secondarySpy).toHaveBeenCalled()
    })
  })

  describe('custom error types', () => {
    it('only fails over for specified error types', async () => {
      failover = new Failover(primary, secondary, { errors: [CustomError] })

      jest.spyOn(primary, 'features').mockImplementation(() => {
        throw new CustomError('Custom error')
      })

      await secondary.add(feature)

      // Should failover for CustomError
      const features = await failover.features()
      expect(features).toHaveLength(1)
      expect(features[0]?.key).toBe(feature.key)
    })

    it('does not failover for non-specified error types', async () => {
      failover = new Failover(primary, secondary, { errors: [CustomError] })

      jest.spyOn(primary, 'features').mockImplementation(() => {
        throw new Error('Regular error')
      })

      // Should throw regular error
      await expect(failover.features()).rejects.toThrow('Regular error')
    })

    it('supports multiple error types', async () => {
      class AnotherError extends Error {}

      failover = new Failover(primary, secondary, {
        errors: [CustomError, AnotherError],
      })

      // Test CustomError
      jest.spyOn(primary, 'features').mockImplementation(() => {
        throw new CustomError('Custom error')
      })
      await secondary.add(feature)
      const features1 = await failover.features()
      expect(features1).toHaveLength(1)
      expect(features1[0]?.key).toBe(feature.key)

      // Test AnotherError
      jest.spyOn(primary, 'features').mockImplementation(() => {
        throw new AnotherError('Another error')
      })
      const features2 = await failover.features()
      expect(features2).toHaveLength(1)
      expect(features2[0]?.key).toBe(feature.key)
    })
  })

  describe('default error handling', () => {
    it('fails over for any Error by default', async () => {
      jest.spyOn(primary, 'features').mockImplementation(() => {
        throw new Error('Any error')
      })

      await secondary.add(feature)

      const features = await failover.features()
      expect(features).toHaveLength(1)
      expect(features[0]?.key).toBe(feature.key)
    })

    it('fails over for custom errors by default', async () => {
      jest.spyOn(primary, 'features').mockImplementation(() => {
        throw new CustomError('Custom error')
      })

      await secondary.add(feature)

      const features = await failover.features()
      expect(features).toHaveLength(1)
      expect(features[0]?.key).toBe(feature.key)
    })
  })

  describe('readOnly', () => {
    it('delegates to primary adapter', () => {
      expect(failover.readOnly()).toBe(primary.readOnly())
    })
  })

  describe('integration scenario', () => {
    it('provides high availability for cache + database', async () => {
      // Simulate cache (fast but can fail) + database (reliable)
      const cache = new MemoryAdapter()
      const database = new MemoryAdapter()
      const ha = new Failover(cache, database, { dualWrite: true })

      // Normal operation: writes to both
      await ha.add(feature)
      const cacheFeatures = await cache.features()
      expect(cacheFeatures.map(f => f.key)).toContain(feature.key)
      const dbFeatures = await database.features()
      expect(dbFeatures.map(f => f.key)).toContain(feature.key)

      // Cache fails: reads from database
      jest.spyOn(cache, 'get').mockImplementation(() => {
        throw new Error('Cache unavailable')
      })

      await database.enable(feature, gate, thing)
      const result = await ha.get(feature)
      expect(result).toEqual(await database.get(feature))
    })
  })

  describe('write order', () => {
    it('writes to primary first', async () => {
      const order: string[] = []

      const primarySpy = jest.spyOn(primary, 'add').mockImplementation(async () => {
        order.push('primary')
        return await Promise.resolve(true)
      })

      const secondarySpy = jest.spyOn(secondary, 'add').mockImplementation(async () => {
        order.push('secondary')
        return await Promise.resolve(true)
      })

      failover = new Failover(primary, secondary, { dualWrite: true })
      await failover.add(feature)

      expect(order).toEqual(['primary', 'secondary'])

      primarySpy.mockRestore()
      secondarySpy.mockRestore()
    })
  })
})
