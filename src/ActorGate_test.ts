import { assert, suite, test } from './test_helper'
import ActorGate from './ActorGate'

const gate = new ActorGate()

suite('ActorGate', () => {
  test('has name, key, and dataType', () => {
    assert.equal(gate.name, 'actor')
    assert.equal(gate.key, 'actors')
    assert.equal(gate.dataType, 'set')
  })
})
