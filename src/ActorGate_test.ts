import ActorGate from './ActorGate'

const gate = new ActorGate()

describe('ActorGate', () => {
  test('has name, key, and dataType', () => {
    expect(gate.name).toEqual('actor')
    expect(gate.key).toEqual('actors')
    expect(gate.dataType).toEqual('set')
  })
})
