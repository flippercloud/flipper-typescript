import { jest, describe, it, beforeEach, afterEach, expect } from '@jest/globals'
import RedisMock from 'ioredis-mock'
import { Flipper, Feature, MemoryAdapter } from '@flippercloud/flipper'
import RedisAdapter from './RedisAdapter'

describe('RedisAdapter', () => {
  let redis: any
  let adapter: RedisAdapter
  let flipper: Flipper
  let feature: Feature

  beforeEach(async () => {
    // Use ioredis-mock for testing
    redis = new RedisMock()
    adapter = new RedisAdapter({ client: redis })
    flipper = new Flipper(adapter)
    feature = flipper.feature('test_feature')
  })

  afterEach(async () => {
    // Clear Redis
    await redis.flushall()
    redis.disconnect()
  })

  describe('name', () => {
    it('returns redis', () => {
      expect(adapter.name).toBe('redis')
    })
  })

  describe('features', () => {
    it('returns empty array initially', async () => {
      const features = await adapter.features()
      expect(features).toEqual([])
    })

    it('returns all feature keys', async () => {
      await flipper.enable('feature1')
      await flipper.enable('feature2')
      const features = await adapter.features()
      const keys = features.map(f => f.key).sort()
      expect(keys).toEqual(['feature1', 'feature2'])
    })
  })

  describe('add', () => {
    it('adds feature to features set', async () => {
      const result = await adapter.add(feature)
      expect(result).toBe(true)
      const features = await adapter.features()
      expect(features.map(f => f.key)).toContain('test_feature')
    })

    it('is idempotent', async () => {
      await adapter.add(feature)
      await adapter.add(feature)
      const features = await adapter.features()
      expect(features.length).toBe(1)
    })
  })

  describe('remove', () => {
    it('removes feature from features set', async () => {
      await adapter.add(feature)
      const result = await adapter.remove(feature)
      expect(result).toBe(true)
      const features = await adapter.features()
      expect(features.map(f => f.key)).not.toContain('test_feature')
    })

    it('deletes all feature data', async () => {
      await flipper.enable('test_feature')
      await adapter.remove(feature)
      const data = await adapter.get(feature)
      expect(data.boolean).toBeNull()
    })
  })

  describe('clear', () => {
    it('clears all gate values', async () => {
      await flipper.enable('test_feature')
      await adapter.clear(feature)
      const data = await adapter.get(feature)
      expect(data.boolean).toBeNull()
    })
  })

  describe('get', () => {
    it('returns default values for new feature', async () => {
      const data = await adapter.get(feature)
      expect(data.boolean).toBeNull()
      expect(data.actors).toEqual(new Set())
      expect(data.groups).toEqual(new Set())
          expect(data.percentageOfActors).toBeNull()
          expect(data.percentageOfTime).toBeNull()
    })

    it('returns boolean gate value', async () => {
      await flipper.enable('test_feature')
      const data = await adapter.get(feature)
      expect(data.boolean).toBe('true')
    })

    it('returns integer gate values', async () => {
      await flipper.enablePercentageOfTime('test_feature', 25)
      const data = await adapter.get(feature)
          expect(data.percentageOfTime).toBe('25')
    })

    it('returns set gate values', async () => {
      const actor = { flipperId: 'User:1' }
      await flipper.enableActor('test_feature', actor)
      await flipper.enableActor('test_feature', { flipperId: 'User:2' })
      const data = await adapter.get(feature)
      expect(data.actors).toEqual(new Set(['User:1', 'User:2']))
    })
  })

  describe('getMulti', () => {
    it('returns data for multiple features', async () => {
      const feature1 = flipper.feature('feature1')
      const feature2 = flipper.feature('feature2')
      await flipper.enable('feature1')
      await flipper.enablePercentageOfTime('feature2', 50)

      const data = await adapter.getMulti([feature1, feature2])
      expect(data.feature1?.boolean).toBe('true')
          expect(data.feature2?.percentageOfTime).toBe('50')
    })

    it('uses pipelining for efficiency', async () => {
      const pipelineSpy = jest.spyOn(redis, 'pipeline')
      const features = [
        flipper.feature('f1'),
        flipper.feature('f2'),
        flipper.feature('f3'),
      ]
      await adapter.getMulti(features)
      expect(pipelineSpy).toHaveBeenCalled()
    })
  })

  describe('getAll', () => {
    it('returns all features data', async () => {
      await flipper.enable('feature1')
      await flipper.enablePercentageOfTime('feature2', 75)

      const data = await adapter.getAll()
      expect(Object.keys(data).sort()).toEqual(['feature1', 'feature2'])
      expect(data.feature1?.boolean).toBe('true')
          expect(data.feature2?.percentageOfTime).toBe('75')
    })
  })

  describe('enable', () => {
    it('enables boolean gate', async () => {
      await flipper.enable('test_feature')
      const data = await adapter.get(feature)
      expect(data.boolean).toBe('true')
    })

    it('enables percentage of time gate', async () => {
      await flipper.enablePercentageOfTime('test_feature', 30)
      const data = await adapter.get(feature)
          expect(data.percentageOfTime).toBe('30')
    })

    it('enables actor gate', async () => {
      const actor = { flipperId: 'User:123' }
      await flipper.enableActor('test_feature', actor)
      const data = await adapter.get(feature)
      expect(data.actors).toEqual(new Set(['User:123']))
    })

    it('enables multiple actors', async () => {
      await flipper.enableActor('test_feature', { flipperId: 'User:1' })
      await flipper.enableActor('test_feature', { flipperId: 'User:2' })
      const data = await adapter.get(feature)
      expect(data.actors).toEqual(new Set(['User:1', 'User:2']))
    })

    it('clears other gates when enabling boolean', async () => {
      await flipper.enablePercentageOfTime('test_feature', 50)
      await flipper.enable('test_feature')
      const data = await adapter.get(feature)
      expect(data.boolean).toBe('true')
          expect(data.percentageOfTime).toBeNull()
    })
  })

  describe('disable', () => {
    it('disables boolean gate', async () => {
      await flipper.enable('test_feature')
      await flipper.disable('test_feature')
      const data = await adapter.get(feature)
      expect(data.boolean).toBeNull()
    })

    it('disables percentage of time gate', async () => {
      await flipper.enablePercentageOfTime('test_feature', 30)
      await flipper.disablePercentageOfTime('test_feature')
      const data = await adapter.get(feature)
          expect(data.percentageOfTime).toBe('0')
    })

    it('disables actor gate', async () => {
      const actor = { flipperId: 'User:123' }
      await flipper.enableActor('test_feature', actor)
      await flipper.disableActor('test_feature', actor)
      const data = await adapter.get(feature)
      expect(data.actors).toEqual(new Set())
    })

    it('removes specific actor', async () => {
      await flipper.enableActor('test_feature', { flipperId: 'User:1' })
      await flipper.enableActor('test_feature', { flipperId: 'User:2' })
      await flipper.disableActor('test_feature', { flipperId: 'User:1' })
      const data = await adapter.get(feature)
      expect(data.actors).toEqual(new Set(['User:2']))
    })
  })

  describe('keyPrefix', () => {
    it('uses custom key prefix', async () => {
      const prefixedRedis = new RedisMock()
      const prefixedAdapter = new RedisAdapter({
        client: prefixedRedis,
        keyPrefix: 'myapp:'
      })
      const prefixedFlipper = new Flipper(prefixedAdapter)

      await prefixedFlipper.enable('test')
      const keys = await prefixedRedis.keys('*')
      expect(keys).toContain('myapp:flipper_features')
      expect(keys).toContain('myapp:test')

      prefixedRedis.disconnect()
    })
  })

  describe('readOnly', () => {
    it('returns false by default', () => {
      expect(adapter.readOnly()).toBe(false)
    })

    it('returns true when read-only', () => {
      const readOnlyAdapter = new RedisAdapter({
        client: redis,
        readOnly: true
      })
      expect(readOnlyAdapter.readOnly()).toBe(true)
    })

    it('throws on write operations when read-only', async () => {
      const readOnlyAdapter = new RedisAdapter({
        client: redis,
        readOnly: true
      })
      const readOnlyFlipper = new Flipper(readOnlyAdapter)
      const readOnlyFeature = readOnlyFlipper.feature('test')

      await expect(readOnlyAdapter.add(readOnlyFeature)).rejects.toThrow('write attempted')
    })
  })

  describe('export', () => {
    it('exports features to json format', async () => {
      await flipper.enable('feature1')
      await flipper.enablePercentageOfTime('feature2', 50)

      const exported = await adapter.export()
      expect(exported.format).toBe('json')
      expect(exported.version).toBe(1)
      const features = exported.features()
      expect(Object.keys(features).sort()).toEqual(['feature1', 'feature2'])
    })
  })

  describe('import', () => {
    it('imports from another adapter', async () => {

      const sourceAdapter = new MemoryAdapter()
      const sourceFlipper = new Flipper(sourceAdapter)

      await sourceFlipper.enable('imported_feature')
      await sourceFlipper.enablePercentageOfTime('percentage_feature', 25)

      await adapter.import(sourceAdapter)

      const data = await adapter.get(flipper.feature('imported_feature'))
      expect(data.boolean).toBe('true')
      const percentageData = await adapter.get(flipper.feature('percentage_feature'))
          expect(percentageData.percentageOfTime).toBe('25')
    })

    it('throws when importing to read-only adapter', async () => {
      const readOnlyAdapter = new RedisAdapter({
        client: redis,
        readOnly: true
      })
      const sourceAdapter = new MemoryAdapter()

      await expect(readOnlyAdapter.import(sourceAdapter)).rejects.toThrow('write attempted')
    })
  })

  describe('Redis compatibility', () => {
    it('stores data compatible with Ruby adapter format', async () => {
      await flipper.enable('test_feature')

      // Check raw Redis data structure
      const isMember = await redis.sismember('flipper_features', 'test_feature')
      expect(isMember).toBe(1)

      const booleanValue = await redis.hget('test_feature', 'boolean')
      expect(booleanValue).toBe('true')
    })

    it('stores set values with gate/value format', async () => {
      await flipper.enableActor('test_feature', { flipperId: 'User:123' })

      const field = await redis.hget('test_feature', 'actors/User:123')
      expect(field).toBe('1')
    })
  })
})
