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

  beforeEach(async () => {
    adapter = new MemoryAdapter()
    readOnly = new ReadOnly(adapter)
    const dsl = new Dsl(adapter)
    feature = dsl.feature('test_feature')
    gate = new BooleanGate()
    thing = new BooleanType(true)

    // Add feature to underlying adapter
    await adapter.add(feature)
  })

  describe('readOnly()', () => {
    it('returns true', () => {
      expect(readOnly.readOnly()).toBe(true)
    })
  })

  describe('read operations', () => {
    it('allows features()', async () => {
      await expect(readOnly.features()).resolves.not.toThrow()
      expect(await readOnly.features()).toEqual([feature])
    })

    it('allows get()', async () => {
      await expect(readOnly.get(feature)).resolves.not.toThrow()
    })

    it('allows getMulti()', async () => {
      await expect(readOnly.getMulti([feature])).resolves.not.toThrow()
    })

    it('allows getAll()', async () => {
      await expect(readOnly.getAll()).resolves.not.toThrow()
    })
  })

  describe('write operations', () => {
    it('prevents add()', async () => {
      const newFeature = new Feature('new_feature', adapter, {})
      await expect(readOnly.add(newFeature)).rejects.toThrow(WriteAttemptedError)
      await expect(readOnly.add(newFeature)).rejects.toThrow(
        'write attempted while in read only mode'
      )
    })

    it('prevents remove()', async () => {
      await expect(readOnly.remove(feature)).rejects.toThrow(WriteAttemptedError)
    })

    it('prevents clear()', async () => {
      await expect(readOnly.clear(feature)).rejects.toThrow(WriteAttemptedError)
    })

    it('prevents enable()', async () => {
      await expect(readOnly.enable(feature, gate, thing)).rejects.toThrow(WriteAttemptedError)
    })

    it('prevents disable()', async () => {
      await expect(readOnly.disable(feature, gate, thing)).rejects.toThrow(WriteAttemptedError)
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
    it('prevents enabling features', async () => {
      const dsl = new Dsl(readOnly)
      await expect(dsl.enable('test_feature')).rejects.toThrow(WriteAttemptedError)
    })

    it('allows checking if feature is enabled', async () => {
      const dsl = new Dsl(readOnly)
      await expect(dsl.isFeatureEnabled('test_feature')).resolves.not.toThrow()
    })
  })
})
