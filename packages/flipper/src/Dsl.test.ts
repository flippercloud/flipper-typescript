import Dsl from './Dsl'
import { IActor } from './interfaces'
import MemoryAdapter from './MemoryAdapter'
import { crc32 } from 'crc'
import { makeActor } from './testHelpers'

let dsl: Dsl

describe('Dsl', () => {
  beforeEach(() => {
    const adapter = new MemoryAdapter()
    dsl = new Dsl(adapter)
  })

  test('enables and disables the feature', async () => {
    await dsl.enable('feature-1')
    await dsl.disable('feature-2')
    expect(await dsl.isFeatureEnabled('feature-1')).toBe(true)
    expect(await dsl.isFeatureEnabled('feature-2')).toBe(false)
  })

  test('enables and disables the feature for actor', async () => {
    const actor = makeActor(5)

    await dsl.enableActor('feature-1', actor)
    expect(await dsl.isFeatureEnabled('feature-1', actor)).toBe(true)
    await dsl.disableActor('feature-1', actor)
    expect(await dsl.isFeatureEnabled('feature-1', actor)).toBe(false)
  })

  test('enables feature for percentage of actors', async () => {
    await dsl.enablePercentageOfActors('feature-1', 50)

    const { enabledActor, disabledActor } = findEnabledAndDisabledActors('feature-1', 50)

    expect(await dsl.isFeatureEnabled('feature-1', enabledActor)).toBe(true)
    expect(await dsl.isFeatureEnabled('feature-1', disabledActor)).toBe(false)
  })

  test('enables feature for percentage of time', async () => {
    await dsl.enablePercentageOfTime('feature-1', 50)

    let trueCount = 0
    let falseCount = 0

    for (let i = 0; i < 100; i++) {
      if (await dsl.isFeatureEnabled('feature-1', makeActor(1))) {
        trueCount++
      } else {
        falseCount++
      }
    }

    expect(Math.abs(trueCount - falseCount)).toBeLessThanOrEqual(30) // could be flaky
  })

  test('enables and disables the feature for group', async () => {
    dsl.register('admins', (actor: IActor) => actor.flipperId === 'actor:5')
    await dsl.enableGroup('feature-1', 'admins')
    expect(await dsl.isFeatureEnabled('feature-1', makeActor(5))).toBe(true)
    await dsl.disableGroup('feature-1', 'admins')
    expect(await dsl.isFeatureEnabled('feature-1', makeActor(5))).toBe(false)
  })

  test('disables percentage of actors', async () => {
    await dsl.enablePercentageOfActors('feature-1', 50)

    const { enabledActor } = findEnabledAndDisabledActors('feature-1', 50)
    expect(await dsl.isFeatureEnabled('feature-1', enabledActor)).toBe(true)

    await dsl.disablePercentageOfActors('feature-1')

    expect(await dsl.isFeatureEnabled('feature-1', enabledActor)).toBe(false)
    expect(await dsl.feature('feature-1').percentageOfActorsValue()).toBe(0)
  })

  test('disables percentage of time', async () => {
    await dsl.enablePercentageOfTime('feature-1', 100)
    expect(await dsl.isFeatureEnabled('feature-1', makeActor(1))).toBe(true)

    await dsl.disablePercentageOfTime('feature-1')
    expect(await dsl.isFeatureEnabled('feature-1', makeActor(1))).toBe(false)
    expect(await dsl.feature('feature-1').percentageOfTimeValue()).toBe(0)
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
    test('add adds feature to adapter', async () => {
      const result = await dsl.add('new-feature')
      expect(result).toBe(true)
      expect(await dsl.exist('new-feature')).toBe(true)
    })

    test('exist returns false for non-existent feature', async () => {
      expect(await dsl.exist('non-existent')).toBe(false)
    })

    test('exist returns true for added feature', async () => {
      await dsl.add('test-feature')
      expect(await dsl.exist('test-feature')).toBe(true)
    })

    test('remove removes feature from adapter', async () => {
      await dsl.add('test-feature')
      await dsl.enable('test-feature')
      expect(await dsl.exist('test-feature')).toBe(true)

      const result = await dsl.remove('test-feature')
      expect(result).toBe(true)
      expect(await dsl.exist('test-feature')).toBe(false)
    })

    test('features returns empty array when no features', async () => {
      const features = await dsl.features()
      expect(features).toEqual([])
    })

    test('features returns array of Feature instances', async () => {
      await dsl.add('feature-1')
      await dsl.add('feature-2')
      await dsl.add('feature-3')

      const features = await dsl.features()
      expect(features).toHaveLength(3)
      expect(features[0]?.name).toBeDefined()
      expect(features.map(f => f.name).sort()).toEqual(['feature-1', 'feature-2', 'feature-3'])
    })

    test('features includes features added through enable', async () => {
      await dsl.enable('auto-added')

      const features = await dsl.features()
      expect(features).toHaveLength(1)
      expect(features[0]?.name).toBe('auto-added')
    })
  })

  describe('preload methods', () => {
    test('preload loads specific features', async () => {
      await dsl.add('feature-1')
      await dsl.add('feature-2')
      await dsl.add('feature-3')
      await dsl.enable('feature-1')

      const features = await dsl.preload(['feature-1', 'feature-2'])
      expect(features).toHaveLength(2)
      expect(features.map(f => f.name).sort()).toEqual(['feature-1', 'feature-2'])
    })

    test('preloadAll loads all features', async () => {
      await dsl.add('feature-1')
      await dsl.add('feature-2')
      await dsl.enable('feature-1')
      await dsl.enableGroup('feature-2', 'admins')

      const features = await dsl.preloadAll()
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

function rubyPercentageOfActorsOpen(featureName: string, actorId: string, percentage: number): boolean {
  const scalingFactor = 1000
  const id = `${featureName}${actorId}`
  const hash = crc32(id).valueOf()
  return hash % (100 * scalingFactor) < percentage * scalingFactor
}

function findEnabledAndDisabledActors(
  featureName: string,
  percentage: number
): { enabledActor: IActor; disabledActor: IActor } {
  let enabledActor: IActor | null = null
  let disabledActor: IActor | null = null

  for (let i = 0; i < 100_000; i++) {
    const candidate = makeActor(i)
    const open = rubyPercentageOfActorsOpen(featureName, candidate.flipperId, percentage)

    if (!enabledActor && open) {
      enabledActor = candidate
    }
    if (!disabledActor && !open) {
      disabledActor = candidate
    }
    if (enabledActor && disabledActor) {
      break
    }
  }

  if (!enabledActor || !disabledActor) {
    throw new Error('Failed to find both enabled and disabled actors for percentage-of-actors test')
  }

  return { enabledActor, disabledActor }
}
