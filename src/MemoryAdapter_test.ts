import { assert, suite, test } from './test_helper'
import MemoryAdapter from './MemoryAdapter'
import BooleanGate from './BooleanGate'
import Feature from './Feature'

let adapter: MemoryAdapter
let feature: Feature

suite('MemoryAdapter', () => {
  setup(() => {
    adapter = new MemoryAdapter()
    feature = new Feature('feature-1', adapter)
  })

  test('has a name', () => {
    assert.equal(adapter.name, 'memory')
  })

  test('starts with no features', () => {
    assert.typeOf(adapter.features(), 'array')
    assert.lengthOf(adapter.features(), 0)
  })

  test('adds feature', () => {
    adapter.add(feature)
    assert.lengthOf(adapter.features(), 1)
    assert.equal(adapter.features()[0], feature)
  })

  test('adds and removes feature and clears feature gates', () => {
    let gates
    const gate = new BooleanGate()
    adapter.add(feature)
    adapter.enable(feature, gate, true)
    assert.lengthOf(adapter.features(), 1)
    gates = adapter.get(feature)
    assert.equal(gates['boolean'], 'true')
    adapter.remove(feature)
    assert.lengthOf(adapter.features(), 0)
    gates = adapter.get(feature)
    assert.equal(gates['boolean'], undefined)
    assert.lengthOf(Object.keys(gates['actors']), 0)
  })

  test('gets, enables, disables, and clears boolean feature gate', () => {
    let gates
    const gate = new BooleanGate()
    adapter.enable(feature, gate, true)
    gates = adapter.get(feature)
    assert.equal(gates['boolean'], 'true')
    adapter.disable(feature, gate, true)
    gates = adapter.get(feature)
    assert.equal(gates['boolean'], undefined)
    adapter.clear(feature)
    gates = adapter.get(feature)
    assert.equal(gates['boolean'], undefined)
    assert.lengthOf(Object.keys(gates['actors']), 0)
  })
})
