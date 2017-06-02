import BooleanGate from './BooleanGate'
import { assert, suite, test } from './test_helper'

const gate = new BooleanGate()

suite('BooleanGate', () => {
  test('has name, key, and dataType', () => {
    assert.equal(gate.name, 'boolean')
    assert.equal(gate.key, 'boolean')
    assert.equal(gate.dataType, 'boolean')
  })
})
