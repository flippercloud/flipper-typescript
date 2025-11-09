import Wrapper from './Wrapper'
import MemoryAdapter from '../MemoryAdapter'
import Feature from '../Feature'
import Dsl from '../Dsl'

describe('Wrapper', () => {
  let adapter: MemoryAdapter
  let wrapper: Wrapper
  let feature: Feature

  beforeEach(() => {
    adapter = new MemoryAdapter()
    wrapper = new Wrapper(adapter)
    const dsl = new Dsl(adapter)
    feature = dsl.feature('test_feature')
  })

  describe('name', () => {
    it('returns the wrapped adapter name', () => {
      expect(wrapper.name).toBe('memory')
    })
  })

  describe('delegation', () => {
    it('delegates features() to wrapped adapter', async () => {
      await adapter.add(feature)
      expect(await wrapper.features()).toEqual([feature])
    })

    it('delegates add() to wrapped adapter', async () => {
      expect(await wrapper.add(feature)).toBe(true)
      expect(await adapter.features()).toContainEqual(feature)
    })

    it('delegates remove() to wrapped adapter', async () => {
      await adapter.add(feature)
      expect(await wrapper.remove(feature)).toBe(true)
      expect(await adapter.features()).toHaveLength(0)
    })

    it('delegates clear() to wrapped adapter', async () => {
      await adapter.add(feature)
      expect(await wrapper.clear(feature)).toBe(true)
    })

    it('delegates get() to wrapped adapter', async () => {
      await adapter.add(feature)
      const result = await wrapper.get(feature)
      expect(result).toBeDefined()
    })

    it('delegates getMulti() to wrapped adapter', async () => {
      await adapter.add(feature)
      const result = await wrapper.getMulti([feature])
      expect(result[feature.key]).toBeDefined()
    })

    it('delegates getAll() to wrapped adapter', async () => {
      await adapter.add(feature)
      const result = await wrapper.getAll()
      expect(result[feature.key]).toBeDefined()
    })

    it('delegates readOnly() to wrapped adapter', () => {
      expect(wrapper.readOnly()).toBe(false)
    })
  })

  describe('custom wrapper', () => {
    it('allows customizing behavior via wrap() hook', async () => {
      const calls: string[] = []

      class CustomWrapper extends Wrapper {
        protected override wrap<T>(method: string, fn: () => T | Promise<T>): T | Promise<T> {
          calls.push(method)
          return fn()
        }
      }

      const custom = new CustomWrapper(adapter)
      await custom.add(feature)
      await custom.features()
      await custom.get(feature)

      expect(calls).toEqual(['add', 'features', 'get'])
    })

    it('allows modifying return values', async () => {
      class ModifyingWrapper extends Wrapper {
        protected override wrap<T>(method: string, fn: () => T | Promise<T>): T | Promise<T> {
          const result = fn()
          if (method === 'features') {
            return [] as unknown as T
          }
          return result
        }
      }

      const modifying = new ModifyingWrapper(adapter)
      await adapter.add(feature)

      expect(await adapter.features()).toHaveLength(1)
      expect(await modifying.features()).toHaveLength(0)
    })
  })
})
