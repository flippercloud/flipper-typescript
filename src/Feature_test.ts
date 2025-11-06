import Feature from './Feature'
import MemoryAdapter from './MemoryAdapter'
import { makeActor } from './test_helper'

let adapter: MemoryAdapter
let feature: Feature

describe('Feature', () => {
  beforeEach(() => {
    adapter = new MemoryAdapter()
    feature = new Feature('feature-1', adapter, {})
  })

  test('has name', () => {
    expect(feature.name).toEqual('feature-1')
  })

  test('enable and disable feature', () => {
    expect(feature.isEnabled()).toEqual(false)
    feature.enable()
    expect(feature.isEnabled()).toEqual(true)
    feature.disable()
    expect(feature.isEnabled()).toEqual(false)
  })

  test('enable and disable feature for actor', () => {
    const actor = makeActor(5)
    expect(feature.isEnabled(actor)).toEqual(false)
    feature.enableActor(actor)
    expect(feature.isEnabled(actor)).toEqual(true)
    feature.disableActor(actor)
    expect(feature.isEnabled(actor)).toEqual(false)
  })

  describe('disablePercentageOfActors', () => {
    test('sets percentage to 0', () => {
      feature.enablePercentageOfActors(25)
      expect(feature.percentageOfActorsValue()).toEqual(25)
      feature.disablePercentageOfActors()
      expect(feature.percentageOfActorsValue()).toEqual(0)
    })

    test('disables feature for actors', () => {
      const actor = makeActor(5)
      feature.enablePercentageOfActors(100)
      expect(feature.isEnabled(actor)).toEqual(true)
      feature.disablePercentageOfActors()
      expect(feature.isEnabled(actor)).toEqual(false)
    })

    test('can be called when already disabled', () => {
      expect(feature.percentageOfActorsValue()).toEqual(0)
      feature.disablePercentageOfActors()
      expect(feature.percentageOfActorsValue()).toEqual(0)
    })
  })

  describe('disablePercentageOfTime', () => {
    test('sets percentage to 0', () => {
      feature.enablePercentageOfTime(50)
      expect(feature.percentageOfTimeValue()).toEqual(50)
      feature.disablePercentageOfTime()
      expect(feature.percentageOfTimeValue()).toEqual(0)
    })

    test('disables feature', () => {
      feature.enablePercentageOfTime(100)
      expect(feature.isEnabled()).toEqual(true)
      feature.disablePercentageOfTime()
      expect(feature.isEnabled()).toEqual(false)
    })

    test('can be called when already disabled', () => {
      expect(feature.percentageOfTimeValue()).toEqual(0)
      feature.disablePercentageOfTime()
      expect(feature.percentageOfTimeValue()).toEqual(0)
    })
  })

  describe('state', () => {
    describe('when fully on (boolean gate)', () => {
      beforeEach(() => {
        feature.enable()
      })

      test('returns "on"', () => {
        expect(feature.state()).toEqual('on')
      })

      test('isOn returns true', () => {
        expect(feature.isOn()).toEqual(true)
      })

      test('isOff returns false', () => {
        expect(feature.isOff()).toEqual(false)
      })

      test('isConditional returns false', () => {
        expect(feature.isConditional()).toEqual(false)
      })
    })

    describe('when percentage of time is 100', () => {
      beforeEach(() => {
        feature.enablePercentageOfTime(100)
      })

      test('returns "on"', () => {
        expect(feature.state()).toEqual('on')
      })

      test('isOn returns true', () => {
        expect(feature.isOn()).toEqual(true)
      })

      test('isOff returns false', () => {
        expect(feature.isOff()).toEqual(false)
      })

      test('isConditional returns false', () => {
        expect(feature.isConditional()).toEqual(false)
      })
    })

    describe('when percentage of actors is 100', () => {
      beforeEach(() => {
        feature.enablePercentageOfActors(100)
      })

      test('returns "conditional"', () => {
        expect(feature.state()).toEqual('conditional')
      })

      test('isOn returns false', () => {
        expect(feature.isOn()).toEqual(false)
      })

      test('isOff returns false', () => {
        expect(feature.isOff()).toEqual(false)
      })

      test('isConditional returns true', () => {
        expect(feature.isConditional()).toEqual(true)
      })
    })

    describe('when fully off', () => {
      beforeEach(() => {
        feature.disable()
      })

      test('returns "off"', () => {
        expect(feature.state()).toEqual('off')
      })

      test('isOn returns false', () => {
        expect(feature.isOn()).toEqual(false)
      })

      test('isOff returns true', () => {
        expect(feature.isOff()).toEqual(true)
      })

      test('isConditional returns false', () => {
        expect(feature.isConditional()).toEqual(false)
      })
    })

    describe('when partially on (percentage of time)', () => {
      beforeEach(() => {
        feature.enablePercentageOfTime(5)
      })

      test('returns "conditional"', () => {
        expect(feature.state()).toEqual('conditional')
      })

      test('isOn returns false', () => {
        expect(feature.isOn()).toEqual(false)
      })

      test('isOff returns false', () => {
        expect(feature.isOff()).toEqual(false)
      })

      test('isConditional returns true', () => {
        expect(feature.isConditional()).toEqual(true)
      })
    })

    describe('when enabled for actor', () => {
      beforeEach(() => {
        const actor = makeActor(5)
        feature.enableActor(actor)
      })

      test('returns "conditional"', () => {
        expect(feature.state()).toEqual('conditional')
      })

      test('isConditional returns true', () => {
        expect(feature.isConditional()).toEqual(true)
      })
    })

    describe('when enabled for group', () => {
      beforeEach(() => {
        feature.enableGroup('admins')
      })

      test('returns "conditional"', () => {
        expect(feature.state()).toEqual('conditional')
      })

      test('isConditional returns true', () => {
        expect(feature.isConditional()).toEqual(true)
      })
    })
  })

  describe('value retrieval methods', () => {
    describe('booleanValue', () => {
      test('returns false when feature is disabled', () => {
        expect(feature.booleanValue()).toEqual(false)
      })

      test('returns true when feature is fully enabled', () => {
        feature.enable()
        expect(feature.booleanValue()).toEqual(true)
      })

      test('returns false when only actor is enabled', () => {
        feature.enableActor(makeActor(1))
        expect(feature.booleanValue()).toEqual(false)
      })
    })

    describe('actorsValue', () => {
      test('returns empty set when no actors enabled', () => {
        expect(feature.actorsValue()).toEqual(new Set())
      })

      test('returns set with single actor id', () => {
        const actor = makeActor(5)
        feature.enableActor(actor)
        expect(feature.actorsValue()).toEqual(new Set(['actor:5']))
      })

      test('returns set with multiple actor ids', () => {
        feature.enableActor(makeActor(1))
        feature.enableActor(makeActor(2))
        feature.enableActor(makeActor(3))
        expect(feature.actorsValue()).toEqual(new Set(['actor:1', 'actor:2', 'actor:3']))
      })

      test('reflects removal of actors', () => {
        feature.enableActor(makeActor(1))
        feature.enableActor(makeActor(2))
        feature.disableActor(makeActor(1))
        expect(feature.actorsValue()).toEqual(new Set(['actor:2']))
      })
    })

    describe('groupsValue', () => {
      test('returns empty set when no groups enabled', () => {
        expect(feature.groupsValue()).toEqual(new Set())
      })

      test('returns set with single group name', () => {
        feature.enableGroup('admins')
        expect(feature.groupsValue()).toEqual(new Set(['admins']))
      })

      test('returns set with multiple group names', () => {
        feature.enableGroup('admins')
        feature.enableGroup('early_access')
        feature.enableGroup('beta_testers')
        expect(feature.groupsValue()).toEqual(new Set(['admins', 'early_access', 'beta_testers']))
      })

      test('reflects removal of groups', () => {
        feature.enableGroup('admins')
        feature.enableGroup('beta_testers')
        feature.disableGroup('admins')
        expect(feature.groupsValue()).toEqual(new Set(['beta_testers']))
      })
    })

    describe('percentageOfActorsValue', () => {
      test('returns 0 when not enabled', () => {
        expect(feature.percentageOfActorsValue()).toEqual(0)
      })

      test('returns the percentage when enabled', () => {
        feature.enablePercentageOfActors(25)
        expect(feature.percentageOfActorsValue()).toEqual(25)
      })

      test('returns updated percentage when changed', () => {
        feature.enablePercentageOfActors(10)
        expect(feature.percentageOfActorsValue()).toEqual(10)
        feature.enablePercentageOfActors(50)
        expect(feature.percentageOfActorsValue()).toEqual(50)
      })

      test('returns 100 when fully enabled via percentage', () => {
        feature.enablePercentageOfActors(100)
        expect(feature.percentageOfActorsValue()).toEqual(100)
      })
    })

    describe('percentageOfTimeValue', () => {
      test('returns 0 when not enabled', () => {
        expect(feature.percentageOfTimeValue()).toEqual(0)
      })

      test('returns the percentage when enabled', () => {
        feature.enablePercentageOfTime(15)
        expect(feature.percentageOfTimeValue()).toEqual(15)
      })

      test('returns updated percentage when changed', () => {
        feature.enablePercentageOfTime(20)
        expect(feature.percentageOfTimeValue()).toEqual(20)
        feature.enablePercentageOfTime(75)
        expect(feature.percentageOfTimeValue()).toEqual(75)
      })

      test('returns 100 when fully enabled via percentage', () => {
        feature.enablePercentageOfTime(100)
        expect(feature.percentageOfTimeValue()).toEqual(100)
      })
    })
  })
})
