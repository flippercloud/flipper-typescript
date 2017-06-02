import Dsl from './Dsl'
import { IActor } from './interfaces'
import MemoryAdapter from './MemoryAdapter'
import { assert, makeActor, suite, test } from './test_helper'

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
    const actor = makeActor(5)
    const feature = dsl.feature('feature-1')

    dsl.enableActor('feature-1', actor)
    assert.equal(dsl.isFeatureEnabled('feature-1', actor), true)
    dsl.disableActor('feature-1', actor)
    assert.equal(dsl.isFeatureEnabled('feature-1', actor), false)
  })

  test('enables and disables feature for percentage of actors', () => {
    const feature = dsl.feature('feature-1')
    dsl.enablePercentageOfActors('feature-1', 50)

    assert.equal(dsl.isFeatureEnabled('feature-1', makeActor(5)), true)
    assert.equal(dsl.isFeatureEnabled('feature-1', makeActor(8)), false)
  })
})
