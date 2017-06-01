import { assert, suite, test } from './test_helper'
import PercentageOfActorsGate from './PercentageOfActorsGate'

const gate = new PercentageOfActorsGate()

suite('PercentageOfActorsGate', () => {
  test('has name, key, and dataType', () => {
    assert.equal(gate.name, 'percentageOfActors')
    assert.equal(gate.key, 'percentageOfActors')
    assert.equal(gate.dataType, 'number')
  })
})
