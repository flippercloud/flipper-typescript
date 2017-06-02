import PercentageOfTimeGate from './PercentageOfTimeGate'
import { assert, suite, test } from './test_helper'

const gate = new PercentageOfTimeGate()

suite('PercentageOfTimeGate', () => {
  test('has name, key, and dataType', () => {
    assert.equal(gate.name, 'percentageOfTime')
    assert.equal(gate.key, 'percentageOfTime')
    assert.equal(gate.dataType, 'number')
  })
})
