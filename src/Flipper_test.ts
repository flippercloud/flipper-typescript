import Flipper from './Flipper'
import Dsl from './Dsl'
import MemoryAdapter from './MemoryAdapter'
import { assert } from 'chai'
import 'mocha'

suite('Flipper', () => {
  test('constructor returns Dsl instance', () => {
    const adapter = new MemoryAdapter()
    const flipper = new Flipper(adapter)
    assert.equal(flipper.isFeatureEnabled('feature-1'), false)
  })
})
