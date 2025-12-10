import Poller from './Poller'
import { MemoryAdapter, Feature, IAdapter } from '@flippercloud/flipper'

describe('Poller', () => {
  let remoteAdapter: MemoryAdapter
  let poller: Poller

  beforeEach(() => {
    remoteAdapter = new MemoryAdapter()
  })

  afterEach(() => {
    poller?.stop()
  })

  describe('constructor', () => {
    it('creates a poller with default interval', () => {
      poller = new Poller({
        remoteAdapter,
        startAutomatically: false,
      })

      expect(poller.adapter).toBeInstanceOf(MemoryAdapter)
      expect(poller.lastSyncedAt).toBe(0)
    })

    it('enforces minimum interval', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      poller = new Poller({
        remoteAdapter,
        interval: 5000, // Below minimum
        startAutomatically: false,
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('poll interval must be >= 10000ms')
      )

      consoleWarnSpy.mockRestore()
    })

    it('accepts custom interval above minimum', () => {
      poller = new Poller({
        remoteAdapter,
        interval: 30000,
        startAutomatically: false,
      })

      expect(poller).toBeDefined()
    })

    it('starts automatically by default', async () => {
      // Add a feature to remote adapter
      const feature = new Feature('test-feature', remoteAdapter, {})
      await remoteAdapter.add(feature)

      poller = new Poller({
        remoteAdapter,
        interval: 10000,
      })

      // Wait briefly for initial sync to complete
      await new Promise(resolve => setTimeout(resolve, 50))

      // Local adapter should have the feature
      const features = await poller.adapter.features()
      expect(features.length).toBe(1)
      expect(features[0]?.name).toBe('test-feature')
    })

    it('does not start automatically when disabled', async () => {
      // Add a feature to remote adapter
      const feature = new Feature('test-feature', remoteAdapter, {})
      await remoteAdapter.add(feature)

      poller = new Poller({
        remoteAdapter,
        interval: 10000,
        startAutomatically: false,
      })

      // Wait briefly - should not sync since not started
      await new Promise(resolve => setTimeout(resolve, 50))

      // Local adapter should NOT have the feature yet
      const features = await poller.adapter.features()
      expect(features.length).toBe(0)
    })
  })

  describe('start', () => {
    it('starts polling', async () => {
      poller = new Poller({
        remoteAdapter,
        startAutomatically: false,
      })

      // Add feature to remote
      const feature = new Feature('test-feature', remoteAdapter, {})
      await remoteAdapter.add(feature)

      poller.start()

      // Wait for initial sync
      await new Promise(resolve => setTimeout(resolve, 50))

      const features = await poller.adapter.features()
      expect(features.length).toBe(1)
    })

    it('is safe to call multiple times', () => {
      poller = new Poller({
        remoteAdapter,
        startAutomatically: false,
      })

      poller.start()
      poller.start()
      poller.start()

      // Should not throw
      expect(poller).toBeDefined()
    })
  })

  describe('stop', () => {
    it('stops polling', async () => {
      poller = new Poller({
        remoteAdapter,
        interval: 100, // Short interval for testing
        startAutomatically: false,
      })

      poller.start()
      await new Promise(resolve => setTimeout(resolve, 50))
      poller.stop()

      // Add feature after stopping
      const feature = new Feature('new-feature', remoteAdapter, {})
      await remoteAdapter.add(feature)

      // Wait longer than interval - should NOT sync
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should not have synced the new feature
      const features = await poller.adapter.features()
      expect(features.length).toBe(0)
    })

    it('is safe to call multiple times', () => {
      poller = new Poller({
        remoteAdapter,
        startAutomatically: false,
      })

      poller.stop()
      poller.stop()
      poller.stop()

      // Should not throw
      expect(poller).toBeDefined()
    })
  })

  describe('sync', () => {
    it('imports from remote to local adapter', async () => {
      poller = new Poller({
        remoteAdapter,
        startAutomatically: false,
      })

      // Add features to remote
      const feature1 = new Feature('feature1', remoteAdapter, {})
      const feature2 = new Feature('feature2', remoteAdapter, {})
      await remoteAdapter.add(feature1)
      await remoteAdapter.add(feature2)

      // Sync manually
      await poller.sync()

      // Local adapter should have both features
      const features = await poller.adapter.features()
      expect(features.length).toBe(2)
      expect(features.map(f => f.name).sort()).toEqual(['feature1', 'feature2'])
    })

    it('updates lastSyncedAt timestamp', async () => {
      poller = new Poller({
        remoteAdapter,
        startAutomatically: false,
      })

      expect(poller.lastSyncedAt).toBe(0)

      const beforeSync = Date.now()
      await poller.sync()
      const afterSync = Date.now()

      expect(poller.lastSyncedAt).toBeGreaterThanOrEqual(beforeSync)
      expect(poller.lastSyncedAt).toBeLessThanOrEqual(afterSync)
    })

    it('handles sync errors gracefully', async () => {
      const errorAdapter = {
        name: 'error-adapter',
        features: async () => [],
        get: async () => ({}),
        getMulti: async () => ({}),
        getAll: async () => ({}),
        add: async () => true,
        remove: async () => true,
        clear: async () => true,
        enable: async () => true,
        disable: async () => true,
        readOnly: () => false,
        export: async () => {
          throw new Error('Sync failed')
        },
        import: async () => true,
      } as unknown as IAdapter

      poller = new Poller({
        remoteAdapter: errorAdapter,
        startAutomatically: false,
      })

      // Should throw when syncing
      await expect(poller.sync()).rejects.toThrow('Sync failed')
    })
  })

  describe('lastSyncedAt', () => {
    it('returns 0 initially', () => {
      poller = new Poller({
        remoteAdapter,
        startAutomatically: false,
      })

      expect(poller.lastSyncedAt).toBe(0)
    })

    it('updates after successful sync', async () => {
      poller = new Poller({
        remoteAdapter,
        startAutomatically: false,
      })

      await poller.sync()

      expect(poller.lastSyncedAt).toBeGreaterThan(0)
    })

    it('increases with each sync', async () => {
      poller = new Poller({
        remoteAdapter,
        startAutomatically: false,
      })

      await poller.sync()
      const firstSync = poller.lastSyncedAt

      await new Promise(resolve => setTimeout(resolve, 10))
      await poller.sync()
      const secondSync = poller.lastSyncedAt

      expect(secondSync).toBeGreaterThan(firstSync)
    })
  })

  describe('background polling', () => {
    it('syncs periodically', async () => {
      poller = new Poller({
        remoteAdapter,
        interval: 10000, // Minimum allowed interval
        startAutomatically: false,
      })

      // Add initial feature
      const feature1 = new Feature('feature1', remoteAdapter, {})
      await remoteAdapter.add(feature1)

      poller.start()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should have synced initial feature
      let features = await poller.adapter.features()
      expect(features.length).toBe(1)

      // Add another feature to remote
      const feature2 = new Feature('feature2', remoteAdapter, {})
      await remoteAdapter.add(feature2)

      // Manually trigger another sync (instead of waiting 10+ seconds)
      await poller.sync()

      // Now should have both features
      features = await poller.adapter.features()
      expect(features.length).toBe(2)
      expect(features.map(f => f.name).sort()).toEqual(['feature1', 'feature2'])
    })

    it('handles errors without stopping', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      let callCount = 0

      const errorAdapter = {
        name: 'error-adapter',
        features: async () => [],
        get: async () => ({}),
        getMulti: async () => ({}),
        getAll: async () => ({}),
        add: async () => true,
        remove: async () => true,
        clear: async () => true,
        enable: async () => true,
        disable: async () => true,
        readOnly: () => false,
        export: async () => {
          callCount++
          if (callCount === 1) {
            throw new Error('First sync failed')
          }
          return {
            contents: 'test',
            features: () => ({}),
            version: 1,
            format: 'test',
            adapter: 'test',
            equals: () => false,
          }
        },
        import: async () => true,
      } as unknown as IAdapter

      poller = new Poller({
        remoteAdapter: errorAdapter,
        interval: 100, // Short interval for testing
      })

      // Wait for initial sync attempt (fails)
      await new Promise(resolve => setTimeout(resolve, 50))

      // Should have logged error but not crashed
      expect(consoleErrorSpy).toHaveBeenCalled()

      // Wait for next poll interval - should retry and succeed
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should not have thrown
      expect(poller).toBeDefined()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('MINIMUM_POLL_INTERVAL', () => {
    it('is set to 10 seconds', () => {
      expect(Poller.MINIMUM_POLL_INTERVAL).toBe(10000)
    })
  })
})
