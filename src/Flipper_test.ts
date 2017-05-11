import Flipper from './Flipper'
import { assert } from 'chai'
import 'mocha'

let flipper: Flipper

describe('Flipper', () => {
  beforeEach(() => {
    flipper = new Flipper()
  })

  it('should start with feature in disabled state', () => {
    assert.equal(flipper.isFeatureEnabled('feature-1'), false)
  })

  it('can enable feature', () => {
    flipper.enableFeature('feature-1')
    assert.equal(flipper.isFeatureEnabled('feature-1'), true)
  })

  it('can disable an enabled feature', () => {
    flipper.enableFeature('feature-1')
    flipper.disableFeature('feature-1')
    assert.equal(flipper.isFeatureEnabled('feature-1'), false)
  })

  it('can enable one feature without enabling another feature', () => {
    flipper.enableFeature('feature-1')
    assert.equal(flipper.isFeatureEnabled('feature-1'), true)
    assert.equal(flipper.isFeatureEnabled('feature-2'), false)
  })
})
