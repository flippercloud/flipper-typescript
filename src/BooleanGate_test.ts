import BooleanGate from './BooleanGate'
import { assert } from 'chai'
import 'mocha'

const gate = new BooleanGate()

suite('BooleanGate', () => {
  test('has name, key, and dataType', () => {
    assert.equal(gate.name, 'boolean')
    assert.equal(gate.key, 'boolean')
    assert.equal(gate.dataType, 'boolean')
  })
})
