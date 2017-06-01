import { assert, makeActor, suite, test } from './test_helper'
import Feature from './Feature'
import MemoryAdapter from './MemoryAdapter'
import { Actor } from './interfaces'

let adapter: MemoryAdapter
let feature: Feature

suite('Feature', () => {
  setup(() => {
    adapter = new MemoryAdapter()
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

  test('enable and disable feature for actor', () => {
    const actor = makeActor(5)
    assert.equal(feature.isEnabled(actor), false)
    feature.enableActor(actor)
    assert.equal(feature.isEnabled(actor), true)
    feature.disableActor(actor)
    assert.equal(feature.isEnabled(actor), false)
  })
})
