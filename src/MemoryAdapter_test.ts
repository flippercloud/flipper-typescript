import MemoryAdapter from './MemoryAdapter'
import { assert } from 'chai'
import 'mocha'

let adapter: MemoryAdapter

describe('MemoryAdapter', () => {
  beforeEach(() => {
    adapter = new MemoryAdapter()
  })

  it('has a name', () => {
    assert.equal(adapter.name, 'memory')
  })

  it('starts with no features', () => {
    assert.typeOf(adapter.features(), 'array')
    assert.lengthOf(adapter.features(), 0)
  })

  it('adds feature', () => {
    const feature = {name: 'feature-1', value: false}
    adapter.add(feature)
    assert.lengthOf(adapter.features(), 1)
    assert.equal(adapter.features()[0], feature)
  })

  it('removes feature', () => {
    const feature = {name: 'feature-1', value: false}
    adapter.add(feature)
    assert.lengthOf(adapter.features(), 1)
    adapter.remove(feature)
    assert.lengthOf(adapter.features(), 0)
  })

  it('gets feature', () => {
    const feature = {name: 'feature-1', value: false}
    adapter.add(feature)
    const featureFromAdapter = adapter.get(feature)
    assert.equal(featureFromAdapter.name, 'feature-1')
    assert.equal(featureFromAdapter.value, false)
  })

  it('enables feature', () => {
    const feature = {name: 'feature-1', value: false}
    adapter.enable(feature)
    const featureFromAdapter = adapter.get(feature)
    assert.equal(featureFromAdapter.name, 'feature-1')
    assert.equal(featureFromAdapter.value, true)
  })

  it('disables feature', () => {
    const feature = {name: 'feature-1', value: true}
    adapter.disable(feature)
    const featureFromAdapter = adapter.get(feature)
    assert.equal(featureFromAdapter.name, 'feature-1')
    assert.equal(featureFromAdapter.value, false)
  })
})
