import ActorGate from './ActorGate'
import { assert } from 'chai'
import 'mocha'

const gate = new ActorGate()

suite('ActorGate', () => {
  test('has name, key, and dataType', () => {
    assert.equal(gate.name, 'actor')
    assert.equal(gate.key, 'actors')
    assert.equal(gate.dataType, 'set')
  })
})
