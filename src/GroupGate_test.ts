import GroupGate from './GroupGate'
import { assert, suite, test } from './test_helper'

const gate = new GroupGate()

suite('GroupGate', () => {
  test('has name, key, and dataType', () => {
    assert.equal(gate.name, 'group')
    assert.equal(gate.key, 'groups')
    assert.equal(gate.dataType, 'set')
  })
})
