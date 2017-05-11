import MemoryAdapter from './MemoryAdapter'
import Feature from './Feature'
import { assert } from 'chai'
import 'mocha'

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

  test('removes feature and clears gate', () => {
    adapter.add(feature)
    adapter.enable(feature)
    assert.lengthOf(adapter.features(), 1)
    assert.equal(adapter.get(feature), true)
    adapter.remove(feature)
    assert.lengthOf(adapter.features(), 0)
    assert.equal(adapter.get(feature), undefined)
  })

  test('gets, enables, disables, and clears feature gate', () => {
    assert.equal(adapter.get(feature), undefined)
    adapter.enable(feature)
    assert.equal(adapter.get(feature), true)
    adapter.disable(feature)
    assert.equal(adapter.get(feature), false)
    adapter.clear(feature)
    assert.equal(adapter.get(feature), undefined)
  })
})
