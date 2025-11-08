import ReadOnly, { WriteAttemptedError } from './ReadOnly'
import MemoryAdapter from '../MemoryAdapter'
import Feature from '../Feature'
import Dsl from '../Dsl'
import BooleanGate from '../BooleanGate'
import BooleanType from '../BooleanType'

describe('ReadOnly', () => {
  let adapter: MemoryAdapter
  let readOnly: ReadOnly
  let feature: Feature
  let gate: BooleanGate
  let thing: BooleanType

  beforeEach(() => {
    adapter = new MemoryAdapter()
    readOnly = new ReadOnly(adapter)
    const dsl = new Dsl(adapter)
    feature = dsl.feature('test_feature')
    gate = new BooleanGate()
    thing = new BooleanType(true)

    // Add feature to underlying adapter
    adapter.add(feature)
  })

  describe('readOnly()', () => {
    it('returns true', () => {
      expect(readOnly.readOnly()).toBe(true)
    })
  })

  describe('read operations', () => {
    it('allows features()', () => {
      expect(() => readOnly.features()).not.toThrow()
      expect(readOnly.features()).toEqual([feature])
    })

    it('allows get()', () => {
      expect(() => readOnly.get(feature)).not.toThrow()
    })

    it('allows getMulti()', () => {
      expect(() => readOnly.getMulti([feature])).not.toThrow()
    })

    it('allows getAll()', () => {
      expect(() => readOnly.getAll()).not.toThrow()
    })
  })

  describe('write operations', () => {
    it('prevents add()', () => {
      const newFeature = new Feature('new_feature', adapter, {})
      expect(() => readOnly.add(newFeature)).toThrow(WriteAttemptedError)
      expect(() => readOnly.add(newFeature)).toThrow(
        'write attempted while in read only mode'
      )
    })

    it('prevents remove()', () => {
      expect(() => readOnly.remove(feature)).toThrow(WriteAttemptedError)
    })

    it('prevents clear()', () => {
      expect(() => readOnly.clear(feature)).toThrow(WriteAttemptedError)
    })

    it('prevents enable()', () => {
      expect(() => readOnly.enable(feature, gate, thing)).toThrow(
        WriteAttemptedError
      )
    })

    it('prevents disable()', () => {
      expect(() => readOnly.disable(feature, gate, thing)).toThrow(
        WriteAttemptedError
      )
    })
  })

  describe('WriteAttemptedError', () => {
    it('has default message', () => {
      const error = new WriteAttemptedError()
      expect(error.message).toBe('write attempted while in read only mode')
      expect(error.name).toBe('WriteAttemptedError')
    })

    it('allows custom message', () => {
      const error = new WriteAttemptedError('custom message')
      expect(error.message).toBe('custom message')
    })
  })

  describe('integration with Dsl', () => {
    it('prevents enabling features', () => {
      const dsl = new Dsl(readOnly)
      expect(() => dsl.enable('test_feature')).toThrow(WriteAttemptedError)
    })

    it('allows checking if feature is enabled', () => {
      const dsl = new Dsl(readOnly)
      expect(() => dsl.isFeatureEnabled('test_feature')).not.toThrow()
    })
  })
})
