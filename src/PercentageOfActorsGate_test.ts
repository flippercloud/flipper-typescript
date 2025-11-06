import PercentageOfActorsGate from './PercentageOfActorsGate'

const gate = new PercentageOfActorsGate()

describe('PercentageOfActorsGate', () => {
  test('has name, key, and dataType', () => {
    expect(gate.name).toBe('percentageOfActors')
    expect(gate.key).toBe('percentageOfActors')
    expect(gate.dataType).toBe('number')
  })
})
