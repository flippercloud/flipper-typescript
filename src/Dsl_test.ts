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

  describe('management methods', () => {
    test('add adds feature to adapter', () => {
      const result = dsl.add('new-feature')
      expect(result).toBe(true)
      expect(dsl.exist('new-feature')).toBe(true)
    })

    test('exist returns false for non-existent feature', () => {
      expect(dsl.exist('non-existent')).toBe(false)
    })

    test('exist returns true for added feature', () => {
      dsl.add('test-feature')
      expect(dsl.exist('test-feature')).toBe(true)
    })

    test('remove removes feature from adapter', () => {
      dsl.add('test-feature')
      dsl.enable('test-feature')
      expect(dsl.exist('test-feature')).toBe(true)
      
      const result = dsl.remove('test-feature')
      expect(result).toBe(true)
      expect(dsl.exist('test-feature')).toBe(false)
    })

    test('features returns empty array when no features', () => {
      const features = dsl.features()
      expect(features).toEqual([])
    })

    test('features returns array of Feature instances', () => {
      dsl.add('feature-1')
      dsl.add('feature-2')
      dsl.add('feature-3')

      const features = dsl.features()
      expect(features).toHaveLength(3)
      expect(features[0]?.name).toBeDefined()
      expect(features.map(f => f.name).sort()).toEqual(['feature-1', 'feature-2', 'feature-3'])
    })

    test('features includes features added through enable', () => {
      dsl.enable('auto-added')
      
      const features = dsl.features()
      expect(features).toHaveLength(1)
      expect(features[0]?.name).toBe('auto-added')
    })
  })
})
