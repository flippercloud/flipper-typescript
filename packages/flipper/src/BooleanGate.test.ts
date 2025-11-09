import BooleanGate from './BooleanGate'

const gate = new BooleanGate()

describe('BooleanGate', () => {
  test('has name, key, and dataType', () => {
    expect(gate.name).toBe('boolean')
    expect(gate.key).toBe('boolean')
    expect(gate.dataType).toBe('boolean')
  })
})
