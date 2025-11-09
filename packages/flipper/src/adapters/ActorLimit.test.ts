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
    it('allows enabling actors below limit', () => {
      actorLimit.add(feature)

      expect(() => {
        actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
      }).not.toThrow()

      expect(() => {
        actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-2' }))
      }).not.toThrow()

      expect(() => {
        actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-3' }))
      }).not.toThrow()
    })

    it('throws when enabling actor at limit', () => {
      actorLimit.add(feature)

      // Enable up to limit
      actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
      actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-2' }))
      actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-3' }))

      // Next one should throw
      expect(() => {
        actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-4' }))
      }).toThrow(ActorLimitExceededError)
    })

    it('throws with helpful error message', () => {
      actorLimit.add(feature)

      // Fill up to limit
      actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
      actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-2' }))
      actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-3' }))

      expect(() => {
        actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-4' }))
      }).toThrow('Actor limit of 3 exceeded for feature test_feature')
    })

    it('allows enabling same actor multiple times', () => {
      actorLimit.add(feature)

      expect(() => {
        actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
        actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
        actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
      }).not.toThrow()
    })

    it('allows boolean gate regardless of actor count', () => {
      actorLimit.add(feature)

      // Fill up actor limit
      actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
      actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-2' }))
      actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-3' }))

      // Boolean gate should still work
      expect(() => {
        actorLimit.enable(feature, booleanGate, new BooleanType(true))
      }).not.toThrow()
    })

    it('allows other gates regardless of actor count', () => {
      actorLimit.add(feature)

      // Fill up actor limit
      actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
      actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-2' }))
      actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-3' }))

      // Other operations should still work
      expect(() => actorLimit.features()).not.toThrow()
      expect(() => actorLimit.get(feature)).not.toThrow()
    })
  })

  describe('default limit', () => {
    it('uses 100 as default limit', () => {
      const defaultLimitAdapter = new ActorLimit(adapter)
      defaultLimitAdapter.add(feature)

      // Should be able to add 100 actors
      for (let i = 0; i < 100; i++) {
        expect(() => {
          defaultLimitAdapter.enable(
            feature,
            actorGate,
            new ActorType({ flipperId: `user-${i}` })
          )
        }).not.toThrow()
      }

      // 101st should throw
      expect(() => {
        defaultLimitAdapter.enable(
          feature,
          actorGate,
          new ActorType({ flipperId: 'user-100' })
        )
      }).toThrow(ActorLimitExceededError)
    })
  })

  describe('custom limit', () => {
    it('respects custom limit', () => {
      const customLimitAdapter = new ActorLimit(adapter, 5)
      customLimitAdapter.add(feature)

      // Should be able to add 5 actors
      for (let i = 0; i < 5; i++) {
        expect(() => {
          customLimitAdapter.enable(
            feature,
            actorGate,
            new ActorType({ flipperId: `user-${i}` })
          )
        }).not.toThrow()
      }

      // 6th should throw
      expect(() => {
        customLimitAdapter.enable(
          feature,
          actorGate,
          new ActorType({ flipperId: 'user-5' })
        )
      }).toThrow(ActorLimitExceededError)
    })
  })

  describe('disable', () => {
    it('allows disabling actors', () => {
      actorLimit.add(feature)

      // Enable up to limit
      actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-1' }))
      actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-2' }))
      actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-3' }))

      // Disable one
      actorLimit.disable(feature, actorGate, new ActorType({ flipperId: 'user-2' }))

      // Now we can add another
      expect(() => {
        actorLimit.enable(feature, actorGate, new ActorType({ flipperId: 'user-4' }))
      }).not.toThrow()
    })
  })

  describe('integration with Dsl', () => {
    it('enforces limit through Dsl', () => {
      const dsl = new Dsl(actorLimit)

      dsl.add('limited_feature')

      // Enable up to limit
      dsl.enableActor('limited_feature', { flipperId: 'user-1' })
      dsl.enableActor('limited_feature', { flipperId: 'user-2' })
      dsl.enableActor('limited_feature', { flipperId: 'user-3' })

      // Next one should throw
      expect(() => {
        dsl.enableActor('limited_feature', { flipperId: 'user-4' })
      }).toThrow(ActorLimitExceededError)
    })

    it('allows other enable methods through Dsl', () => {
      const dsl = new Dsl(actorLimit)

      dsl.add('limited_feature')

      // Fill actor limit
      dsl.enableActor('limited_feature', { flipperId: 'user-1' })
      dsl.enableActor('limited_feature', { flipperId: 'user-2' })
      dsl.enableActor('limited_feature', { flipperId: 'user-3' })

      // These should all still work
      expect(() => dsl.enable('limited_feature')).not.toThrow()
      expect(() => dsl.enablePercentageOfActors('limited_feature', 25)).not.toThrow()
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
