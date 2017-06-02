import Dsl from './Dsl'
import Flipper from './Flipper'
import MemoryAdapter from './MemoryAdapter'
import { assert, suite, test } from './test_helper'

suite('Flipper', () => {
  test('constructor returns Dsl instance', () => {
    const adapter = new MemoryAdapter()
    const flipper = new Flipper(adapter)
    assert.equal(flipper.isFeatureEnabled('feature-1'), false)
  })
})
