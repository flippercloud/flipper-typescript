import Dsl from './Dsl'
import MemoryAdapter from './MemoryAdapter'
import { assert } from 'chai'
import 'mocha'

let dsl: Dsl

suite('Dsl', () => {
  setup(() => {
    const adapter = new MemoryAdapter()
    dsl = new Dsl(adapter)
  })

  test('can enable and disable features', () => {
    dsl.enableFeature('feature-1')
    dsl.disableFeature('feature-2')
    assert.equal(dsl.isFeatureEnabled('feature-1'), true)
    assert.equal(dsl.isFeatureEnabled('feature-2'), false)
  })
})
