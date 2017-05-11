import Flipper from './Flipper'
import MemoryAdapter from './MemoryAdapter'
import { assert } from 'chai'
import 'mocha'

let flipper: Flipper

suite('Flipper', () => {
  setup(() => {
    const adapter = new MemoryAdapter()
    flipper = new Flipper(adapter)
  })

  test('can enable and disable features', () => {
    flipper.enableFeature('feature-1')
    flipper.disableFeature('feature-2')
    assert.equal(flipper.isFeatureEnabled('feature-1'), true)
    assert.equal(flipper.isFeatureEnabled('feature-2'), false)
  })
})
