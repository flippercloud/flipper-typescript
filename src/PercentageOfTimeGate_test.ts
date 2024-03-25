import PercentageOfTimeGate from './PercentageOfTimeGate'

const gate = new PercentageOfTimeGate()

describe('PercentageOfTimeGate', () => {
  test('has name, key, and dataType', () => {
    expect(gate.name).toBe('percentageOfTime')
    expect(gate.key).toBe('percentageOfTime')
    expect(gate.dataType).toBe('number')
  })
})
