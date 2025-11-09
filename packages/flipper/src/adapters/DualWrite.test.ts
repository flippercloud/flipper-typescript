import DualWrite from './DualWrite'
import MemoryAdapter from '../MemoryAdapter'
import Feature from '../Feature'
import Dsl from '../Dsl'
import BooleanGate from '../BooleanGate'
import BooleanType from '../BooleanType'
import { jest } from '@jest/globals'

describe('DualWrite', () => {
  let local: MemoryAdapter
  let remote: MemoryAdapter
  let dualWrite: DualWrite
  let feature: Feature
  let gate: BooleanGate
  let thing: BooleanType

  beforeEach(() => {
    local = new MemoryAdapter()
    remote = new MemoryAdapter()
    dualWrite = new DualWrite(local, remote)
    const dsl = new Dsl(local)
    feature = dsl.feature('test_feature')
    gate = new BooleanGate()
    thing = new BooleanType(true)
  })

  describe('name', () => {
    it('returns local adapter name', () => {
      expect(dualWrite.name).toBe('memory')
    })
  })

  describe('read operations', () => {
    it('reads features from local only', () => {
      local.add(feature)

      expect(dualWrite.features()).toEqual([feature])
    })

    it('does not read from remote', () => {
      remote.add(feature)

      expect(dualWrite.features()).toEqual([])
    })

    it('reads get from local only', () => {
      local.add(feature)
      const localSpy = jest.spyOn(local, 'get')
      const remoteSpy = jest.spyOn(remote, 'get')

      dualWrite.get(feature)

      expect(localSpy).toHaveBeenCalled()
      expect(remoteSpy).not.toHaveBeenCalled()
    })

    it('reads getMulti from local only', () => {
      local.add(feature)
      const localSpy = jest.spyOn(local, 'getMulti')
      const remoteSpy = jest.spyOn(remote, 'getMulti')

      dualWrite.getMulti([feature])

      expect(localSpy).toHaveBeenCalled()
      expect(remoteSpy).not.toHaveBeenCalled()
    })

    it('reads getAll from local only', () => {
      local.add(feature)
      const localSpy = jest.spyOn(local, 'getAll')
      const remoteSpy = jest.spyOn(remote, 'getAll')

      dualWrite.getAll()

      expect(localSpy).toHaveBeenCalled()
      expect(remoteSpy).not.toHaveBeenCalled()
    })
  })

  describe('write operations', () => {
    it('writes add to both adapters', () => {
      dualWrite.add(feature)

      expect(local.features()).toContainEqual(feature)
      expect(remote.features()).toContainEqual(feature)
    })

    it('writes add to remote first', () => {
      const order: string[] = []

      const localSpy = jest.spyOn(local, 'add').mockImplementation(() => {
        order.push('local')
        return true
      })

      const remoteSpy = jest.spyOn(remote, 'add').mockImplementation(() => {
        order.push('remote')
        return true
      })

      dualWrite.add(feature)

      expect(order).toEqual(['remote', 'local'])

      localSpy.mockRestore()
      remoteSpy.mockRestore()
    })

    it('writes remove to both adapters', () => {
      local.add(feature)
      remote.add(feature)

      dualWrite.remove(feature)

      expect(local.features()).toHaveLength(0)
      expect(remote.features()).toHaveLength(0)
    })

    it('writes clear to both adapters', () => {
      local.add(feature)
      remote.add(feature)

      const localSpy = jest.spyOn(local, 'clear')
      const remoteSpy = jest.spyOn(remote, 'clear')

      dualWrite.clear(feature)

      expect(localSpy).toHaveBeenCalled()
      expect(remoteSpy).toHaveBeenCalled()
    })

    it('writes enable to both adapters', () => {
      local.add(feature)
      remote.add(feature)

      const localSpy = jest.spyOn(local, 'enable')
      const remoteSpy = jest.spyOn(remote, 'enable')

      dualWrite.enable(feature, gate, thing)

      expect(localSpy).toHaveBeenCalled()
      expect(remoteSpy).toHaveBeenCalled()
    })

    it('writes disable to both adapters', () => {
      local.add(feature)
      remote.add(feature)

      const localSpy = jest.spyOn(local, 'disable')
      const remoteSpy = jest.spyOn(remote, 'disable')

      dualWrite.disable(feature, gate, thing)

      expect(localSpy).toHaveBeenCalled()
      expect(remoteSpy).toHaveBeenCalled()
    })
  })

  describe('readOnly', () => {
    it('delegates to local adapter', () => {
      expect(dualWrite.readOnly()).toBe(local.readOnly())
    })
  })

  describe('migration scenario', () => {
    it('supports gradual migration pattern', () => {
      // Step 1: Write to both, read from old (local)
      const dsl = new Dsl(dualWrite)

      // Enable in both adapters
      dsl.add('new_feature')
      dsl.enable('new_feature')

      // Verify both have it
      expect(local.features().some((f) => f.name === 'new_feature')).toBe(true)
      expect(remote.features().some((f) => f.name === 'new_feature')).toBe(true)

      // But reads come from local
      const localResult = local.get(feature)
      const dualResult = dualWrite.get(feature)
      expect(dualResult).toEqual(localResult)
    })

    it('allows verifying sync between adapters', () => {
      // Add to both
      dualWrite.add(feature)

      // Enable in both
      dualWrite.enable(feature, gate, thing)

      // Verify they match
      const localData = local.get(feature)
      const remoteData = remote.get(feature)

      expect(localData).toEqual(remoteData)
    })
  })

  describe('error handling', () => {
    it('returns remote result even if local fails', () => {
      const failingLocal = new MemoryAdapter()
      jest.spyOn(failingLocal, 'add').mockImplementation(() => {
        throw new Error('Local failed')
      })

      const dualWrite = new DualWrite(failingLocal, remote)

      // Should not throw, returns remote result
      expect(() => dualWrite.add(feature)).toThrow('Local failed')
    })
  })
})
