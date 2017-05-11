import Flipper from './Flipper'
import { assert } from 'chai'
import 'mocha'

describe('Flipper', () => {
  it('should start with feature in disabled state', () => {
    const flipper = new Flipper()
    assert.equal(flipper.isFeatureEnabled('feature-1'), false)
  })

  it('can enable feature', () => {
    const flipper = new Flipper()
    flipper.enableFeature('feature-1')
    assert.equal(flipper.isFeatureEnabled('feature-1'), true)
  })

  it('can disable an enabled feature', () => {
    const flipper = new Flipper()
    flipper.enableFeature('feature-1')
    flipper.disableFeature('feature-1')
    assert.equal(flipper.isFeatureEnabled('feature-1'), false)
  })

  it('can enable one feature without enabling another feature', () => {
    const flipper = new Flipper()
    flipper.enableFeature('feature-1')
    assert.equal(flipper.isFeatureEnabled('feature-1'), true)
    assert.equal(flipper.isFeatureEnabled('feature-2'), false)
  })
})
