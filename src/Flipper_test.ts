import Flipper from './Flipper'
import MemoryAdapter from './MemoryAdapter'
import { assert } from 'chai'
import 'mocha'

let flipper: Flipper
const feature1 = {name: 'feature-1', value: false}
const feature2 = {name: 'feature-2', value: false}

describe('Flipper', () => {
  beforeEach(() => {
    const adapter = new MemoryAdapter()
    flipper = new Flipper(adapter)
  })

  it('can enable feature', () => {
    assert.equal(flipper.isFeatureEnabled(feature1), false)
    flipper.enableFeature(feature1)
    assert.equal(flipper.isFeatureEnabled(feature1), true)
  })

  it('can disable an enabled feature', () => {
    flipper.enableFeature(feature1)
    assert.equal(flipper.isFeatureEnabled(feature1), true)
    flipper.disableFeature(feature1)
    assert.equal(flipper.isFeatureEnabled(feature1), false)
  })

  it('can enable and disable features independently', () => {
    flipper.enableFeature(feature1)
    flipper.disableFeature(feature2)
    assert.equal(flipper.isFeatureEnabled(feature1), true)
    assert.equal(flipper.isFeatureEnabled(feature2), false)
  })
})
