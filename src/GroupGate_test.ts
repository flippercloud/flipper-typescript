import GroupGate from './GroupGate'

const gate = new GroupGate({})

describe('GroupGate', () => {
  test('has name, key, and dataType', () => {
    expect(gate.name).toBe('group')
    expect(gate.key).toBe('groups')
    expect(gate.dataType).toBe('set')
  })
})
