import Flipper from './Flipper'
import MemoryAdapter from './MemoryAdapter'

describe('Flipper', () => {
  test('constructor returns Dsl instance', async () => {
    const adapter = new MemoryAdapter()
    const flipper = new Flipper(adapter)
    expect(await flipper.isFeatureEnabled('feature-1')).toBe(false)
  })

  describe('groupNames', () => {
    test('returns empty array when no groups registered', () => {
      const adapter = new MemoryAdapter()
      const flipper = new Flipper(adapter)
      expect(flipper.groupNames()).toEqual([])
    })

    test('returns array of registered group names', () => {
      const adapter = new MemoryAdapter()
      const flipper = new Flipper(adapter)
      flipper.register('admins', actor => actor.flipperId === 'admin')
      flipper.register('beta-users', actor => actor.flipperId === 'beta')

      const names = flipper.groupNames()
      expect(names).toHaveLength(2)
      expect(names).toContain('admins')
      expect(names).toContain('beta-users')
    })
  })

  describe('groupExists', () => {
    test('returns false when group does not exist', () => {
      const adapter = new MemoryAdapter()
      const flipper = new Flipper(adapter)
      expect(flipper.groupExists('admins')).toBe(false)
    })

    test('returns true when group exists', () => {
      const adapter = new MemoryAdapter()
      const flipper = new Flipper(adapter)
      flipper.register('admins', actor => actor.flipperId === 'admin')
      expect(flipper.groupExists('admins')).toBe(true)
    })
  })

  describe('unregisterGroups', () => {
    test('clears all registered groups', () => {
      const adapter = new MemoryAdapter()
      const flipper = new Flipper(adapter)
      flipper.register('admins', actor => actor.flipperId === 'admin')
      flipper.register('beta-users', actor => actor.flipperId === 'beta')

      expect(flipper.groupNames()).toHaveLength(2)

      flipper.unregisterGroups()

      expect(flipper.groupNames()).toEqual([])
      expect(flipper.groupExists('admins')).toBe(false)
      expect(flipper.groupExists('beta-users')).toBe(false)
    })
  })
})
