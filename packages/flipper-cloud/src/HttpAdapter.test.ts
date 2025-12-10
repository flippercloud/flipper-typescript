import HttpAdapter, { HttpError } from './HttpAdapter'
import { Feature, MemoryAdapter } from '@flippercloud/flipper'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch as any

describe('HttpAdapter', () => {
  let adapter: HttpAdapter

  beforeEach(() => {
    mockFetch.mockReset()
    adapter = new HttpAdapter({
      url: 'http://test.example.com/adapter',
      headers: {
        'flipper-cloud-token': 'test-token',
      },
    })
  })

  describe('constructor', () => {
    it('removes trailing slash from URL', () => {
      const adapter = new HttpAdapter({
        url: 'http://test.example.com/adapter/',
      })
      expect(adapter['url']).toBe('http://test.example.com/adapter')
    })

    it('sets default timeout', () => {
      expect(adapter['timeout']).toBe(5000)
    })

    it('accepts custom timeout', () => {
      const adapter = new HttpAdapter({
        url: 'http://test.example.com',
        timeout: 10000,
      })
      expect(adapter['timeout']).toBe(10000)
    })

    it('sets default headers', () => {
      expect(adapter['headers']['content-type']).toBe('application/json')
      expect(adapter['headers']['accept']).toBe('application/json')
      expect(adapter['headers']['user-agent']).toContain('Flipper HTTP Adapter')
    })

    it('merges custom headers', () => {
      expect(adapter['headers']['flipper-cloud-token']).toBe('test-token')
    })
  })

  describe('features', () => {
    it('fetches all features', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          features: [{ key: 'feature1' }, { key: 'feature2' }],
        }),
      } as Response)

      const features = await adapter.features()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test.example.com/adapter/features?exclude_gate_names=true',
        expect.objectContaining({
          headers: expect.objectContaining({
            'flipper-cloud-token': 'test-token',
          }),
        })
      )
      expect(features).toHaveLength(2)
      expect(features[0]?.name).toBe('feature1')
      expect(features[1]?.name).toBe('feature2')
    })

    it('throws error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      } as Response)

      await expect(adapter.features()).rejects.toThrow(HttpError)
    })
  })

  describe('add', () => {
    it('adds a feature', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      const feature = new Feature('test', adapter, {})
      await adapter.add(feature)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test.example.com/adapter/features',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        })
      )
    })

    it('throws on read-only adapter', async () => {
      const readOnlyAdapter = new HttpAdapter({
        url: 'http://test.example.com',
        readOnly: true,
      })

      const feature = new Feature('test', readOnlyAdapter, {})
      await expect(readOnlyAdapter.add(feature)).rejects.toThrow('write attempted while in read only mode')
    })
  })

  describe('remove', () => {
    it('removes a feature', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response)

      const feature = new Feature('test', adapter, {})
      await adapter.remove(feature)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test.example.com/adapter/features/test',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('clear', () => {
    it('clears a feature', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response)

      const feature = new Feature('test', adapter, {})
      await adapter.clear(feature)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test.example.com/adapter/features/test/clear',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('get', () => {
    it('gets feature state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          gates: [
            { key: 'boolean', value: true },
            { key: 'actors', value: ['user1', 'user2'] },
          ],
        }),
      } as Response)

      const feature = new Feature('test', adapter, {})
      const result = await adapter.get(feature)

      expect(result.boolean).toBe('true')
      expect(result.actors).toEqual(new Set(['user1', 'user2']))
    })

    it('returns default config on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response)

      const feature = new Feature('test', adapter, {})
      const result = await adapter.get(feature)

      expect(result.boolean).toBeNull()
      expect(result.actors).toEqual(new Set())
    })
  })

  describe('getMulti', () => {
    it('gets multiple features', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          features: [
            {
              key: 'feature1',
              gates: [{ key: 'boolean', value: true }],
            },
            {
              key: 'feature2',
              gates: [{ key: 'actors', value: ['user1'] }],
            },
          ],
        }),
      } as Response)

      const feature1 = new Feature('feature1', adapter, {})
      const feature2 = new Feature('feature2', adapter, {})
      const result = await adapter.getMulti([feature1, feature2])

      expect(result['feature1']?.boolean).toBe('true')
      expect(result['feature2']?.actors).toEqual(new Set(['user1']))
    })
  })

  describe('getAll', () => {
    it('gets all features', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => (name === 'etag' ? '"abc123"' : null),
        } as unknown as Headers,
        json: async () => ({
          features: [
            {
              key: 'feature1',
              gates: [{ key: 'boolean', value: true }],
            },
          ],
        }),
      } as Response)

      const result = await adapter.getAll()

      expect(result['feature1']?.boolean).toBe('true')
      expect(adapter['lastGetAllEtag']).toBe('"abc123"')
    })

    it('sends If-None-Match on subsequent requests', async () => {
      // First request - sets ETag
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => (name === 'etag' ? '"abc123"' : null),
        } as unknown as Headers,
        json: async () => ({
          features: [{ key: 'feature1', gates: [] }],
        }),
      } as Response)

      await adapter.getAll()

      // Second request - should send If-None-Match
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: () => null,
        } as unknown as Headers,
        json: async () => ({
          features: [{ key: 'feature1', gates: [] }],
        }),
      } as Response)

      await adapter.getAll()

      const secondCallHeaders = mockFetch.mock.calls[1]?.[1]
      expect(secondCallHeaders).toBeDefined()
      const headers = (secondCallHeaders as RequestInit)?.headers as Record<string, string>
      expect(headers?.['if-none-match']).toBe('"abc123"')
    })

    it('returns cached result on 304', async () => {
      // First request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => (name === 'etag' ? '"abc123"' : null),
        } as unknown as Headers,
        json: async () => ({
          features: [{ key: 'feature1', gates: [{ key: 'boolean', value: true }] }],
        }),
      } as Response)

      const firstResult = await adapter.getAll()

      // Second request - 304
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 304,
        headers: {
          get: () => null,
        } as unknown as Headers,
        json: async () => {
          throw new Error('Should not parse body on 304')
        },
      } as unknown as Response)

      const secondResult = await adapter.getAll()

      expect(secondResult).toEqual(firstResult)
    })

    it('throws error on 304 without cached result', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 304,
        headers: { get: () => null } as unknown as Headers,
        json: async () => ({}),
      } as Response)

      await expect(adapter.getAll()).rejects.toThrow('Received 304 without cached result')
    })
  })

  describe('enable', () => {
    it('enables boolean gate', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      const feature = new Feature('test', adapter, {})
      const gate = feature.gates.find(g => g.key === 'boolean')!
      const thing = gate.wrap(true)

      await adapter.enable(feature, gate, thing)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test.example.com/adapter/features/test/boolean',
        expect.objectContaining({
          method: 'POST',
          body: '{}',
        })
      )
    })

    it('enables actor gate', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      const feature = new Feature('test', adapter, {})
      const gate = feature.gates.find(g => g.key === 'actors')!
      const thing = gate.wrap({ flipperId: 'user123' })

      await adapter.enable(feature, gate, thing)

      const call = mockFetch.mock.calls[0]
      expect(call?.[1]).toBeDefined()
      const body = (call?.[1] as RequestInit)?.body as string
      expect(JSON.parse(body)).toEqual({ flipper_id: 'user123' })
    })

    it('enables group gate with allow_unregistered_groups', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      const feature = new Feature('test', adapter, {})
      const gate = feature.gates.find(g => g.key === 'groups')!
      const thing = gate.wrap('admins')

      await adapter.enable(feature, gate, thing)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test.example.com/adapter/features/test/groups?allow_unregistered_groups=true',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('enables percentage gate', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      const feature = new Feature('test', adapter, {})
      const gate = feature.gates.find(g => g.key === 'percentageOfActors')!
      const thing = gate.wrap(25)

      await adapter.enable(feature, gate, thing)

      const call = mockFetch.mock.calls[0]
      const body = (call?.[1] as RequestInit)?.body as string
      expect(JSON.parse(body)).toEqual({ percentage: '25' })
    })

    it('includes error details in exception', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          message: 'Feature limit exceeded',
          more_info: 'https://example.com/docs',
        }),
      } as Response)

      const feature = new Feature('test', adapter, {})
      const gate = feature.gates.find(g => g.key === 'boolean')!
      const thing = gate.wrap(true)

      await expect(adapter.enable(feature, gate, thing)).rejects.toThrow(
        /Feature limit exceeded.*https:\/\/example\.com\/docs/s
      )
    })
  })

  describe('disable', () => {
    it('disables with DELETE for most gates', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      const feature = new Feature('test', adapter, {})
      const gate = feature.gates.find(g => g.key === 'actors')!
      const thing = gate.wrap({ flipperId: 'user123' })

      await adapter.disable(feature, gate, thing)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test.example.com/adapter/features/test/actors',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('disables with POST for percentage gates', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response)

      const feature = new Feature('test', adapter, {})
      const gate = feature.gates.find(g => g.key === 'percentageOfActors')!
      const thing = gate.wrap(0)

      await adapter.disable(feature, gate, thing)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test.example.com/adapter/features/test/percentageOfActors',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  describe('import', () => {
    it('imports from another adapter', async () => {
      const sourceAdapter = new MemoryAdapter()
      const sourceFeature = new Feature('test', sourceAdapter, {})
      await sourceAdapter.add(sourceFeature)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      } as Response)

      await adapter.import(sourceAdapter)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test.example.com/adapter/import',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  describe('readOnly', () => {
    it('returns false by default', () => {
      expect(adapter.readOnly()).toBe(false)
    })

    it('returns true when read-only', () => {
      const readOnlyAdapter = new HttpAdapter({
        url: 'http://test.example.com',
        readOnly: true,
      })
      expect(readOnlyAdapter.readOnly()).toBe(true)
    })
  })

  describe('timeout handling', () => {
    it('aborts request after timeout', async () => {
      // Mock a slow response
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      mockFetch.mockRejectedValueOnce(abortError as never)

      const shortTimeoutAdapter = new HttpAdapter({
        url: 'http://test.example.com',
        timeout: 100,
      })

      await expect(shortTimeoutAdapter.features()).rejects.toThrow()
    })
  })
})
