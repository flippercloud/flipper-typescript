import Flipper from './Flipper'
import { expect } from 'chai'
import 'mocha'

describe('Flipper', () => {
  it('should start with feature in disabled state', () => {
    const flipper = new Flipper()
    expect(flipper.isFeatureEnabled('feature-1')).to.be.false
  })

  it('can enable feature', () => {
    const flipper = new Flipper()
    flipper.enableFeature('feature-1')
    expect(flipper.isFeatureEnabled('feature-1')).to.be.true
  })

  it('can disable an enabled feature', () => {
    const flipper = new Flipper()
    flipper.enableFeature('feature-1')
    flipper.disableFeature('feature-1')
    expect(flipper.isFeatureEnabled('feature-1')).to.be.false
  })

  it('can enable one feature without enabling another feature', () => {
    const flipper = new Flipper()
    flipper.enableFeature('feature-1')
    expect(flipper.isFeatureEnabled('feature-1')).to.be.true
    expect(flipper.isFeatureEnabled('feature-2')).to.be.false
  })
})
