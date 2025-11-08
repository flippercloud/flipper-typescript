import OperationLogger from './OperationLogger'
import MemoryAdapter from '../MemoryAdapter'
import Feature from '../Feature'
import Dsl from '../Dsl'
import BooleanGate from '../BooleanGate'
import BooleanType from '../BooleanType'

describe('OperationLogger', () => {
  let adapter: MemoryAdapter
  let logger: OperationLogger
  let feature: Feature
  let gate: BooleanGate
  let thing: BooleanType

  beforeEach(() => {
    adapter = new MemoryAdapter()
    logger = new OperationLogger(adapter)
    const dsl = new Dsl(adapter)
    feature = dsl.feature('test_feature')
    gate = new BooleanGate()
    thing = new BooleanType(true)
  })

  describe('logging operations', () => {
    it('logs add operation', () => {
      logger.add(feature)

      expect(logger.count()).toBe(1)
      expect(logger.count('add')).toBe(1)
    })

    it('logs remove operation', () => {
      adapter.add(feature)
      logger.remove(feature)

      expect(logger.count('remove')).toBe(1)
    })

    it('logs clear operation', () => {
      adapter.add(feature)
      logger.clear(feature)

      expect(logger.count('clear')).toBe(1)
    })

    it('logs get operation', () => {
      adapter.add(feature)
      logger.get(feature)

      expect(logger.count('get')).toBe(1)
    })

    it('logs getMulti operation', () => {
      adapter.add(feature)
      logger.getMulti([feature])

      expect(logger.count('getMulti')).toBe(1)
    })

    it('logs getAll operation', () => {
      logger.getAll()

      expect(logger.count('getAll')).toBe(1)
    })

    it('logs enable operation', () => {
      adapter.add(feature)
      logger.enable(feature, gate, thing)

      expect(logger.count('enable')).toBe(1)
    })

    it('logs disable operation', () => {
      adapter.add(feature)
      logger.disable(feature, gate, thing)

      expect(logger.count('disable')).toBe(1)
    })

    it('logs features operation', () => {
      logger.features()

      expect(logger.count('features')).toBe(1)
    })
  })

  describe('count()', () => {
    it('returns total count without argument', () => {
      logger.add(feature)
      logger.features()
      logger.get(feature)

      expect(logger.count()).toBe(3)
    })

    it('returns count for specific operation type', () => {
      logger.add(feature)
      logger.add(feature)
      logger.features()

      expect(logger.count('add')).toBe(2)
      expect(logger.count('features')).toBe(1)
    })

    it('returns 0 for operations that did not happen', () => {
      logger.add(feature)

      expect(logger.count('remove')).toBe(0)
    })
  })

  describe('type()', () => {
    it('returns all operations of given type', () => {
      logger.add(feature)
      logger.add(feature)
      logger.features()

      const adds = logger.type('add')

      expect(adds).toHaveLength(2)
      expect(adds.every((op) => op.type === 'add')).toBe(true)
    })

    it('returns empty array for operations that did not happen', () => {
      logger.add(feature)

      expect(logger.type('remove')).toEqual([])
    })
  })

  describe('last()', () => {
    it('returns last operation of given type', () => {
      logger.add(feature)
      logger.features()
      logger.add(feature)

      const lastAdd = logger.last('add')

      expect(lastAdd).toBeDefined()
      expect(lastAdd?.type).toBe('add')
    })

    it('returns undefined for operations that did not happen', () => {
      logger.add(feature)

      expect(logger.last('remove')).toBeUndefined()
    })

    it('returns most recent when multiple operations', () => {
      logger.add(feature)
      logger.add(feature)
      logger.features()
      logger.add(feature)

      expect(logger.count('add')).toBe(3)
      expect(logger.last('add')).toBeDefined()
    })
  })

  describe('reset()', () => {
    it('clears all operations', () => {
      logger.add(feature)
      logger.features()
      logger.get(feature)

      expect(logger.count()).toBe(3)

      logger.reset()

      expect(logger.count()).toBe(0)
    })

    it('allows logging new operations after reset', () => {
      logger.add(feature)
      logger.reset()
      logger.features()

      expect(logger.count()).toBe(1)
      expect(logger.count('features')).toBe(1)
    })
  })

  describe('getOperations()', () => {
    it('returns array of all operations', () => {
      logger.add(feature)
      logger.features()

      const ops = logger.getOperations()

      expect(ops).toHaveLength(2)
      expect(ops[0]?.type).toBe('add')
      expect(ops[1]?.type).toBe('features')
    })

    it('returns copy of operations', () => {
      logger.add(feature)

      const ops1 = logger.getOperations()
      logger.features()
      const ops2 = logger.getOperations()

      expect(ops1).toHaveLength(1)
      expect(ops2).toHaveLength(2)
    })
  })

  describe('toString()', () => {
    it('returns readable representation', () => {
      logger.add(feature)
      logger.features()

      const str = logger.toString()

      expect(str).toContain('OperationLogger')
      expect(str).toContain('adapter=memory')
      expect(str).toContain('operations=2')
    })
  })

  describe('toJSON()', () => {
    it('returns JSON representation', () => {
      logger.add(feature)
      logger.features()

      const json = logger.toJSON()

      expect(json.adapter).toBe('memory')
      expect(json.operationCount).toBe(2)
      expect(json.operations).toHaveLength(2)
    })
  })

  describe('external operations array', () => {
    it('accepts external operations array', () => {
      const operations: Array<{ type: string; args: unknown[] }> = [
        { type: 'add', args: [] },
      ]
      const logger = new OperationLogger(adapter, operations)

      expect(logger.count()).toBe(1)
      expect(logger.count('add')).toBe(1)
    })

    it('appends to external array', () => {
      const operations: Array<{ type: string; args: unknown[] }> = []
      const logger = new OperationLogger(adapter, operations)

      logger.add(feature)

      expect(operations).toHaveLength(1)
      expect(operations[0]?.type).toBe('add')
    })
  })

  describe('integration testing', () => {
    it('helps verify call order', () => {
      const dsl = new Dsl(logger)

      dsl.enable('test_feature')

      const ops = logger.getOperations()

      // enable() calls add() then enable()
      expect(ops.length).toBeGreaterThanOrEqual(2)
      expect(ops[0]?.type).toBe('add')
      expect(ops[ops.length - 1]?.type).toBe('enable')
    })

    it('helps verify call counts in tests', () => {
      const dsl = new Dsl(logger)

      dsl.isFeatureEnabled('test')
      dsl.isFeatureEnabled('test')
      dsl.isFeatureEnabled('test')

      // Should hit get for each check (no memoization)
      expect(logger.count('get')).toBe(3)
    })
  })

  describe('still delegates to adapter', () => {
    it('actually performs add operation', () => {
      logger.add(feature)

      expect(adapter.features()).toContainEqual(feature)
    })

    it('actually performs get operation', () => {
      adapter.add(feature)

      const result = logger.get(feature)

      expect(result).toBeDefined()
    })
  })
})
