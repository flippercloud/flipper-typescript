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
})
