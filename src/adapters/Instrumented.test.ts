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
    it('instruments features() operation', () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })

      adapter.features()

      expect(instrumenter.count()).toBe(1)
      const event = instrumenter.eventByName(Instrumented.INSTRUMENTATION_NAME)!
      expect(event.payload.operation).toBe('features')
      expect(event.payload.adapter_name).toBe('memory')
    })

    it('instruments add() operation', () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const feature = new Feature('search', adapter, {})

      adapter.add(feature)

      expect(instrumenter.count()).toBe(1)
      const event = instrumenter.eventByName(Instrumented.INSTRUMENTATION_NAME)!
      expect(event.payload.operation).toBe('add')
      expect(event.payload.adapter_name).toBe('memory')
      expect(event.payload.feature_name).toBe('search')
    })

    it('instruments remove() operation', () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const feature = new Feature('search', adapter, {})

      adapter.remove(feature)

      expect(instrumenter.count()).toBe(1)
      const event = instrumenter.eventByName(Instrumented.INSTRUMENTATION_NAME)!
      expect(event.payload.operation).toBe('remove')
      expect(event.payload.adapter_name).toBe('memory')
      expect(event.payload.feature_name).toBe('search')
    })

    it('instruments clear() operation', () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const feature = new Feature('search', adapter, {})

      adapter.clear(feature)

      expect(instrumenter.count()).toBe(1)
      const event = instrumenter.eventByName(Instrumented.INSTRUMENTATION_NAME)!
      expect(event.payload.operation).toBe('clear')
      expect(event.payload.adapter_name).toBe('memory')
      expect(event.payload.feature_name).toBe('search')
    })

    it('instruments get() operation', () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const feature = new Feature('search', adapter, {})

      adapter.get(feature)

      expect(instrumenter.count()).toBe(1)
      const event = instrumenter.eventByName(Instrumented.INSTRUMENTATION_NAME)!
      expect(event.payload.operation).toBe('get')
      expect(event.payload.adapter_name).toBe('memory')
      expect(event.payload.feature_name).toBe('search')
    })

    it('instruments getMulti() operation', () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const feature1 = new Feature('search', adapter, {})
      const feature2 = new Feature('stats', adapter, {})

      adapter.getMulti([feature1, feature2])

      expect(instrumenter.count()).toBe(1)
      const event = instrumenter.eventByName(Instrumented.INSTRUMENTATION_NAME)!
      expect(event.payload.operation).toBe('getMulti')
      expect(event.payload.adapter_name).toBe('memory')
      expect(event.payload.feature_names).toEqual(['search', 'stats'])
    })

    it('instruments getAll() operation', () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })

      adapter.getAll()

      expect(instrumenter.count()).toBe(1)
      const event = instrumenter.eventByName(Instrumented.INSTRUMENTATION_NAME)!
      expect(event.payload.operation).toBe('getAll')
      expect(event.payload.adapter_name).toBe('memory')
    })

    it('instruments enable() operation', () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const feature = new Feature('search', adapter, {})

      feature.enable()

      // Should have 2 events: add and enable
      expect(instrumenter.count()).toBeGreaterThan(1)
      const enableEvents = instrumenter.eventsByName(Instrumented.INSTRUMENTATION_NAME)
        .filter(e => e.payload.operation === 'enable')
      expect(enableEvents.length).toBe(1)
      expect(enableEvents[0]!.payload.feature_name).toBe('search')
      expect(enableEvents[0]!.payload.gate_name).toBe('boolean')
    })

    it('instruments disable() operation', () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const feature = new Feature('search', adapter, {})

      feature.disable()

      // Should have 2 events: add and disable
      expect(instrumenter.count()).toBeGreaterThan(1)
      const disableEvents = instrumenter.eventsByName(Instrumented.INSTRUMENTATION_NAME)
        .filter(e => e.payload.operation === 'disable')
      expect(disableEvents.length).toBe(1)
      expect(disableEvents[0]!.payload.feature_name).toBe('search')
      expect(disableEvents[0]!.payload.gate_name).toBe('boolean')
    })

    it('still delegates to wrapped adapter', () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const feature = new Feature('search', adapter, {})

      adapter.add(feature)
      adapter.enable(feature, feature.gate('boolean')!, feature.gate('boolean')!.wrap(true))

      expect(feature.isEnabled()).toBe(true)
    })
  })

  describe('integration with Dsl', () => {
    it('can be used with Dsl', () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const flipper = new Dsl(adapter)

      flipper.enable('search')

      expect(flipper.feature('search').isEnabled()).toBe(true)
      expect(instrumenter.count()).toBeGreaterThan(0)
    })

    it('tracks all operations through Dsl', () => {
      const memory = new MemoryAdapter()
      const instrumenter = new MemoryInstrumenter()
      const adapter = new Instrumented(memory, { instrumenter })
      const flipper = new Dsl(adapter)

      instrumenter.reset()

      flipper.enable('search')
      flipper.disable('search')
      flipper.remove('search')

      const events = instrumenter.eventsByName(Instrumented.INSTRUMENTATION_NAME)
      expect(events.length).toBeGreaterThan(3)

      const operations = events.map(e => e.payload.operation)
      expect(operations).toContain('enable')
      expect(operations).toContain('disable')
      expect(operations).toContain('remove')
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
    it('uses NoopInstrumenter when no instrumenter provided', () => {
      const memory = new MemoryAdapter()
      const adapter = new Instrumented(memory)
      const feature = new Feature('search', adapter, {})

      // Should not throw and should work normally
      adapter.add(feature)
      feature.enable()
      expect(feature.isEnabled()).toBe(true)
    })
  })
})
