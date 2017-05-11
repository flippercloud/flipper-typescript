import Feature from './Feature'
import MemoryAdapter from './MemoryAdapter'
import { assert } from 'chai'
import 'mocha'

const adapter = new MemoryAdapter()
let feature: Feature

suite('Feature', () => {
  setup(() => {
    feature = new Feature('feature-1', adapter)
  })

  test('has name', () => {
    assert.equal(feature.name, 'feature-1')
  })

  test('has adapter', () => {
    assert.equal(feature.adapter, adapter)
  })

  test('enable and disable feature', () => {
    assert.equal(feature.isEnabled(), false)
    feature.enable()
    assert.equal(feature.isEnabled(), true)
    feature.disable()
    assert.equal(feature.isEnabled(), false)
  })
})
