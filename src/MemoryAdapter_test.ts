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
    adapter.enable(feature, gate, true)
    expect(adapter.features()).toHaveLength(1)
    gates = adapter.get(feature)
    expect(gates['boolean']).toBe('true')
    adapter.remove(feature)
    expect(adapter.features()).toHaveLength(0)
    gates = adapter.get(feature)
    expect(gates['boolean']).toBeUndefined()
    expect(Object.keys(gates['actors'])).toHaveLength(0)
  })

  test('gets, enables, disables, and clears boolean feature gate', () => {
    let gates
    const gate = new BooleanGate()
    adapter.enable(feature, gate, true)
    gates = adapter.get(feature)
    expect(gates['boolean']).toBe('true')
    adapter.disable(feature, gate, true)
    gates = adapter.get(feature)
    expect(gates['boolean']).toBeUndefined()
    adapter.clear(feature)
    gates = adapter.get(feature)
    expect(gates['boolean']).toBeUndefined()
    expect(Object.keys(gates['actors'])).toHaveLength(0)
  })
})
