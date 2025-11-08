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

  describe('management methods', () => {
    describe('add', () => {
      test('adds feature to adapter', () => {
        expect(adapter.features()).toHaveLength(0)
        feature.add()
        const features = adapter.features()
        expect(features).toHaveLength(1)
        expect(features[0]?.name).toEqual('feature-1')
      })

      test('is idempotent', () => {
        feature.add()
        feature.add()
        expect(adapter.features()).toHaveLength(1)
      })

      test('returns true', () => {
        expect(feature.add()).toEqual(true)
      })
    })

    describe('exist', () => {
      test('returns false when feature not added', () => {
        expect(feature.exist()).toEqual(false)
      })

      test('returns true when feature added', () => {
        feature.add()
        expect(feature.exist()).toEqual(true)
      })

      test('returns false after feature removed', () => {
        feature.add()
        feature.remove()
        expect(feature.exist()).toEqual(false)
      })
    })

    describe('remove', () => {
      test('removes feature from adapter', () => {
        feature.add()
        expect(adapter.features()).toHaveLength(1)
        feature.remove()
        expect(adapter.features()).toHaveLength(0)
      })

      test('clears all gate values when removing', () => {
        feature.enable()
        feature.enableActor(makeActor(1))
        feature.enableGroup('admins')
        expect(feature.booleanValue()).toEqual(true)
        expect(feature.actorsValue().size).toBeGreaterThan(0)

        feature.remove()

        expect(feature.booleanValue()).toEqual(false)
        expect(feature.actorsValue()).toEqual(new Set())
        expect(feature.groupsValue()).toEqual(new Set())
      })

      test('returns true', () => {
        feature.add()
        expect(feature.remove()).toEqual(true)
      })
    })

    describe('clear', () => {
      test('clears all gate values', () => {
        feature.enable()
        feature.enableActor(makeActor(1))
        feature.enableGroup('admins')
        feature.enablePercentageOfActors(50)
        feature.enablePercentageOfTime(25)

        expect(feature.booleanValue()).toEqual(true)
        expect(feature.actorsValue().size).toBeGreaterThan(0)
        expect(feature.groupsValue().size).toBeGreaterThan(0)
        expect(feature.percentageOfActorsValue()).toEqual(50)
        expect(feature.percentageOfTimeValue()).toEqual(25)

        feature.clear()

        expect(feature.booleanValue()).toEqual(false)
        expect(feature.actorsValue()).toEqual(new Set())
        expect(feature.groupsValue()).toEqual(new Set())
        expect(feature.percentageOfActorsValue()).toEqual(0)
        expect(feature.percentageOfTimeValue()).toEqual(0)
      })

      test('does not remove feature from adapter', () => {
        feature.add()
        feature.clear()
        expect(feature.exist()).toEqual(true)
      })

      test('returns true', () => {
        expect(feature.clear()).toEqual(true)
      })
    })
  })

  describe('gate access methods', () => {
    describe('enabledGates', () => {
      test('returns empty array when no gates enabled', () => {
        expect(feature.enabledGates()).toEqual([])
      })

      test('returns array with boolean gate when fully enabled', () => {
        feature.enable()
        const enabled = feature.enabledGates()
        expect(enabled).toHaveLength(1)
        expect(enabled[0]?.name).toEqual('boolean')
      })

      test('returns array with actor gate when actor enabled', () => {
        feature.enableActor(makeActor(1))
        const enabled = feature.enabledGates()
        expect(enabled).toHaveLength(1)
        expect(enabled[0]?.name).toEqual('actor')
      })

      test('returns array with group gate when group enabled', () => {
        feature.enableGroup('admins')
        const enabled = feature.enabledGates()
        expect(enabled).toHaveLength(1)
        expect(enabled[0]?.name).toEqual('group')
      })

      test('returns array with percentage of actors gate when enabled', () => {
        feature.enablePercentageOfActors(25)
        const enabled = feature.enabledGates()
        expect(enabled).toHaveLength(1)
        expect(enabled[0]?.name).toEqual('percentageOfActors')
      })

      test('returns array with percentage of time gate when enabled', () => {
        feature.enablePercentageOfTime(50)
        const enabled = feature.enabledGates()
        expect(enabled).toHaveLength(1)
        expect(enabled[0]?.name).toEqual('percentageOfTime')
      })

      test('returns multiple gates when multiple enabled', () => {
        feature.enableActor(makeActor(1))
        feature.enableGroup('admins')
        feature.enablePercentageOfActors(25)
        const enabled = feature.enabledGates()
        expect(enabled).toHaveLength(3)
        const names = enabled.map(g => g.name)
        expect(names).toContain('actor')
        expect(names).toContain('group')
        expect(names).toContain('percentageOfActors')
      })
    })

    describe('disabledGates', () => {
      test('returns all gates when none enabled', () => {
        const disabled = feature.disabledGates()
        expect(disabled).toHaveLength(5)
      })

      test('returns 4 gates when boolean enabled', () => {
        feature.enable()
        const disabled = feature.disabledGates()
        expect(disabled).toHaveLength(4)
        const names = disabled.map(g => g.name)
        expect(names).not.toContain('boolean')
      })

      test('returns empty array when all gates enabled', () => {
        feature.enable()
        feature.enableActor(makeActor(1))
        feature.enableGroup('admins')
        feature.enablePercentageOfActors(25)
        feature.enablePercentageOfTime(50)
        const disabled = feature.disabledGates()
        expect(disabled).toEqual([])
      })
    })

    describe('enabledGateNames', () => {
      test('returns empty array when no gates enabled', () => {
        expect(feature.enabledGateNames()).toEqual([])
      })

      test('returns gate names when enabled', () => {
        feature.enableActor(makeActor(1))
        feature.enableGroup('admins')
        expect(feature.enabledGateNames()).toEqual(['actor', 'group'])
      })
    })

    describe('disabledGateNames', () => {
      test('returns all gate names when none enabled', () => {
        const names = feature.disabledGateNames()
        expect(names).toHaveLength(5)
        expect(names).toContain('actor')
        expect(names).toContain('boolean')
        expect(names).toContain('group')
        expect(names).toContain('percentageOfActors')
        expect(names).toContain('percentageOfTime')
      })

      test('returns remaining gate names when some enabled', () => {
        feature.enable()
        feature.enableActor(makeActor(1))
        const names = feature.disabledGateNames()
        expect(names).toHaveLength(3)
        expect(names).toContain('group')
        expect(names).toContain('percentageOfActors')
        expect(names).toContain('percentageOfTime')
      })
    })
  })

  describe('group helper methods', () => {
    describe('enabledGroups', () => {
      test('returns empty array when no groups registered', () => {
        expect(feature.enabledGroups()).toEqual([])
      })

      test('returns empty array when no groups enabled', async () => {
        const { default: Dsl } = await import('./Dsl.js')
        const dsl = new Dsl(adapter)
        dsl.register('admins', (_actor: unknown) => true)
        dsl.register('beta_testers', (_actor: unknown) => true)
        const featureWithGroups = new Feature('test-feature', adapter, dsl.groups)

        expect(featureWithGroups.enabledGroups()).toEqual([])
      })

      test('returns array of enabled group instances', async () => {
        const { default: Dsl } = await import('./Dsl.js')
        const dsl = new Dsl(adapter)
        const adminsCallback = (_actor: unknown) => true
        const betaCallback = (_actor: unknown) => false
        dsl.register('admins', adminsCallback)
        dsl.register('beta_testers', betaCallback)

        const featureWithGroups = new Feature('test-feature', adapter, dsl.groups)
        featureWithGroups.enableGroup('admins')

        const enabled = featureWithGroups.enabledGroups()
        expect(enabled).toHaveLength(1)
        expect(enabled[0]?.value).toEqual('admins')
        expect(enabled[0]?.callback).toEqual(adminsCallback)
      })

      test('returns multiple enabled groups', async () => {
        const { default: Dsl } = await import('./Dsl.js')
        const dsl = new Dsl(adapter)
        dsl.register('admins', (_actor: unknown) => true)
        dsl.register('beta_testers', (_actor: unknown) => true)
        dsl.register('staff', (_actor: unknown) => true)
        dsl.register('not_enabled', (_actor: unknown) => true)

        const featureWithGroups = new Feature('test-feature', adapter, dsl.groups)
        featureWithGroups.enableGroup('admins')
        featureWithGroups.enableGroup('beta_testers')
        featureWithGroups.enableGroup('staff')

        const enabled = featureWithGroups.enabledGroups()
        expect(enabled).toHaveLength(3)
        const values = enabled.map(g => g.value).sort()
        expect(values).toEqual(['admins', 'beta_testers', 'staff'])
      })

      test('does not include disabled groups', async () => {
        const { default: Dsl } = await import('./Dsl.js')
        const dsl = new Dsl(adapter)
        dsl.register('admins', (_actor: unknown) => true)
        dsl.register('disabled', (_actor: unknown) => true)

        const featureWithGroups = new Feature('test-feature', adapter, dsl.groups)
        featureWithGroups.enableGroup('admins')
        featureWithGroups.enableGroup('disabled')
        featureWithGroups.disableGroup('disabled')

        const enabled = featureWithGroups.enabledGroups()
        expect(enabled).toHaveLength(1)
        expect(enabled[0]?.value).toEqual('admins')
      })
    })

    describe('disabledGroups', () => {
      test('returns empty array when no groups registered', () => {
        expect(feature.disabledGroups()).toEqual([])
      })

      test('returns all groups when none enabled', async () => {
        const { default: Dsl } = await import('./Dsl.js')
        const dsl = new Dsl(adapter)
        dsl.register('admins', (_actor: unknown) => true)
        dsl.register('beta_testers', (_actor: unknown) => true)

        const featureWithGroups = new Feature('test-feature', adapter, dsl.groups)

        const disabled = featureWithGroups.disabledGroups()
        expect(disabled).toHaveLength(2)
        const values = disabled.map(g => g.value).sort()
        expect(values).toEqual(['admins', 'beta_testers'])
      })

      test('returns groups that are not enabled', async () => {
        const { default: Dsl } = await import('./Dsl.js')
        const dsl = new Dsl(adapter)
        dsl.register('admins', (_actor: unknown) => true)
        dsl.register('beta_testers', (_actor: unknown) => true)
        dsl.register('staff', (_actor: unknown) => true)

        const featureWithGroups = new Feature('test-feature', adapter, dsl.groups)
        featureWithGroups.enableGroup('admins')

        const disabled = featureWithGroups.disabledGroups()
        expect(disabled).toHaveLength(2)
        const values = disabled.map(g => g.value).sort()
        expect(values).toEqual(['beta_testers', 'staff'])
      })

      test('includes explicitly disabled groups', async () => {
        const { default: Dsl } = await import('./Dsl.js')
        const dsl = new Dsl(adapter)
        dsl.register('admins', (_actor: unknown) => true)
        dsl.register('disabled', (_actor: unknown) => true)

        const featureWithGroups = new Feature('test-feature', adapter, dsl.groups)
        featureWithGroups.enableGroup('disabled')
        featureWithGroups.disableGroup('disabled')

        const disabled = featureWithGroups.disabledGroups()
        expect(disabled).toHaveLength(2)
        const values = disabled.map(g => g.value).sort()
        expect(values).toEqual(['admins', 'disabled'])
      })

      test('returns empty array when all groups are enabled', async () => {
        const { default: Dsl } = await import('./Dsl.js')
        const dsl = new Dsl(adapter)
        dsl.register('admins', (_actor: unknown) => true)
        dsl.register('beta_testers', (_actor: unknown) => true)

        const featureWithGroups = new Feature('test-feature', adapter, dsl.groups)
        featureWithGroups.enableGroup('admins')
        featureWithGroups.enableGroup('beta_testers')

        expect(featureWithGroups.disabledGroups()).toEqual([])
      })
    })

    describe('gate access methods', () => {
      test('gate returns gate by name', () => {
        const actorGate = feature.gate('actor')
        expect(actorGate).toBeDefined()
        expect(actorGate?.name).toBe('actor')
      })

      test('gate returns undefined for non-existent gate', () => {
        const gate = feature.gate('non-existent')
        expect(gate).toBeUndefined()
      })

      test('gateFor returns correct gate for actor', () => {
        const actor = { flipperId: '123' }
        const gate = feature.gateFor(actor)
        expect(gate.name).toBe('actor')
      })

      test('gateFor returns correct gate for boolean', () => {
        const gate = feature.gateFor(true)
        expect(gate.name).toBe('boolean')
      })

      test('gateFor returns correct gate for group', async () => {
        const { default: Dsl } = await import('./Dsl.js')
        const { default: GroupType } = await import('./GroupType.js')
        const dsl = new Dsl(adapter)
        dsl.register('admins', (_actor: unknown) => true)
        const featureWithGroups = new Feature('test-feature', adapter, dsl.groups)

        const group = new GroupType('admins', (_actor: unknown) => true)
        const gate = featureWithGroups.gateFor(group)
        expect(gate.name).toBe('group')
      })

      test('gateFor returns correct gate for PercentageOfActorsType', async () => {
        const { default: PercentageOfActorsType } = await import('./PercentageOfActorsType.js')
        const percentage = new PercentageOfActorsType(25)
        const gate = feature.gateFor(percentage)
        expect(gate.name).toBe('percentageOfActors')
      })

      test('gateFor throws error for unsupported type', () => {
        expect(() => {
          feature.gateFor(Symbol('test'))
        }).toThrow('No gate found')
      })

      test('gatesHash returns gates by name', () => {
        const hash = feature.gatesHash()
        expect(hash).toBeDefined()
        expect(hash['actor']).toBeDefined()
        expect(hash['actor']?.name).toBe('actor')
        expect(hash['boolean']).toBeDefined()
        expect(hash['group']).toBeDefined()
        expect(hash['percentageOfActors']).toBeDefined()
        expect(hash['percentageOfTime']).toBeDefined()
        expect(Object.keys(hash)).toHaveLength(5)
      })
    })

    describe('toString', () => {
      test('returns feature name', () => {
        const testFeature = new Feature('my-feature', adapter, {})
        expect(testFeature.toString()).toBe('my-feature')
      })
    })

    describe('toJSON', () => {
      test('returns JSON-serializable object with feature details', () => {
        const testFeature = new Feature('debug-feature', adapter, {})
        testFeature.enable()
        const result = testFeature.toJSON()
        expect(result).toEqual({
          name: 'debug-feature',
          state: 'on',
          enabledGates: ['boolean'],
          adapter: 'memory'
        })
      })

      test('works with JSON.stringify', () => {
        const testFeature = new Feature('json-feature', adapter, {})
        testFeature.enable()
        const json = JSON.stringify(testFeature)
        const parsed = JSON.parse(json) as { name: string; state: string; enabledGates: string[]; adapter: string }
        expect(parsed.name).toBe('json-feature')
        expect(parsed.state).toBe('on')
      })
    })

    describe('Node.js inspect', () => {
      test('returns pretty debug string', () => {
        const testFeature = new Feature('inspect-feature', adapter, {})
        testFeature.enable()
        const inspectSymbol = Symbol.for('nodejs.util.inspect.custom')
        const result = (testFeature as unknown as Record<symbol, () => string>)[inspectSymbol]!()
        expect(result).toBe('Feature(inspect-feature) { state: on, gates: [boolean] }')
      })

      test('shows conditional state with multiple gates', () => {
        const testFeature = new Feature('multi-gate', adapter, {})
        testFeature.enableActor(makeActor(1))
        testFeature.enableGroup('admins')
        const inspectSymbol = Symbol.for('nodejs.util.inspect.custom')
        const result = (testFeature as unknown as Record<symbol, () => string>)[inspectSymbol]!()
        expect(result).toBe('Feature(multi-gate) { state: conditional, gates: [actor, group] }')
      })
    })
  })
})
