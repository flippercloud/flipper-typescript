import Dsl from './Dsl'
import { IActor } from './interfaces'
import MemoryAdapter from './MemoryAdapter'
import { makeActor } from './test_helper'

let dsl: Dsl

describe('Dsl', () => {
  beforeEach(() => {
    const adapter = new MemoryAdapter()
    dsl = new Dsl(adapter)
  })

  test('enables and disables the feature', () => {
    dsl.enable('feature-1')
    dsl.disable('feature-2')
    expect(dsl.isFeatureEnabled('feature-1')).toBe(true)
    expect(dsl.isFeatureEnabled('feature-2')).toBe(false)
  })

  test('enables and disables the feature for actor', () => {
    const actor = makeActor(5)

    dsl.enableActor('feature-1', actor)
    expect(dsl.isFeatureEnabled('feature-1', actor)).toBe(true)
    dsl.disableActor('feature-1', actor)
    expect(dsl.isFeatureEnabled('feature-1', actor)).toBe(false)
  })

  test('enables feature for percentage of actors', () => {
    dsl.enablePercentageOfActors('feature-1', 50)

    expect(dsl.isFeatureEnabled('feature-1', makeActor(5))).toBe(true)
    expect(dsl.isFeatureEnabled('feature-1', makeActor(8))).toBe(false)
  })

  test('enables feature for percentage of time', () => {
    dsl.enablePercentageOfTime('feature-1', 50)

    let trueCount = 0
    let falseCount = 0

    for (let i = 0; i < 100; i++) {
      if (dsl.isFeatureEnabled('feature-1', makeActor(1))) {
        trueCount++
      } else {
        falseCount++
      }
    }

    expect(Math.abs(trueCount - falseCount)).toBeLessThanOrEqual(30) // could be flaky
  })

  test('enables and disables the feature for group', () => {
    const groupName = 'admins'
    const adminCheck = (actor: IActor) => {
      return actor.isAdmin
    }
    const admin = makeActor(1, true)
    const user = makeActor(2, false)
    dsl.register(groupName, adminCheck)

    dsl.enableGroup('feature-1', groupName)
    expect(dsl.isFeatureEnabled('feature-1', admin)).toBe(true)
    expect(dsl.isFeatureEnabled('feature-1', user)).toBe(false)
    dsl.disableGroup('feature-1', groupName)
    expect(dsl.isFeatureEnabled('feature-1', admin)).toBe(false)
    expect(dsl.isFeatureEnabled('feature-1', user)).toBe(false)
  })

  test('registers group', () => {
    const groupName = 'admins'
    const adminCheck = (actor: IActor) => {
      return actor.isAdmin
    }
    dsl.register(groupName, adminCheck)
    expect(dsl.groups[groupName]?.callback).toBe(adminCheck)
  })
})
