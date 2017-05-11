import MemoryAdapter from './MemoryAdapter'
import { assert } from 'chai'
import 'mocha'

let adapter: MemoryAdapter

suite('MemoryAdapter', () => {
  setup(() => {
    adapter = new MemoryAdapter()
  })

  test('has a name', () => {
    assert.equal(adapter.name, 'memory')
  })

  test('starts with no features', () => {
    assert.typeOf(adapter.features(), 'array')
    assert.lengthOf(adapter.features(), 0)
  })

  test('adds feature', () => {
    const feature = {name: 'feature-1', value: false}
    adapter.add(feature)
    assert.lengthOf(adapter.features(), 1)
    assert.equal(adapter.features()[0], feature)
  })

  test('removes feature', () => {
    const feature = {name: 'feature-1', value: false}
    adapter.add(feature)
    assert.lengthOf(adapter.features(), 1)
    adapter.remove(feature)
    assert.lengthOf(adapter.features(), 0)
  })

  test('gets feature', () => {
    const feature = {name: 'feature-1', value: false}
    adapter.add(feature)
    const featureFromAdapter = adapter.get(feature)
    assert.equal(featureFromAdapter.name, 'feature-1')
    assert.equal(featureFromAdapter.value, false)
  })

  test('enables feature', () => {
    const feature = {name: 'feature-1', value: false}
    adapter.enable(feature)
    const featureFromAdapter = adapter.get(feature)
    assert.equal(featureFromAdapter.name, 'feature-1')
    assert.equal(featureFromAdapter.value, true)
  })

  test('disables feature', () => {
    const feature = {name: 'feature-1', value: true}
    adapter.disable(feature)
    const featureFromAdapter = adapter.get(feature)
    assert.equal(featureFromAdapter.name, 'feature-1')
    assert.equal(featureFromAdapter.value, false)
  })
})
