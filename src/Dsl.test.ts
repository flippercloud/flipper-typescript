import Dsl from './Dsl'
import { IActor } from './interfaces'
import MemoryAdapter from './MemoryAdapter'
import { makeActor } from './testHelpers'

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
    dsl.register('admins', (actor: IActor) => actor.flipperId === 'actor:5')
    dsl.enableGroup('feature-1', 'admins')
    expect(dsl.isFeatureEnabled('feature-1', makeActor(5))).toBe(true)
    dsl.disableGroup('feature-1', 'admins')
    expect(dsl.isFeatureEnabled('feature-1', makeActor(5))).toBe(false)
  })

  test('disables percentage of actors', () => {
    dsl.enablePercentageOfActors('feature-1', 50)
    expect(dsl.isFeatureEnabled('feature-1', makeActor(5))).toBe(true)

    dsl.disablePercentageOfActors('feature-1')
    expect(dsl.isFeatureEnabled('feature-1', makeActor(5))).toBe(false)
    expect(dsl.feature('feature-1').percentageOfActorsValue()).toBe(0)
  })

  test('disables percentage of time', () => {
    dsl.enablePercentageOfTime('feature-1', 100)
    expect(dsl.isFeatureEnabled('feature-1', makeActor(1))).toBe(true)

    dsl.disablePercentageOfTime('feature-1')
    expect(dsl.isFeatureEnabled('feature-1', makeActor(1))).toBe(false)
    expect(dsl.feature('feature-1').percentageOfTimeValue()).toBe(0)
  })

  test('registers group', () => {
    const groupName = 'admins'
    const adminCheck = (actor: IActor) => {
      return actor.isAdmin === true
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

  describe('preload methods', () => {
    test('preload loads specific features', () => {
      dsl.add('feature-1')
      dsl.add('feature-2')
      dsl.add('feature-3')
      dsl.enable('feature-1')

      const features = dsl.preload(['feature-1', 'feature-2'])
      expect(features).toHaveLength(2)
      expect(features.map(f => f.name).sort()).toEqual(['feature-1', 'feature-2'])
    })

    test('preloadAll loads all features', () => {
      dsl.add('feature-1')
      dsl.add('feature-2')
      dsl.enable('feature-1')
      dsl.enableGroup('feature-2', 'admins')

      const features = dsl.preloadAll()
      expect(features).toHaveLength(2)
      expect(features.map(f => f.name).sort()).toEqual(['feature-1', 'feature-2'])
    })
  })

  describe('readOnly', () => {
    test('returns false for memory adapter', () => {
      expect(dsl.readOnly()).toBe(false)
    })
  })

  describe('group', () => {
    test('returns registered group by name', () => {
      const groupName = 'admins'
      const adminCheck = (actor: IActor) => actor.isAdmin === true
      dsl.register(groupName, adminCheck)

      const group = dsl.group(groupName)
      expect(group).toBeDefined()
      expect(group?.value).toBe(groupName)
      expect(group?.callback).toBe(adminCheck)
    })

    test('returns undefined for non-existent group', () => {
      const group = dsl.group('non-existent')
      expect(group).toBeUndefined()
    })
  })
})
