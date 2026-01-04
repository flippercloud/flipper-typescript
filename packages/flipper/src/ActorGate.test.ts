import ActorGate from './ActorGate'
import ActorType from './ActorType'
import FeatureCheckContext from './FeatureCheckContext'
import GateValues from './GateValues'

const gate = new ActorGate()

describe('ActorGate', () => {
  test('has name, key, and dataType', () => {
    expect(gate.name).toEqual('actor')
    expect(gate.key).toEqual('actors')
    expect(gate.dataType).toEqual('set')
  })

  test('isOpen returns false when actor flipperId is missing', () => {
    const values = new GateValues({ actors: ['undefined'] })

    // Note: flipperId is present as a key, but the value is invalid at runtime.
    // Ruby treats this like "no actor".
    const actorWithMissingId = { flipperId: undefined as unknown as string }
    const actorType = ActorType.wrap(actorWithMissingId as unknown)

    const context = new FeatureCheckContext('feature-1', values, actorType)
    expect(gate.isOpen(context)).toEqual(false)
  })
})
