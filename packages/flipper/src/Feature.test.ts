import Feature from './Feature'
import MemoryAdapter from './MemoryAdapter'
import MemoryInstrumenter from './instrumenters/MemoryInstrumenter'
import { makeActor } from './testHelpers'

let adapter: MemoryAdapter
let feature: Feature

describe('Feature', () => {
  beforeEach(() => {
    adapter = new MemoryAdapter()
    feature = new Feature('feature-1', adapter, {})
  })

  describe('gate precedence (Ruby parity)', () => {
    test('percentage of time wins over group when both are enabled', async () => {
      const { default: Dsl } = await import('./Dsl.js')
      const dsl = new Dsl(adapter)
      dsl.register('admins', (_actor: unknown) => true)

      const instrumenter = new MemoryInstrumenter()
      const featureWithGroups = new Feature('precedence-feature', adapter, dsl.groups, {
        instrumenter,
      })

      const actor = makeActor(1)
      await featureWithGroups.enableGroup('admins')
      await featureWithGroups.enablePercentageOfTime(100)

      instrumenter.reset()
      expect(await featureWithGroups.isEnabled(actor)).toEqual(true)
      const event = instrumenter.eventByName('feature_operation.flipper')
      expect(event?.payload.gate_name).toEqual('percentageOfTime')
    })

    test('expression evaluates using actor properties', async () => {
      const { default: Flipper } = await import('./Flipper.js')

      const instrumenter = new MemoryInstrumenter()
      const featureWithInstrumenter = new Feature('expression-actor-props', adapter, {}, {
        instrumenter,
      })

      await featureWithInstrumenter.enableExpression(Flipper.property('admin'))

      const actorWithProps = {
        flipperId: 'actor:1',
        flipperProperties: { admin: true },
      }

      instrumenter.reset()
      expect(await featureWithInstrumenter.isEnabled(actorWithProps)).toEqual(true)
      const event = instrumenter.eventByName('feature_operation.flipper')
      expect(event?.payload.gate_name).toEqual('expression')
    })
  })

  test('has name', () => {
    expect(feature.name).toEqual('feature-1')
  })

  test('enable and disable feature', async () => {
    expect(await feature.isEnabled()).toEqual(false)
    await feature.enable()
    expect(await feature.isEnabled()).toEqual(true)
    await feature.disable()
    expect(await feature.isEnabled()).toEqual(false)
  })

  test('enable and disable feature for actor', async () => {
    const actor = makeActor(5)
    expect(await feature.isEnabled(actor)).toEqual(false)
    await feature.enableActor(actor)
    expect(await feature.isEnabled(actor)).toEqual(true)
    await feature.disableActor(actor)
    expect(await feature.isEnabled(actor)).toEqual(false)
  })

  describe('disableExpression', () => {
    test('only clears the expression gate (does not clear other gate values)', async () => {
      const { default: Flipper } = await import('./Flipper.js')

      const enabledActor = makeActor(1)
      const expressionActor = {
        flipperId: 'actor:2',
        flipperProperties: { admin: true },
      }

      await feature.enableActor(enabledActor)
      await feature.enableExpression(Flipper.property('admin'))

      // Expression is active pre-disable.
      expect(await feature.isEnabled(expressionActor)).toEqual(true)

      await feature.disableExpression()

      // Actor enablement should remain.
      expect(await feature.isEnabled(enabledActor)).toEqual(true)

      // Expression should be removed.
      expect(await feature.isEnabled(expressionActor)).toEqual(false)
      expect(await feature.enabledGateNames()).toEqual(['actor'])
    })
  })

  describe('disablePercentageOfActors', () => {
    test('sets percentage to 0', async () => {
      await feature.enablePercentageOfActors(25)
      expect(await feature.percentageOfActorsValue()).toEqual(25)
      await feature.disablePercentageOfActors()
      expect(await feature.percentageOfActorsValue()).toEqual(0)
    })

    test('disables feature for actors', async () => {
      const actor = makeActor(5)
      await feature.enablePercentageOfActors(100)
      expect(await feature.isEnabled(actor)).toEqual(true)
      await feature.disablePercentageOfActors()
      expect(await feature.isEnabled(actor)).toEqual(false)
    })

    test('can be called when already disabled', async () => {
      expect(await feature.percentageOfActorsValue()).toEqual(0)
      await feature.disablePercentageOfActors()
      expect(await feature.percentageOfActorsValue()).toEqual(0)
    })

    test('does not clear other gate values', async () => {
      const actor = makeActor(5)

      await feature.enableActor(actor)
      await feature.enablePercentageOfActors(50)

      await feature.disablePercentageOfActors()

      // Actor enablement should remain after disabling the percentage gate.
      expect(await feature.isEnabled(actor)).toEqual(true)
    })
  })

  describe('disablePercentageOfTime', () => {
    test('sets percentage to 0', async () => {
      await feature.enablePercentageOfTime(50)
      expect(await feature.percentageOfTimeValue()).toEqual(50)
      await feature.disablePercentageOfTime()
      expect(await feature.percentageOfTimeValue()).toEqual(0)
    })

    test('disables feature', async () => {
      await feature.enablePercentageOfTime(100)
      expect(await feature.isEnabled()).toEqual(true)
      await feature.disablePercentageOfTime()
      expect(await feature.isEnabled()).toEqual(false)
    })

    test('can be called when already disabled', async () => {
      expect(await feature.percentageOfTimeValue()).toEqual(0)
      await feature.disablePercentageOfTime()
      expect(await feature.percentageOfTimeValue()).toEqual(0)
    })

    test('does not clear other gate values', async () => {
      const actor = makeActor(5)

      await feature.enableActor(actor)
      await feature.enablePercentageOfTime(50)

      await feature.disablePercentageOfTime()

      // Actor enablement should remain after disabling the percentage gate.
      expect(await feature.isEnabled(actor)).toEqual(true)
    })
  })

  describe('state', () => {
    describe('when fully on (boolean gate)', () => {
      beforeEach(async () => {
        await feature.enable()
      })

      test('returns "on"', async () => {
        expect(await feature.state()).toEqual('on')
      })

      test('isOn returns true', async () => {
        expect(await feature.isOn()).toEqual(true)
      })

      test('isOff returns false', async () => {
        expect(await feature.isOff()).toEqual(false)
      })

      test('isConditional returns false', async () => {
        expect(await feature.isConditional()).toEqual(false)
      })
    })

    describe('when percentage of time is 100', () => {
      beforeEach(async () => {
        await feature.enablePercentageOfTime(100)
      })

      test('returns "on"', async () => {
        expect(await feature.state()).toEqual('on')
      })

      test('isOn returns true', async () => {
        expect(await feature.isOn()).toEqual(true)
      })

      test('isOff returns false', async () => {
        expect(await feature.isOff()).toEqual(false)
      })

      test('isConditional returns false', async () => {
        expect(await feature.isConditional()).toEqual(false)
      })
    })

    describe('when percentage of actors is 100', () => {
      beforeEach(async () => {
        await feature.enablePercentageOfActors(100)
      })

      test('returns "conditional"', async () => {
        expect(await feature.state()).toEqual('conditional')
      })

      test('isOn returns false', async () => {
        expect(await feature.isOn()).toEqual(false)
      })

      test('isOff returns false', async () => {
        expect(await feature.isOff()).toEqual(false)
      })

      test('isConditional returns true', async () => {
        expect(await feature.isConditional()).toEqual(true)
      })
    })

    describe('when fully off', () => {
      beforeEach(async () => {
        await feature.disable()
      })

      test('returns "off"', async () => {
        expect(await feature.state()).toEqual('off')
      })

      test('isOn returns false', async () => {
        expect(await feature.isOn()).toEqual(false)
      })

      test('isOff returns true', async () => {
        expect(await feature.isOff()).toEqual(true)
      })

      test('isConditional returns false', async () => {
        expect(await feature.isConditional()).toEqual(false)
      })
    })

    describe('when partially on (percentage of time)', () => {
      beforeEach(async () => {
        await feature.enablePercentageOfTime(5)
      })

      test('returns "conditional"', async () => {
        expect(await feature.state()).toEqual('conditional')
      })

      test('isOn returns false', async () => {
        expect(await feature.isOn()).toEqual(false)
      })

      test('isOff returns false', async () => {
        expect(await feature.isOff()).toEqual(false)
      })

      test('isConditional returns true', async () => {
        expect(await feature.isConditional()).toEqual(true)
      })
    })

    describe('when enabled for actor', () => {
      beforeEach(async () => {
        const actor = makeActor(5)
        await feature.enableActor(actor)
      })

      test('returns "conditional"', async () => {
        expect(await feature.state()).toEqual('conditional')
      })

      test('isConditional returns true', async () => {
        expect(await feature.isConditional()).toEqual(true)
      })
    })

    describe('when enabled for group', () => {
      beforeEach(async () => {
        await feature.enableGroup('admins')
      })

      test('returns "conditional"', async () => {
        expect(await feature.state()).toEqual('conditional')
      })

      test('isConditional returns true', async () => {
        expect(await feature.isConditional()).toEqual(true)
      })
    })
  })

  describe('value retrieval methods', () => {
    describe('booleanValue', () => {
      test('returns false when feature is disabled', async () => {
        expect(await feature.booleanValue()).toEqual(false)
      })

      test('returns true when feature is fully enabled', async () => {
        await feature.enable()
        expect(await feature.booleanValue()).toEqual(true)
      })

      test('returns false when only actor is enabled', async () => {
        await feature.enableActor(makeActor(1))
        expect(await feature.booleanValue()).toEqual(false)
      })
    })

    describe('actorsValue', () => {
      test('returns empty set when no actors enabled', async () => {
        expect(await feature.actorsValue()).toEqual(new Set())
      })

      test('returns set with single actor id', async () => {
        const actor = makeActor(5)
        await feature.enableActor(actor)
        expect(await feature.actorsValue()).toEqual(new Set(['actor:5']))
      })

      test('returns set with multiple actor ids', async () => {
        await feature.enableActor(makeActor(1))
        await feature.enableActor(makeActor(2))
        await feature.enableActor(makeActor(3))
        expect(await feature.actorsValue()).toEqual(new Set(['actor:1', 'actor:2', 'actor:3']))
      })

      test('reflects removal of actors', async () => {
        await feature.enableActor(makeActor(1))
        await feature.enableActor(makeActor(2))
        await feature.disableActor(makeActor(1))
        expect(await feature.actorsValue()).toEqual(new Set(['actor:2']))
      })
    })

    describe('groupsValue', () => {
      test('returns empty set when no groups enabled', async () => {
        expect(await feature.groupsValue()).toEqual(new Set())
      })

      test('returns set with single group name', async () => {
        await feature.enableGroup('admins')
        expect(await feature.groupsValue()).toEqual(new Set(['admins']))
      })

      test('returns set with multiple group names', async () => {
        await feature.enableGroup('admins')
        await feature.enableGroup('early_access')
        await feature.enableGroup('beta_testers')
        expect(await feature.groupsValue()).toEqual(
          new Set(['admins', 'early_access', 'beta_testers'])
        )
      })

      test('reflects removal of groups', async () => {
        await feature.enableGroup('admins')
        await feature.enableGroup('beta_testers')
        await feature.disableGroup('admins')
        expect(await feature.groupsValue()).toEqual(new Set(['beta_testers']))
      })
    })

    describe('percentageOfActorsValue', () => {
      test('returns 0 when not enabled', async () => {
        expect(await feature.percentageOfActorsValue()).toEqual(0)
      })

      test('returns the percentage when enabled', async () => {
        await feature.enablePercentageOfActors(25)
        expect(await feature.percentageOfActorsValue()).toEqual(25)
      })

      test('returns updated percentage when changed', async () => {
        await feature.enablePercentageOfActors(10)
        expect(await feature.percentageOfActorsValue()).toEqual(10)
        await feature.enablePercentageOfActors(50)
        expect(await feature.percentageOfActorsValue()).toEqual(50)
      })

      test('returns 100 when fully enabled via percentage', async () => {
        await feature.enablePercentageOfActors(100)
        expect(await feature.percentageOfActorsValue()).toEqual(100)
      })
    })

    describe('percentageOfTimeValue', () => {
      test('returns 0 when not enabled', async () => {
        expect(await feature.percentageOfTimeValue()).toEqual(0)
      })

      test('returns the percentage when enabled', async () => {
        await feature.enablePercentageOfTime(15)
        expect(await feature.percentageOfTimeValue()).toEqual(15)
      })

      test('returns updated percentage when changed', async () => {
        await feature.enablePercentageOfTime(20)
        expect(await feature.percentageOfTimeValue()).toEqual(20)
        await feature.enablePercentageOfTime(75)
        expect(await feature.percentageOfTimeValue()).toEqual(75)
      })

      test('returns 100 when fully enabled via percentage', async () => {
        await feature.enablePercentageOfTime(100)
        expect(await feature.percentageOfTimeValue()).toEqual(100)
      })
    })
  })

  describe('management methods', () => {
    describe('add', () => {
      test('adds feature to adapter', async () => {
        expect(await adapter.features()).toHaveLength(0)
        await feature.add()
        const features = await adapter.features()
        expect(features).toHaveLength(1)
        expect(features[0]?.name).toEqual('feature-1')
      })

      test('is idempotent', async () => {
        await feature.add()
        await feature.add()
        expect(await adapter.features()).toHaveLength(1)
      })

      test('returns true', async () => {
        expect(await feature.add()).toEqual(true)
      })
    })

    describe('exist', () => {
      test('returns false when feature not added', async () => {
        expect(await feature.exist()).toEqual(false)
      })

      test('returns true when feature added', async () => {
        await feature.add()
        expect(await feature.exist()).toEqual(true)
      })

      test('returns false after feature removed', async () => {
        await feature.add()
        await feature.remove()
        expect(await feature.exist()).toEqual(false)
      })
    })

    describe('remove', () => {
      test('removes feature from adapter', async () => {
        await feature.add()
        expect(await adapter.features()).toHaveLength(1)
        await feature.remove()
        expect(await adapter.features()).toHaveLength(0)
      })

      test('clears all gate values when removing', async () => {
        await feature.enable()
        await feature.enableActor(makeActor(1))
        await feature.enableGroup('admins')
        expect(await feature.booleanValue()).toEqual(true)
        expect((await feature.actorsValue()).size).toBeGreaterThan(0)

        await feature.remove()

        expect(await feature.booleanValue()).toEqual(false)
        expect(await feature.actorsValue()).toEqual(new Set())
        expect(await feature.groupsValue()).toEqual(new Set())
      })

      test('returns true', async () => {
        await feature.add()
        expect(await feature.remove()).toEqual(true)
      })
    })

    describe('clear', () => {
      test('clears all gate values', async () => {
        await feature.enable()
        await feature.enableActor(makeActor(1))
        await feature.enableGroup('admins')
        await feature.enablePercentageOfActors(50)
        await feature.enablePercentageOfTime(25)

        expect(await feature.booleanValue()).toEqual(true)
        expect((await feature.actorsValue()).size).toBeGreaterThan(0)
        expect((await feature.groupsValue()).size).toBeGreaterThan(0)
        expect(await feature.percentageOfActorsValue()).toEqual(50)
        expect(await feature.percentageOfTimeValue()).toEqual(25)

        await feature.clear()

        expect(await feature.booleanValue()).toEqual(false)
        expect(await feature.actorsValue()).toEqual(new Set())
        expect(await feature.groupsValue()).toEqual(new Set())
        expect(await feature.percentageOfActorsValue()).toEqual(0)
        expect(await feature.percentageOfTimeValue()).toEqual(0)
      })

      test('does not remove feature from adapter', async () => {
        await feature.add()
        await feature.clear()
        expect(await feature.exist()).toEqual(true)
      })

      test('returns true', async () => {
        expect(await feature.clear()).toEqual(true)
      })
    })
  })

  describe('gate access methods', () => {
    describe('enabledGates', () => {
      test('returns empty array when no gates enabled', async () => {
        expect(await feature.enabledGates()).toEqual([])
      })

      test('returns array with boolean gate when fully enabled', async () => {
        await feature.enable()
        const enabled = await feature.enabledGates()
        expect(enabled).toHaveLength(1)
        expect(enabled[0]?.name).toEqual('boolean')
      })

      test('returns array with actor gate when actor enabled', async () => {
        await feature.enableActor(makeActor(1))
        const enabled = await feature.enabledGates()
        expect(enabled).toHaveLength(1)
        expect(enabled[0]?.name).toEqual('actor')
      })

      test('returns array with group gate when group enabled', async () => {
        await feature.enableGroup('admins')
        const enabled = await feature.enabledGates()
        expect(enabled).toHaveLength(1)
        expect(enabled[0]?.name).toEqual('group')
      })

      test('returns array with percentage of actors gate when enabled', async () => {
        await feature.enablePercentageOfActors(25)
        const enabled = await feature.enabledGates()
        expect(enabled).toHaveLength(1)
        expect(enabled[0]?.name).toEqual('percentageOfActors')
      })

      test('returns array with percentage of time gate when enabled', async () => {
        await feature.enablePercentageOfTime(50)
        const enabled = await feature.enabledGates()
        expect(enabled).toHaveLength(1)
        expect(enabled[0]?.name).toEqual('percentageOfTime')
      })

      test('returns multiple gates when multiple enabled', async () => {
        await feature.enableActor(makeActor(1))
        await feature.enableGroup('admins')
        await feature.enablePercentageOfActors(25)
        const enabled = await feature.enabledGates()
        expect(enabled).toHaveLength(3)
        const names = enabled.map(g => g.name)
        expect(names).toContain('actor')
        expect(names).toContain('group')
        expect(names).toContain('percentageOfActors')
      })
    })

    describe('disabledGates', () => {
      test('returns all gates when none enabled', async () => {
        const disabled = await feature.disabledGates()
        expect(disabled).toHaveLength(6)
      })

      test('returns 5 gates when boolean enabled', async () => {
        await feature.enable()
        const disabled = await feature.disabledGates()
        expect(disabled).toHaveLength(5)
        const names = disabled.map(g => g.name)
        expect(names).not.toContain('boolean')
      })

      test('returns empty array when all non-conflicting gates enabled', async () => {
        const { default: Flipper } = await import('./Flipper.js')
        // Boolean gate conflicts with others, so don't enable it
        await feature.enableActor(makeActor(1))
        await feature.enableExpression(Flipper.constant(true))
        await feature.enableGroup('admins')
        await feature.enablePercentageOfActors(25)
        await feature.enablePercentageOfTime(50)
        const disabled = await feature.disabledGates()
        // Only boolean should be disabled
        expect(disabled).toHaveLength(1)
        expect(disabled[0]?.name).toBe('boolean')
      })
    })

    describe('enabledGateNames', () => {
      test('returns empty array when no gates enabled', async () => {
        expect(await feature.enabledGateNames()).toEqual([])
      })

      test('returns gate names when enabled', async () => {
        await feature.enableActor(makeActor(1))
        await feature.enableGroup('admins')
        expect(await feature.enabledGateNames()).toEqual(['actor', 'group'])
      })
    })

    describe('disabledGateNames', () => {
      test('returns all gate names when none enabled', async () => {
        const names = await feature.disabledGateNames()
        expect(names).toHaveLength(6)
        expect(names).toContain('actor')
        expect(names).toContain('boolean')
        expect(names).toContain('expression')
        expect(names).toContain('group')
        expect(names).toContain('percentageOfActors')
        expect(names).toContain('percentageOfTime')
      })

      test('returns remaining gate names when some enabled', async () => {
        await feature.enable()
        await feature.enableActor(makeActor(1))
        const names = await feature.disabledGateNames()
        expect(names).toHaveLength(4)
        expect(names).toContain('expression')
        expect(names).toContain('group')
        expect(names).toContain('percentageOfActors')
        expect(names).toContain('percentageOfTime')
      })
    })
  })

  describe('group helper methods', () => {
    describe('enabledGroups', () => {
      test('returns empty array when no groups registered', async () => {
        expect(await feature.enabledGroups()).toEqual([])
      })

      test('returns empty array when no groups enabled', async () => {
        const { default: Dsl } = await import('./Dsl.js')
        const dsl = new Dsl(adapter)
        dsl.register('admins', (_actor: unknown) => true)
        dsl.register('beta_testers', (_actor: unknown) => true)
        const featureWithGroups = new Feature('test-feature', adapter, dsl.groups)

        expect(await featureWithGroups.enabledGroups()).toEqual([])
      })

      test('returns array of enabled group instances', async () => {
        const { default: Dsl } = await import('./Dsl.js')
        const dsl = new Dsl(adapter)
        const adminsCallback = (_actor: unknown) => true
        const betaCallback = (_actor: unknown) => false
        dsl.register('admins', adminsCallback)
        dsl.register('beta_testers', betaCallback)

        const featureWithGroups = new Feature('test-feature', adapter, dsl.groups)
        await featureWithGroups.enableGroup('admins')

        const enabled = await featureWithGroups.enabledGroups()
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
        await featureWithGroups.enableGroup('admins')
        await featureWithGroups.enableGroup('beta_testers')
        await featureWithGroups.enableGroup('staff')

        const enabled = await featureWithGroups.enabledGroups()
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
        await featureWithGroups.enableGroup('admins')
        await featureWithGroups.enableGroup('disabled')
        await featureWithGroups.disableGroup('disabled')

        const enabled = await featureWithGroups.enabledGroups()
        expect(enabled).toHaveLength(1)
        expect(enabled[0]?.value).toEqual('admins')
      })
    })

    describe('disabledGroups', () => {
      test('returns empty array when no groups registered', async () => {
        expect(await feature.disabledGroups()).toEqual([])
      })

      test('returns all groups when none enabled', async () => {
        const { default: Dsl } = await import('./Dsl.js')
        const dsl = new Dsl(adapter)
        dsl.register('admins', (_actor: unknown) => true)
        dsl.register('beta_testers', (_actor: unknown) => true)

        const featureWithGroups = new Feature('test-feature', adapter, dsl.groups)

        const disabled = await featureWithGroups.disabledGroups()
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
        await featureWithGroups.enableGroup('admins')

        const disabled = await featureWithGroups.disabledGroups()
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
        await featureWithGroups.enableGroup('disabled')
        await featureWithGroups.disableGroup('disabled')

        const disabled = await featureWithGroups.disabledGroups()
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
        await featureWithGroups.enableGroup('admins')
        await featureWithGroups.enableGroup('beta_testers')

        expect(await featureWithGroups.disabledGroups()).toEqual([])
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
        expect(Object.keys(hash)).toHaveLength(6)
      })
    })

    describe('toString', () => {
      test('returns feature name', () => {
        const testFeature = new Feature('my-feature', adapter, {})
        expect(testFeature.toString()).toBe('my-feature')
      })
    })

    describe('toJSON', () => {
      test('returns JSON-serializable object with feature details', async () => {
        const testFeature = new Feature('debug-feature', adapter, {})
        await testFeature.enable()
        const result = await testFeature.toJSON()
        expect(result).toEqual({
          name: 'debug-feature',
          state: 'on',
          enabledGates: ['boolean'],
          adapter: 'memory',
        })
      })

      test('works with JSON.stringify', async () => {
        const testFeature = new Feature('json-feature', adapter, {})
        await testFeature.enable()
        const json = JSON.stringify(await testFeature.toJSON())
        const parsed = JSON.parse(json) as {
          name: string
          state: string
          enabledGates: string[]
          adapter: string
        }
        expect(parsed.name).toBe('json-feature')
        expect(parsed.state).toBe('on')
      })
    })

    describe('Node.js inspect', () => {
      test('returns pretty debug string', async () => {
        const testFeature = new Feature('inspect-feature', adapter, {})
        await testFeature.enable()
        const inspectSymbol = Symbol.for('nodejs.util.inspect.custom')
        const result = await (testFeature as unknown as Record<symbol, () => Promise<string>>)[
          inspectSymbol
        ]!()
        expect(result).toBe('Feature(inspect-feature) { state: on, gates: [boolean] }')
      })

      test('shows conditional state with multiple gates', async () => {
        const testFeature = new Feature('multi-gate', adapter, {})
        await testFeature.enableActor(makeActor(1))
        await testFeature.enableGroup('admins')
        const inspectSymbol = Symbol.for('nodejs.util.inspect.custom')
        const result = await (testFeature as unknown as Record<symbol, () => Promise<string>>)[
          inspectSymbol
        ]!()
        expect(result).toBe('Feature(multi-gate) { state: conditional, gates: [actor, group] }')
      })
    })
  })
})
