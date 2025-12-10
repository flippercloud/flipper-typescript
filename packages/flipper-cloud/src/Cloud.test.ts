import { FlipperCloud, CloudAdapter } from './Cloud'
import { MemoryAdapter, Feature } from '@flippercloud/flipper'
import HttpAdapter from './HttpAdapter'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch as any

describe('FlipperCloud', () => {
  let createdFlippers: Array<Awaited<ReturnType<typeof FlipperCloud>>> = []

  beforeEach(() => {
    mockFetch.mockReset()
    createdFlippers = []
  })

  afterEach(() => {
    // Clean up any pollers
    createdFlippers.forEach(flipper => {
      flipper.stopPolling()
    })
    createdFlippers = []
  })

  describe('basic setup', () => {
    it('creates a Flipper instance with cloud adapter', async () => {
      // Mock successful initial sync
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: () => null,
        } as unknown as Headers,
        json: async () => ({ features: [] }),
      } as Response)

      const flipper = await FlipperCloud({
        token: 'test-token',
        syncInterval: 10000,
      })
      createdFlippers.push(flipper)

      expect(flipper).toBeDefined()
      expect(flipper.adapter).toBeInstanceOf(CloudAdapter)
    })

    it('performs initial sync before returning', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: () => null,
        } as unknown as Headers,
        json: async () => ({
          features: [
            {
              key: 'initial-feature',
              gates: [{ key: 'boolean', value: true }],
            },
          ],
        }),
      } as Response)

      const flipper = await FlipperCloud({
        token: 'test-token',
        syncInterval: 10000,
      })
      createdFlippers.push(flipper)

      const features = await flipper.features()
      expect(features.length).toBe(1)
      expect(features[0]?.name).toBe('initial-feature')
    })

    it('handles initial sync failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const flipper = await FlipperCloud({
        token: 'test-token',
        syncInterval: 10000,
      })
      createdFlippers.push(flipper)

      expect(flipper).toBeDefined()
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Flipper Cloud initial sync failed:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    it('accepts custom URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({ features: [] }),
      } as Response)

      const flipper = await FlipperCloud({
        token: 'test-token',
        url: 'http://localhost:5000/adapter',
        syncInterval: 10000,
      })
      createdFlippers.push(flipper)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/adapter/features?exclude_gate_names=true',
        expect.objectContaining({
          headers: expect.objectContaining({
            'flipper-cloud-token': 'test-token',
          }),
        })
      )
    })

    it('accepts custom timeout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({ features: [] }),
      } as Response)

      const flipper = await FlipperCloud({
        token: 'test-token',
        timeout: 15000,
        syncInterval: 10000,
      })
      createdFlippers.push(flipper)

      expect(flipper).toBeDefined()
    })

    it('accepts custom local adapter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({ features: [] }),
      } as Response)

      const localAdapter = new MemoryAdapter()
      const flipper = await FlipperCloud({
        token: 'test-token',
        localAdapter,
        syncInterval: 10000,
      })
      createdFlippers.push(flipper)

      expect(flipper).toBeDefined()
    })

    it('accepts custom headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({ features: [] }),
      } as Response)

      const flipper = await FlipperCloud({
        token: 'test-token',
        headers: {
          'x-custom-header': 'custom-value',
        },
        syncInterval: 10000,
      })
      createdFlippers.push(flipper)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'flipper-cloud-token': 'test-token',
            'x-custom-header': 'custom-value',
          }),
        })
      )
    })
  })

  describe('sync method', () => {
    it('forces a manual sync', async () => {
      // Initial sync
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({ features: [] }),
      } as Response)

      const flipper = await FlipperCloud({
        token: 'test-token',
        syncInterval: 10000,
      })
      createdFlippers.push(flipper)

      // Manual sync
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({
          features: [
            {
              key: 'new-feature',
              gates: [{ key: 'boolean', value: true }],
            },
          ],
        }),
      } as Response)

      await flipper.sync()

      const features = await flipper.features()
      expect(features.length).toBe(1)
      expect(features[0]?.name).toBe('new-feature')
    })
  })

  describe('stopPolling method', () => {
    it('stops background polling', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({ features: [] }),
      } as Response)

      const flipper = await FlipperCloud({
        token: 'test-token',
        syncInterval: 10000,
      })
      createdFlippers.push(flipper)

      flipper.stopPolling()

      // Should not throw
      expect(flipper).toBeDefined()
    })
  })

  describe('read operations', () => {
    it('reads from local adapter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({
          features: [
            {
              key: 'test-feature',
              gates: [{ key: 'boolean', value: true }],
            },
          ],
        }),
      } as Response)

      const flipper = await FlipperCloud({
        token: 'test-token',
        syncInterval: 10000,
      })
      createdFlippers.push(flipper)

      const feature = await flipper.feature('test-feature')
      const isEnabled = await feature.isEnabled()
      expect(isEnabled).toBe(true)

      // Should not have made additional HTTP calls
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('write operations', () => {
    it('writes to both local and cloud', async () => {
      // Initial sync
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({ features: [] }),
      } as Response)

      const flipper = await FlipperCloud({
        token: 'test-token',
        syncInterval: 10000,
      })
      createdFlippers.push(flipper)

      // Enable feature (writes to cloud)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      await flipper.enable('new-feature')

      // Should have made 2 HTTP calls: initial sync + enable
      expect(mockFetch).toHaveBeenCalledTimes(2)

      // Should be enabled locally
      const feature = await flipper.feature('new-feature')
      const isEnabled = await feature.isEnabled()
      expect(isEnabled).toBe(true)
    })
  })

  describe('read-only mode', () => {
    it('creates read-only adapter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({ features: [] }),
      } as Response)

      const flipper = await FlipperCloud({
        token: 'test-token',
        readOnly: true,
        syncInterval: 10000,
      })
      createdFlippers.push(flipper)

      expect(flipper).toBeDefined()

      // Writes should throw
      await expect(flipper.enable('test')).rejects.toThrow('write attempted while in read only mode')
    })
  })
})

