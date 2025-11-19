import DualWrite from './DualWrite'
import MemoryAdapter from '../MemoryAdapter'
import Feature from '../Feature'
import Dsl from '../Dsl'
import BooleanGate from '../BooleanGate'
import BooleanType from '../BooleanType'
import { jest, describe, it, beforeEach, expect } from '@jest/globals'

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
    it('reads features from local only', async () => {
      await local.add(feature)

      expect(await dualWrite.features()).toEqual([feature])
    })

    it('does not read from remote', async () => {
      await remote.add(feature)

      expect(await dualWrite.features()).toEqual([])
    })

    it('reads get from local only', async () => {
      await local.add(feature)
      const localSpy = jest.spyOn(local, 'get')
      const remoteSpy = jest.spyOn(remote, 'get')

      await dualWrite.get(feature)

      expect(localSpy).toHaveBeenCalled()
      expect(remoteSpy).not.toHaveBeenCalled()
    })

    it('reads getMulti from local only', async () => {
      await local.add(feature)
      const localSpy = jest.spyOn(local, 'getMulti')
      const remoteSpy = jest.spyOn(remote, 'getMulti')

      await dualWrite.getMulti([feature])

      expect(localSpy).toHaveBeenCalled()
      expect(remoteSpy).not.toHaveBeenCalled()
    })

    it('reads getAll from local only', async () => {
      await local.add(feature)
      const localSpy = jest.spyOn(local, 'getAll')
      const remoteSpy = jest.spyOn(remote, 'getAll')

      await dualWrite.getAll()

      expect(localSpy).toHaveBeenCalled()
      expect(remoteSpy).not.toHaveBeenCalled()
    })
  })

  describe('write operations', () => {
    it('writes add to both adapters', async () => {
      await dualWrite.add(feature)

      expect(await local.features()).toContainEqual(feature)
      expect(await remote.features()).toContainEqual(feature)
    })

    it('writes add to remote first', async () => {
      const order: string[] = []

      const localSpy = jest.spyOn(local, 'add').mockImplementation(async () => {
        order.push('local')
        return await Promise.resolve(true)
      })

      const remoteSpy = jest.spyOn(remote, 'add').mockImplementation(async () => {
        order.push('remote')
        return await Promise.resolve(true)
      })

      await dualWrite.add(feature)

      expect(order).toEqual(['remote', 'local'])

      localSpy.mockRestore()
      remoteSpy.mockRestore()
    })

    it('writes remove to both adapters', async () => {
      await local.add(feature)
      await remote.add(feature)

      await dualWrite.remove(feature)

      expect(await local.features()).toHaveLength(0)
      expect(await remote.features()).toHaveLength(0)
    })

    it('writes clear to both adapters', async () => {
      await local.add(feature)
      await remote.add(feature)

      const localSpy = jest.spyOn(local, 'clear')
      const remoteSpy = jest.spyOn(remote, 'clear')

      await dualWrite.clear(feature)

      expect(localSpy).toHaveBeenCalled()
      expect(remoteSpy).toHaveBeenCalled()
    })

    it('writes enable to both adapters', async () => {
      await local.add(feature)
      await remote.add(feature)

      const localSpy = jest.spyOn(local, 'enable')
      const remoteSpy = jest.spyOn(remote, 'enable')

      await dualWrite.enable(feature, gate, thing)

      expect(localSpy).toHaveBeenCalled()
      expect(remoteSpy).toHaveBeenCalled()
    })

    it('writes disable to both adapters', async () => {
      await local.add(feature)
      await remote.add(feature)

      const localSpy = jest.spyOn(local, 'disable')
      const remoteSpy = jest.spyOn(remote, 'disable')

      await dualWrite.disable(feature, gate, thing)

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
    it('supports gradual migration pattern', async () => {
      // Step 1: Write to both, read from old (local)
      const dsl = new Dsl(dualWrite)

      // Enable in both adapters
      await dsl.add('new_feature')
      await dsl.enable('new_feature')

      // Verify both have it
      expect((await local.features()).some(f => f.name === 'new_feature')).toBe(true)
      expect((await remote.features()).some(f => f.name === 'new_feature')).toBe(true)

      // But reads come from local
      const localResult = await local.get(feature)
      const dualResult = await dualWrite.get(feature)
      expect(dualResult).toEqual(localResult)
    })

    it('allows verifying sync between adapters', async () => {
      // Add to both
      await dualWrite.add(feature)

      // Enable in both
      await dualWrite.enable(feature, gate, thing)

      // Verify they match
      const localData = await local.get(feature)
      const remoteData = await remote.get(feature)

      expect(localData).toEqual(remoteData)
    })
  })

  describe('error handling', () => {
    it('returns remote result even if local fails', async () => {
      const failingLocal = new MemoryAdapter()
      jest.spyOn(failingLocal, 'add').mockImplementation(async () => {
        return await Promise.reject(new Error('Local failed'))
      })

      const dualWrite = new DualWrite(failingLocal, remote)

      // Should throw when local fails
      await expect(dualWrite.add(feature)).rejects.toThrow('Local failed')
    })
  })
})
