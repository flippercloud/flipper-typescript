import Dsl from './Dsl'
import MemoryAdapter from './MemoryAdapter'
import Actor from './Actor'
import { assert } from 'chai'
import 'mocha'

let dsl: Dsl

suite('Dsl', () => {
  setup(() => {
    const adapter = new MemoryAdapter()
    dsl = new Dsl(adapter)
  })

  test('enables and disables the feature', () => {
    dsl.enable('feature-1')
    dsl.disable('feature-2')
    assert.equal(dsl.isFeatureEnabled('feature-1'), true)
    assert.equal(dsl.isFeatureEnabled('feature-2'), false)
  })

  test('enables and disables the feature for actor', () => {
    const actor = new Actor(5)
    const feature = dsl.feature('feature-1')

    assert.lengthOf(feature.actorsValue(), 0)
    dsl.enableActor('feature-1', actor)
    assert.equal(dsl.isFeatureEnabled('feature-1', actor), true)
    dsl.disableActor('feature-1', actor)
    assert.equal(dsl.isFeatureEnabled('feature-1', actor), false)
  })
})