describe('CloudAdapter', () => {
  let localAdapter: MemoryAdapter
  let remoteAdapter: MemoryAdapter
  let cloudAdapter: CloudAdapter

  beforeEach(() => {
    mockFetch.mockReset()
    localAdapter = new MemoryAdapter()
    remoteAdapter = new MemoryAdapter()
  })

  afterEach(() => {
    // Cleanup handled by individual tests
  })

  describe('ensureSynced', () => {
    it('syncs from poller when poller has newer data', async () => {
      // Mock HTTP for poller
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({
          features: [
            {
              key: 'poller-feature',
              gates: [{ key: 'boolean', value: true }],
            },
          ],
        }),
      } as Response)

      const flipper = await FlipperCloud({
        token: 'test-token',
        localAdapter,
        syncInterval: 10000,
      })

      cloudAdapter = flipper.adapter

      // Wait briefly for poller to start and sync
      await new Promise(resolve => setTimeout(resolve, 100))

      // Read should trigger ensureSynced
      const features = await cloudAdapter.features()
      expect(features.length).toBe(1)
      expect(features[0]?.name).toBe('poller-feature')
    })

    it('does not sync if poller has no new data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({ features: [] }),
      } as Response)

      const flipper = await FlipperCloud({
        token: 'test-token',
        localAdapter,
        syncInterval: 10000,
      })

      cloudAdapter = flipper.adapter

      // First read
      await cloudAdapter.features()

      // Second read (should not sync again)
      await cloudAdapter.features()

      // Only initial sync should have happened
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('manual sync', () => {
    it('syncs from poller on demand', async () => {
      // Initial sync
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({ features: [] }),
      } as Response)

      const flipper = await FlipperCloud({
        token: 'test-token',
        localAdapter,
        syncInterval: 10000,
      })

      // Manual sync with new data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({
          features: [
            {
              key: 'manual-sync-feature',
              gates: [{ key: 'boolean', value: true }],
            },
          ],
        }),
      } as Response)

      await flipper.adapter.sync()

      const features = await flipper.adapter.features()
      expect(features.length).toBe(1)
      expect(features[0]?.name).toBe('manual-sync-feature')
    })
  })

  describe('override methods', () => {
    it('calls ensureSynced before get', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({
          features: [
            {
              key: 'test-feature',
              gates: [{ key: 'boolean', value: true }],
            },
          ],
        }),
      } as Response)

      const flipper = await FlipperCloud({
        token: 'test-token',
        localAdapter,
        syncInterval: 10000,
      })

      const feature = new Feature('test-feature', flipper.adapter, {})
      const result = await flipper.adapter.get(feature)

      expect(result.boolean).toBe('true')
    })

    it('calls ensureSynced before getMulti', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({
          features: [
            {
              key: 'feature1',
              gates: [{ key: 'boolean', value: true }],
            },
            {
              key: 'feature2',
              gates: [{ key: 'boolean', value: false }],
            },
          ],
        }),
      } as Response)

      const flipper = await FlipperCloud({
        token: 'test-token',
        localAdapter,
        syncInterval: 10000,
      })

      const feature1 = new Feature('feature1', flipper.adapter, {})
      const feature2 = new Feature('feature2', flipper.adapter, {})
      const result = await flipper.adapter.getMulti([feature1, feature2])

      expect(result['feature1']?.boolean).toBe('true')
      expect(result['feature2']?.boolean).toBeUndefined()
    })

    it('calls ensureSynced before getAll', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({
          features: [
            {
              key: 'feature1',
              gates: [{ key: 'boolean', value: true }],
            },
          ],
        }),
      } as Response)

      const flipper = await FlipperCloud({
        token: 'test-token',
        localAdapter,
        syncInterval: 10000,
      })

      const result = await flipper.adapter.getAll()

      expect(result['feature1']?.boolean).toBe('true')
    })
  })
})
