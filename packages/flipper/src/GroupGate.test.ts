import ActorType from './ActorType'
import FeatureCheckContext from './FeatureCheckContext'
import GateValues from './GateValues'
import GroupGate from './GroupGate'
import GroupType from './GroupType'

describe('GroupGate', () => {
  const gate = new GroupGate({})

  test('has name, key, and dataType', () => {
    expect(gate.name).toBe('group')
    expect(gate.key).toBe('groups')
    expect(gate.dataType).toBe('set')
  })

  test('isOpen returns false when actor flipperId is missing (even if group callback matches)', () => {
    const groups = {
      admins: new GroupType('admins', () => true),
    }

    const groupGate = new GroupGate(groups)
    const values = new GateValues({ groups: ['admins'] })

    // Note: flipperId is present as a key, but the value is invalid at runtime.
    // Ruby treats this like "no actor".
    const actorWithMissingId = { flipperId: undefined as unknown as string, role: 'admin' }
    const actorType = ActorType.wrap(actorWithMissingId as unknown)

    const context = new FeatureCheckContext('feature-1', values, actorType)
    expect(groupGate.isOpen(context)).toEqual(false)
  })
})
