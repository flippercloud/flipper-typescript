import Flipper from '../Flipper'
import MemoryAdapter from '../MemoryAdapter'
import JsonExport, { JsonError, InvalidError } from '../exporters/json/Export'
import Exporter from '../Exporter'

describe('Export/Import System', () => {
  describe('Export', () => {
    test('exports features from adapter', () => {
      const adapter = new MemoryAdapter()
      const flipper = new Flipper(adapter)

      // Enable some features
      flipper.enable('search')
      flipper.enableActor('analytics', { flipperId: 'User;1' })
      flipper.enablePercentageOfActors('gradual', 25)

      // Export
      const exportObj = flipper.export()

      // Check export properties
      expect(exportObj.format).toBe('json')
      expect(exportObj.version).toBe(1)
      expect(exportObj.contents).toBeTruthy()

      // Parse contents
      const data = JSON.parse(exportObj.contents) as { version: number; features: Record<string, unknown> }
      expect(data.version).toBe(1)
      expect(data.features).toBeDefined()
      expect(data.features.search).toBeDefined()
      expect(data.features.analytics).toBeDefined()
      expect(data.features.gradual).toBeDefined()
    })

    test('exports with specific format and version', () => {
      const adapter = new MemoryAdapter()
      const flipper = new Flipper(adapter)
      flipper.enable('test')

      const exportObj = flipper.export({ format: 'json', version: 1 })

      expect(exportObj.format).toBe('json')
      expect(exportObj.version).toBe(1)
    })

    test('exports empty features', () => {
      const adapter = new MemoryAdapter()
      const flipper = new Flipper(adapter)

      const exportObj = flipper.export()
      const data = JSON.parse(exportObj.contents) as { features: Record<string, unknown> }

      expect(data.features).toEqual({})
    })
  })

  describe('Import', () => {
    test('imports from another Flipper instance', () => {
      const sourceAdapter = new MemoryAdapter()
      const source = new Flipper(sourceAdapter)
      source.enable('feature1')
      source.enableActor('feature2', { flipperId: 'User;1' })

      const destAdapter = new MemoryAdapter()
      const dest = new Flipper(destAdapter)

      dest.import(source)

      expect(dest.isFeatureEnabled('feature1')).toBe(true)
      expect(dest.isFeatureEnabled('feature2', { flipperId: 'User;1' })).toBe(true)
    })

    test('imports from an export', () => {
      const sourceAdapter = new MemoryAdapter()
      const source = new Flipper(sourceAdapter)
      source.enable('feature1')

      const exportObj = source.export()

      const destAdapter = new MemoryAdapter()
      const dest = new Flipper(destAdapter)
      dest.import(exportObj)

      expect(dest.isFeatureEnabled('feature1')).toBe(true)
    })

    test('imports from an adapter', () => {
      const sourceAdapter = new MemoryAdapter()
      const source = new Flipper(sourceAdapter)
      source.enable('feature1')

      const destAdapter = new MemoryAdapter()
      const dest = new Flipper(destAdapter)
      dest.import(sourceAdapter)

      expect(dest.isFeatureEnabled('feature1')).toBe(true)
    })

    test('import is destructive - removes features not in source', () => {
      const sourceAdapter = new MemoryAdapter()
      const source = new Flipper(sourceAdapter)
      source.enable('keep')

      const destAdapter = new MemoryAdapter()
      const dest = new Flipper(destAdapter)
      dest.enable('keep')
      dest.enable('remove')

      expect(dest.features().length).toBe(2)

      dest.import(source)

      expect(dest.features().length).toBe(1)
      expect(dest.isFeatureEnabled('keep')).toBe(true)
      const allFeatures = dest.features()
      expect(allFeatures.find(f => f.name === 'remove')).toBeUndefined()
    })

    test('imports all gate types', () => {
      const sourceAdapter = new MemoryAdapter()
      const source = new Flipper(sourceAdapter)

      // Set up various gates
      source.enable('boolean-test')
      source.enableActor('actor-test', { flipperId: 'User;1' })
      source.enableActor('actor-test', { flipperId: 'User;2' })
      source.register('admins', (actor) => actor.isAdmin === true)
      source.enableGroup('group-test', 'admins')
      source.enablePercentageOfActors('percentage-actors-test', 50)
      source.enablePercentageOfTime('percentage-time-test', 25)

      const destAdapter = new MemoryAdapter()
      const dest = new Flipper(destAdapter)
      dest.import(source)

      expect(dest.isFeatureEnabled('boolean-test')).toBe(true)
      expect(dest.isFeatureEnabled('actor-test', { flipperId: 'User;1' })).toBe(true)
      expect(dest.isFeatureEnabled('actor-test', { flipperId: 'User;2' })).toBe(true)
      dest.register('admins', (actor) => actor.isAdmin === true)
      expect(dest.isFeatureEnabled('group-test', { flipperId: 'User;1', isAdmin: true })).toBe(true)
      // Note: Percentage gates can't be easily tested for exact values without checking internals
    })
  })

  describe('JsonExport', () => {
    test('parses features from JSON contents', () => {
      const contents = JSON.stringify({
        version: 1,
        features: {
          search: {
            boolean: 'true',
            actors: [],
            groups: [],
            percentageOfActors: null,
            percentageOfTime: null,
            expression: null,
          },
        },
      })

      const jsonExport = new JsonExport({ contents })
      const features = jsonExport.features()

      expect(features.search).toBeDefined()
      if (features.search) {
        expect(features.search.boolean).toBe('true')
      }
    })

    test('throws JsonError on invalid JSON', () => {
      const jsonExport = new JsonExport({ contents: 'invalid json' })

      expect(() => jsonExport.features()).toThrow(JsonError)
    })

    test('throws InvalidError on missing features property', () => {
      const jsonExport = new JsonExport({ contents: '{"version": 1}' })

      expect(() => jsonExport.features()).toThrow(InvalidError)
    })

    test('converts arrays to sets', () => {
      const contents = JSON.stringify({
        version: 1,
        features: {
          test: {
            actors: ['User;1', 'User;2'],
            groups: ['admins'],
          },
        },
      })

      const jsonExport = new JsonExport({ contents })
      const features = jsonExport.features()

      expect(features.test).toBeDefined()
      if (features.test) {
        expect(features.test.actors).toBeInstanceOf(Set)
        expect(features.test.groups).toBeInstanceOf(Set)
      }
    })
  })

  describe('Exporter', () => {
    test('builds V1 JSON exporter by default', () => {
      const exporter = Exporter.build()
      expect(exporter).toBeDefined()
    })

    test('builds exporter for specific format and version', () => {
      const exporter = Exporter.build({ format: 'json', version: 1 })
      expect(exporter).toBeDefined()
    })

    test('throws on unsupported format', () => {
      expect(() => Exporter.build({ format: 'xml' })).toThrow('Unsupported export format')
    })

    test('throws on unsupported version', () => {
      expect(() => Exporter.build({ format: 'json', version: 999 })).toThrow(
        'Unsupported json export version'
      )
    })
  })

  describe('Full Round-trip', () => {
    test('exports and imports successfully', () => {
      const source = new Flipper(new MemoryAdapter())

      source.enable('test1')
      source.enableActor('test2', { flipperId: 'User;1' })
      source.enablePercentageOfActors('test3', 30)

      const exportObj = source.export()
      const jsonString = exportObj.contents

      const dest = new Flipper(new MemoryAdapter())
      const importExport = new JsonExport({ contents: jsonString })
      dest.import(importExport)

      expect(dest.isFeatureEnabled('test1')).toBe(true)
      expect(dest.isFeatureEnabled('test2', { flipperId: 'User;1' })).toBe(true)
      expect(dest.features().length).toBe(3)
    })

    test('handles complex feature configurations', () => {
      const source = new Flipper(new MemoryAdapter())

      // Complex configuration
      source.enableActor('multi', { flipperId: 'User;1' })
      source.enableActor('multi', { flipperId: 'User;2' })
      source.enableActor('multi', { flipperId: 'User;3' })
      source.register('group1', () => true)
      source.register('group2', () => false)
      source.enableGroup('multi', 'group1')
      source.enableGroup('multi', 'group2')
      source.enablePercentageOfActors('multi', 75)
      source.enablePercentageOfTime('multi', 50)

      const dest = new Flipper(new MemoryAdapter())
      dest.register('group1', () => true)
      dest.register('group2', () => false)
      dest.import(source)

      expect(dest.isFeatureEnabled('multi', { flipperId: 'User;1' })).toBe(true)
      expect(dest.isFeatureEnabled('multi', { flipperId: 'User;2' })).toBe(true)
      expect(dest.isFeatureEnabled('multi', { flipperId: 'User;3' })).toBe(true)
    })
  })
})
