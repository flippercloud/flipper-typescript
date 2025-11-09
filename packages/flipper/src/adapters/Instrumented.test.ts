import { describe, expect, it } from '@jest/globals'
import Dsl from '../Dsl'
import Feature from '../Feature'
import MemoryInstrumenter from '../instrumenters/MemoryInstrumenter'
import MemoryAdapter from '../MemoryAdapter'
import Instrumented from './Instrumented'

describe('Instrumented', () => {
  describe('name', () => {
    it('returns the wrapped adapter name', () => {
      const memory = new MemoryAdapter()
      const adapter = new Instrumented(memory)
      expect(adapter.name).toBe(memory.name)
    })
  })

  describe('instrumentation', () => {
    it('instruments features() operation', async () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })

      await adapter.features()

      expect(instrumenter.count()).toBe(1)
      const event = instrumenter.eventByName(Instrumented.INSTRUMENTATION_NAME)!
      expect(event.payload.operation).toBe('features')
      expect(event.payload.adapter_name).toBe('memory')
    })

    it('instruments add() operation', async () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const feature = new Feature('search', adapter, {})

      await adapter.add(feature)

      expect(instrumenter.count()).toBe(1)
      const event = instrumenter.eventByName(Instrumented.INSTRUMENTATION_NAME)!
      expect(event.payload.operation).toBe('add')
      expect(event.payload.adapter_name).toBe('memory')
      expect(event.payload.feature_name).toBe('search')
    })

    it('instruments remove() operation', async () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const feature = new Feature('search', adapter, {})

      await adapter.remove(feature)

      expect(instrumenter.count()).toBe(1)
      const event = instrumenter.eventByName(Instrumented.INSTRUMENTATION_NAME)!
      expect(event.payload.operation).toBe('remove')
      expect(event.payload.adapter_name).toBe('memory')
      expect(event.payload.feature_name).toBe('search')
    })

    it('instruments clear() operation', async () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const feature = new Feature('search', adapter, {})

      await adapter.clear(feature)

      expect(instrumenter.count()).toBe(1)
      const event = instrumenter.eventByName(Instrumented.INSTRUMENTATION_NAME)!
      expect(event.payload.operation).toBe('clear')
      expect(event.payload.adapter_name).toBe('memory')
      expect(event.payload.feature_name).toBe('search')
    })

    it('instruments get() operation', async () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const feature = new Feature('search', adapter, {})

      await adapter.get(feature)

      expect(instrumenter.count()).toBe(1)
      const event = instrumenter.eventByName(Instrumented.INSTRUMENTATION_NAME)!
      expect(event.payload.operation).toBe('get')
      expect(event.payload.adapter_name).toBe('memory')
      expect(event.payload.feature_name).toBe('search')
    })

    it('instruments getMulti() operation', async () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const feature1 = new Feature('search', adapter, {})
      const feature2 = new Feature('stats', adapter, {})

      await adapter.getMulti([feature1, feature2])

      expect(instrumenter.count()).toBe(1)
      const event = instrumenter.eventByName(Instrumented.INSTRUMENTATION_NAME)!
      expect(event.payload.operation).toBe('getMulti')
      expect(event.payload.adapter_name).toBe('memory')
      expect(event.payload.feature_names).toEqual(['search', 'stats'])
    })

    it('instruments getAll() operation', async () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })

      await adapter.getAll()

      expect(instrumenter.count()).toBe(1)
      const event = instrumenter.eventByName(Instrumented.INSTRUMENTATION_NAME)!
      expect(event.payload.operation).toBe('getAll')
      expect(event.payload.adapter_name).toBe('memory')
    })

    it('instruments enable() operation', async () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const feature = new Feature('search', adapter, {})

      await feature.enable()

      // Should have 2 events: add and enable
      expect(instrumenter.count()).toBeGreaterThan(1)
      const enableEvents = instrumenter.eventsByName(Instrumented.INSTRUMENTATION_NAME)
        .filter(e => e.payload.operation === 'enable')
      expect(enableEvents.length).toBe(1)
      expect(enableEvents[0]!.payload.feature_name).toBe('search')
      expect(enableEvents[0]!.payload.gate_name).toBe('boolean')
    })

    it('instruments disable() operation', async () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const feature = new Feature('search', adapter, {})

      await feature.disable()

      // Should have 2 events: add and disable
      expect(instrumenter.count()).toBeGreaterThan(1)
      const disableEvents = instrumenter.eventsByName(Instrumented.INSTRUMENTATION_NAME)
        .filter(e => e.payload.operation === 'disable')
      expect(disableEvents.length).toBe(1)
      expect(disableEvents[0]!.payload.feature_name).toBe('search')
      expect(disableEvents[0]!.payload.gate_name).toBe('boolean')
    })

    it('still delegates to wrapped adapter', async () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const feature = new Feature('search', adapter, {})

      await adapter.add(feature)
      await adapter.enable(feature, feature.gate('boolean')!, feature.gate('boolean')!.wrap(true))

      expect(await feature.isEnabled()).toBe(true)
    })
  })

  describe('integration with Dsl', () => {
    it('can be used with Dsl', async () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const flipper = new Dsl(adapter)

      await flipper.enable('search')

      expect(await flipper.feature('search').isEnabled()).toBe(true)
      expect(instrumenter.count()).toBeGreaterThan(0)
    })

    it('tracks all operations through Dsl', async () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const flipper = new Dsl(adapter)

      await flipper.enable('feature1')
      await flipper.enableActor('feature2', { flipperId: 'User;1' })
      await flipper.enablePercentageOfActors('feature3', 50)

      const events = instrumenter.eventsByName(Instrumented.INSTRUMENTATION_NAME)
      expect(events.length).toBeGreaterThan(3)

      const operations = events.map(e => e.payload.operation)
      expect(operations).toContain('enable')
      expect(operations).toContain('add')
    })
  })

  describe('readOnly()', () => {
    it('delegates to wrapped adapter', () => {
      const memory = new MemoryAdapter()
      const adapter = new Instrumented(memory)
      expect(adapter.readOnly()).toBe(false)
    })
  })

  describe('default instrumenter', () => {
    it('uses NoopInstrumenter when no instrumenter provided', async () => {
      const memory = new MemoryAdapter()
      const adapter = new Instrumented(memory)
      const feature = new Feature('search', adapter, {})

      // Should not throw and should work normally
      await adapter.add(feature)
      await feature.enable()
      expect(await feature.isEnabled()).toBe(true)
    })
  })
})
