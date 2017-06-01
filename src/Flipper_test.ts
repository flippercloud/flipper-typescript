import { assert, suite, test } from './test_helper'
import Flipper from './Flipper'
import Dsl from './Dsl'
import MemoryAdapter from './MemoryAdapter'

suite('Flipper', () => {
  test('constructor returns Dsl instance', () => {
    const adapter = new MemoryAdapter()
    const flipper = new Flipper(adapter)
    assert.equal(flipper.isFeatureEnabled('feature-1'), false)
  })
})
