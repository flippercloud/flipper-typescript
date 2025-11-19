import ActorLimit, { ActorLimitExceededError } from './ActorLimit'
import MemoryAdapter from '../MemoryAdapter'
import Feature from '../Feature'
import Dsl from '../Dsl'
import ActorGate from '../ActorGate'
import BooleanGate from '../BooleanGate'
import ActorType from '../ActorType'
import BooleanType from '../BooleanType'

describe('ActorLimit', () => {
  let adapter: MemoryAdapter
  let actorLimit: ActorLimit
  let feature: Feature
  let actorGate: ActorGate
  let booleanGate: BooleanGate

  beforeEach(() => {
    adapter = new MemoryAdapter()
    actorLimit = new ActorLimit(adapter, 3) // Small limit for testing
    const dsl = new Dsl(adapter)
    feature = dsl.feature('test_feature')
    actorGate = new ActorGate()
    booleanGate = new BooleanGate()
  })

  describe('name', () => {
    it('returns wrapped adapter name', () => {
      expect(actorLimit.name).toBe('memory')
    })
  })

  describe('enable', () => {
    it('allows enabling actors below limit', async () => {
      await actorLimit.add(feature)

      const result1 = await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
      expect(result1).toBe(true)

      const result2 = await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-2' }))
      expect(result2).toBe(true)

      const result3 = await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-3' }))
      expect(result3).toBe(true)
    })

    it('throws when enabling actor at limit', async () => {
      await actorLimit.add(feature)

      // Enable up to limit
      await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
      await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-2' }))
      await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-3' }))

      // Next one should throw
      await expect(
        actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-4' }))
      ).rejects.toThrow(ActorLimitExceededError)
    })

    it('throws with helpful error message', async () => {
      await actorLimit.add(feature)

      // Fill up to limit
      await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
      await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-2' }))
      await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-3' }))

      await expect(
        actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-4' }))
      ).rejects.toThrow('Actor limit of 3 exceeded for feature test_feature')
    })

    it('allows enabling same actor multiple times', async () => {
      await actorLimit.add(feature)

      const result1 = await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
      expect(result1).toBe(true)
      const result2 = await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
      expect(result2).toBe(true)
      const result3 = await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
      expect(result3).toBe(true)
    })

    it('allows boolean gate regardless of actor count', async () => {
      await actorLimit.add(feature)

      // Fill up actor limit
      await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
      await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-2' }))
      await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-3' }))

      // Boolean gate should still work
      const result = await actorLimit.enable(feature, booleanGate, new BooleanType(true))
      expect(result).toBe(true)
    })

    it('allows other gates regardless of actor count', async () => {
      await actorLimit.add(feature)

      // Fill up actor limit
      await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
      await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-2' }))
      await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-3' }))

      // Other operations should still work
      const features = await actorLimit.features()
      expect(features).toBeDefined()
      const state = await actorLimit.get(feature)
      expect(state).toBeDefined()
    })
  })

  describe('default limit', () => {
    it('uses 100 as default limit', async () => {
      const defaultLimitAdapter = new ActorLimit(adapter)
      await defaultLimitAdapter.add(feature)

      // Should be able to add 100 actors
      for (let i = 0; i < 100; i++) {
        const result = await defaultLimitAdapter.enable(feature, actorGate, new ActorType({ flipperId: `user-${i}` }))
        expect(result).toBe(true)
      }

      // 101st should throw
      await expect(
        defaultLimitAdapter.enable(feature, actorGate, new ActorType({ flipperId: 'user-100' }))
      ).rejects.toThrow(ActorLimitExceededError)
    })
  })

  describe('custom limit', () => {
    it('respects custom limit', async () => {
      const customLimitAdapter = new ActorLimit(adapter, 5)
      await customLimitAdapter.add(feature)

      // Should be able to add 5 actors
      for (let i = 0; i < 5; i++) {
        const result = await customLimitAdapter.enable(feature, actorGate, new ActorType({ flipperId: `user-${i}` }))
        expect(result).toBe(true)
      }

      // 6th should throw
      await expect(
        customLimitAdapter.enable(feature, actorGate, new ActorType({ flipperId: 'user-5' }))
      ).rejects.toThrow(ActorLimitExceededError)
    })
  })

  describe('disable', () => {
    it('allows disabling actors', async () => {
      await actorLimit.add(feature)

      // Enable up to limit
      await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
      await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-2' }))
      await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-3' }))

      // Disable one
      await actorLimit.disable(feature, actorGate, new ActorType({ flipperId: 'user-2' }))

      // Now we can add another
      const result = await actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-4' }))
      expect(result).toBe(true)
    })
  })

  describe('integration with Dsl', () => {
    it('enforces limit through Dsl', async () => {
      const dsl = new Dsl(actorLimit)

      await dsl.add('limited_feature')

      // Enable up to limit
      await dsl.enableActor('limited_feature', { flipperId: 'user-1' })
      await dsl.enableActor('limited_feature', { flipperId: 'user-2' })
      await dsl.enableActor('limited_feature', { flipperId: 'user-3' })

      // Next one should throw
      await expect(dsl.enableActor('limited_feature', { flipperId: 'user-4' })).rejects.toThrow(
        ActorLimitExceededError
      )
    })

    it('allows other enable methods through Dsl', async () => {
      const dsl = new Dsl(actorLimit)

      await dsl.add('limited_feature')

      // Fill actor limit
      await dsl.enableActor('limited_feature', { flipperId: 'user-1' })
      await dsl.enableActor('limited_feature', { flipperId: 'user-2' })
      await dsl.enableActor('limited_feature', { flipperId: 'user-3' })

      // These should all still work
      const result1 = await dsl.enable('limited_feature')
      expect(result1).toBeDefined()
      const result2 = await dsl.enablePercentageOfActors('limited_feature', 25)
      expect(result2).toBeDefined()
    })
  })

  describe('ActorLimitExceededError', () => {
    it('has correct error name', () => {
      const error = new ActorLimitExceededError('my_feature', 50)
      expect(error.name).toBe('ActorLimitExceededError')
    })

    it('includes feature name and limit in message', () => {
      const error = new ActorLimitExceededError('my_feature', 50)
      expect(error.message).toContain('my_feature')
      expect(error.message).toContain('50')
    })

    it('includes documentation link', () => {
      const error = new ActorLimitExceededError('my_feature', 50)
      expect(error.message).toContain('flippercloud.io/docs')
    })
  })
})
