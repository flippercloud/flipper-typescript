import MemoryAdapter from './MemoryAdapter'
import BooleanGate from './BooleanGate'
import Feature from './Feature'

let adapter: MemoryAdapter
let feature: Feature

describe('MemoryAdapter', () => {
  beforeEach(() => {
    adapter = new MemoryAdapter()
    feature = new Feature('feature-1', adapter, {})
  })

  test('has a name', () => {
    expect(adapter.name).toBe('memory')
  })

  test('starts with no features', () => {
    expect(adapter.features()).toBeInstanceOf(Array)
    expect(adapter.features()).toHaveLength(0)
  })

  test('adds feature', () => {
    adapter.add(feature)
    expect(adapter.features()).toHaveLength(1)
    expect(adapter.features()[0]).toBe(feature)
  })

  test('adds and removes feature and clears feature gates', () => {
    let gates
    const gate = new BooleanGate()
    adapter.add(feature)
    adapter.enable(feature, gate, gate.wrap(true))
    expect(adapter.features()).toHaveLength(1)
    gates = adapter.get(feature)
    expect(gates['boolean']).toBe('true')
    adapter.remove(feature)
    expect(adapter.features()).toHaveLength(0)
    gates = adapter.get(feature)
    expect(gates['boolean']).toBeUndefined()
    expect(gates['actors']).toBeInstanceOf(Set)
    expect((gates['actors'] as Set<string>).size).toBe(0)
  })

  test('gets, enables, disables, and clears boolean feature gate', () => {
    let gates
    const gate = new BooleanGate()
    adapter.enable(feature, gate, gate.wrap(true))
    gates = adapter.get(feature)
    expect(gates['boolean']).toBe('true')
    adapter.disable(feature, gate, gate.wrap(true))
    gates = adapter.get(feature)
    expect(gates['boolean']).toBeUndefined()
    adapter.clear(feature)
    gates = adapter.get(feature)
    expect(gates['boolean']).toBeUndefined()
    expect(gates['actors']).toBeInstanceOf(Set)
    expect((gates['actors'] as Set<string>).size).toBe(0)
  })

  test('getMulti returns gate values for multiple features', () => {
    const feature1 = new Feature('feature-1', adapter, {})
    const feature2 = new Feature('feature-2', adapter, {})
    const gate = new BooleanGate()

    adapter.add(feature1)
    adapter.add(feature2)
    adapter.enable(feature1, gate, gate.wrap(true))

    const result = adapter.getMulti([feature1, feature2])

    expect(result['feature-1']?.['boolean']).toBe('true')
    expect(result['feature-2']?.['boolean']).toBeUndefined()
  })

  test('getAll returns gate values for all features', () => {
    const feature1 = new Feature('feature-1', adapter, {})
    const feature2 = new Feature('feature-2', adapter, {})
    const gate = new BooleanGate()

    adapter.add(feature1)
    adapter.add(feature2)
    adapter.enable(feature1, gate, gate.wrap(true))

    const result = adapter.getAll()

    expect(result['feature-1']?.['boolean']).toBe('true')
    expect(result['feature-2']?.['boolean']).toBeUndefined()
    expect(Object.keys(result)).toHaveLength(2)
  })

  test('readOnly returns false', () => {
    expect(adapter.readOnly()).toBe(false)
  })
})
