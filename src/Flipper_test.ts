import Flipper from './Flipper'
import MemoryAdapter from './MemoryAdapter'

describe('Flipper', () => {
  test('constructor returns Dsl instance', () => {
    const adapter = new MemoryAdapter()
    const flipper = new Flipper(adapter)
    expect(flipper.isFeatureEnabled('feature-1')).toBe(false)
  })
})
