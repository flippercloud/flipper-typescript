import PercentageOfActorsGate from './PercentageOfActorsGate'
import { assert } from 'chai'
import 'mocha'

const gate = new PercentageOfActorsGate()

suite('PercentageOfActorsGate', () => {
  test('has name, key, and dataType', () => {
    assert.equal(gate.name, 'percentage_of_actors')
    assert.equal(gate.key, 'percentage_of_actors')
    assert.equal(gate.dataType, 'number')
  })
})
