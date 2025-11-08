import Strict, { FeatureNotFoundError } from './Strict'
import MemoryAdapter from '../MemoryAdapter'
import Feature from '../Feature'
import Dsl from '../Dsl'
import { jest } from '@jest/globals'

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

    it('throws when getting non-existent feature', () => {
      expect(() => strict.get(feature)).toThrow(FeatureNotFoundError)
      expect(() => strict.get(feature)).toThrow(
        'Could not find feature "test_feature"'
      )
    })

    it('throws when getting multiple features with non-existent one', () => {
      const feature2 = new Feature('other_feature', adapter, {})
      adapter.add(feature)

      expect(() => strict.getMulti([feature, feature2])).toThrow(
        FeatureNotFoundError
      )
    })

    it('allows operations on existing features', () => {
      adapter.add(feature)

      expect(() => strict.get(feature)).not.toThrow()
      expect(() => strict.getMulti([feature])).not.toThrow()
    })

    it('does not throw for other operations', () => {
      expect(() => strict.add(feature)).not.toThrow()
      expect(() => strict.features()).not.toThrow()
    })
  })

  describe('with warn handler', () => {
    beforeEach(() => {
      strict = new Strict(adapter, 'warn')
    })

    it('logs warning instead of throwing', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
        // no-op
      })

      expect(() => strict.get(feature)).not.toThrow()
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not find feature "test_feature"')
      )

      warnSpy.mockRestore()
    })
  })

  describe('with noop handler', () => {
    it('does nothing on missing feature', () => {
      strict = new Strict(adapter, 'noop')

      expect(() => strict.get(feature)).not.toThrow()
    })

    it('accepts false as noop', () => {
      strict = new Strict(adapter, false)

      expect(() => strict.get(feature)).not.toThrow()
    })
  })

  describe('with raise handler', () => {
    it('throws on missing feature', () => {
      strict = new Strict(adapter, 'raise')

      expect(() => strict.get(feature)).toThrow(FeatureNotFoundError)
    })

    it('accepts true as raise', () => {
      strict = new Strict(adapter, true)

      expect(() => strict.get(feature)).toThrow(FeatureNotFoundError)
    })
  })

  describe('with custom function handler', () => {
    it('calls handler function', () => {
      const handler = jest.fn()
      strict = new Strict(adapter, handler)

      strict.get(feature)

      expect(handler).toHaveBeenCalledWith(feature)
    })

    it('allows handler to throw custom error', () => {
      const handler = (f: Feature) => {
        throw new Error(`Custom error for ${f.name}`)
      }
      strict = new Strict(adapter, handler)

      expect(() => strict.get(feature)).toThrow('Custom error for test_feature')
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
    it('throws when checking non-existent feature', () => {
      strict = new Strict(adapter)
      const dsl = new Dsl(strict)

      expect(() => dsl.isFeatureEnabled('nonexistent')).toThrow(FeatureNotFoundError)
    })

    it('works after adding feature', () => {
      strict = new Strict(adapter)
      const dsl = new Dsl(strict)

      dsl.add('test_feature')
      expect(() => dsl.isFeatureEnabled('test_feature')).not.toThrow()
    })
  })
})
