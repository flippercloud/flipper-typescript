import Strict, { FeatureNotFoundError } from './Strict'
import MemoryAdapter from '../MemoryAdapter'
import Feature from '../Feature'
import Dsl from '../Dsl'
import { jest, describe, it, beforeEach, expect } from '@jest/globals'

describe('Strict', () => {
  let adapter: MemoryAdapter
  let strict: Strict
  let feature: Feature

  beforeEach(() => {
    adapter = new MemoryAdapter()
    const dsl = new Dsl(adapter)
    feature = dsl.feature('test_feature')
  })

  describe('with default handler (raise)', () => {
    beforeEach(() => {
      strict = new Strict(adapter)
    })

    it('throws when getting non-existent feature', async () => {
      await expect(strict.get(feature)).rejects.toThrow(FeatureNotFoundError)
      await expect(strict.get(feature)).rejects.toThrow('Could not find feature "test_feature"')
    })

    it('throws when getting multiple features with non-existent one', async () => {
      const feature2 = new Feature('other_feature', adapter, {})
      await adapter.add(feature)

      await expect(strict.getMulti([feature, feature2])).rejects.toThrow(FeatureNotFoundError)
    })

    it('allows operations on existing features', async () => {
      await adapter.add(feature)

      const result1 = await strict.get(feature)
      expect(result1).toBeDefined()
      const result2 = await strict.getMulti([feature])
      expect(result2).toBeDefined()
    })

    it('does not throw for other operations', async () => {
      const result1 = await strict.add(feature)
      expect(result1).toBeDefined()
      const result2 = await strict.features()
      expect(result2).toBeDefined()
    })
  })

  describe('with warn handler', () => {
    beforeEach(() => {
      strict = new Strict(adapter, 'warn')
    })

    it('logs warning instead of throwing', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
        // no-op
      })

      const result = await strict.get(feature)
      expect(result).toBeDefined()
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not find feature "test_feature"')
      )

      warnSpy.mockRestore()
    })
  })

  describe('with noop handler', () => {
    it('does nothing on missing feature', async () => {
      strict = new Strict(adapter, 'noop')

      const result = await strict.get(feature)
      expect(result).toBeDefined()
    })

    it('accepts false as noop', async () => {
      strict = new Strict(adapter, false)

      const result = await strict.get(feature)
      expect(result).toBeDefined()
    })
  })

  describe('with raise handler', () => {
    it('throws on missing feature', async () => {
      strict = new Strict(adapter, 'raise')

      await expect(strict.get(feature)).rejects.toThrow(FeatureNotFoundError)
    })

    it('accepts true as raise', async () => {
      strict = new Strict(adapter, true)

      await expect(strict.get(feature)).rejects.toThrow(FeatureNotFoundError)
    })
  })

  describe('with custom function handler', () => {
    it('calls handler function', async () => {
      const handler = jest.fn()
      strict = new Strict(adapter, handler)

      await strict.get(feature)

      expect(handler).toHaveBeenCalledWith(feature)
    })

    it('allows handler to throw custom error', async () => {
      const handler = (f: Feature) => {
        throw new Error(`Custom error for ${f.name}`)
      }
      strict = new Strict(adapter, handler)

      await expect(strict.get(feature)).rejects.toThrow('Custom error for test_feature')
    })
  })

  describe('FeatureNotFoundError', () => {
    it('provides helpful error message', () => {
      const error = new FeatureNotFoundError('my_feature')
      expect(error.message).toBe(
        'Could not find feature "my_feature". Call `flipper.add("my_feature")` to create it.'
      )
      expect(error.name).toBe('FeatureNotFoundError')
    })
  })

  describe('integration with Dsl', () => {
    it('throws when checking non-existent feature', async () => {
      strict = new Strict(adapter)
      const dsl = new Dsl(strict)

      await expect(dsl.isFeatureEnabled('nonexistent')).rejects.toThrow(FeatureNotFoundError)
    })

    it('works after adding feature', async () => {
      strict = new Strict(adapter)
      const dsl = new Dsl(strict)

      await dsl.add('test_feature')
      const result = await dsl.isFeatureEnabled('test_feature')
      expect(typeof result).toBe('boolean')
    })
  })
})
