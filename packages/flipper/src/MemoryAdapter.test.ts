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

  test('starts with no features', async () => {
    expect(await adapter.features()).toBeInstanceOf(Array)
    expect(await adapter.features()).toHaveLength(0)
  })

  test('adds feature', async () => {
    await adapter.add(feature)
    expect(await adapter.features()).toHaveLength(1)
    const features = await adapter.features()
    expect(features[0]?.key).toBe(feature.key)
  })

  test('adds and removes feature and clears feature gates', async () => {
    let gates
    const gate = new BooleanGate()
    await adapter.add(feature)
    await adapter.enable(feature, gate, gate.wrap(true))
    expect(await adapter.features()).toHaveLength(1)
    gates = await adapter.get(feature)
    expect(gates['boolean']).toBe('true')
    await adapter.remove(feature)
    expect(await adapter.features()).toHaveLength(0)
    gates = await adapter.get(feature)
    expect(gates['boolean']).toBeUndefined()
    expect(Object.keys(gates)).toHaveLength(0)
  })

  test('gets, enables, disables, and clears boolean feature gate', async () => {
    let gates
    const gate = new BooleanGate()
    await adapter.enable(feature, gate, gate.wrap(true))
    gates = await adapter.get(feature)
    expect(gates['boolean']).toBe('true')
    await adapter.disable(feature, gate, gate.wrap(true))
    gates = await adapter.get(feature)
    expect(gates['boolean']).toBeUndefined()
    await adapter.clear(feature)
    gates = await adapter.get(feature)
    expect(Object.keys(gates)).toHaveLength(0)
  })

  test('getMulti returns gate values for multiple features', async () => {
    const feature1 = new Feature('feature-1', adapter, {})
    const feature2 = new Feature('feature-2', adapter, {})
    const gate = new BooleanGate()

    await adapter.add(feature1)
    await adapter.add(feature2)
    await adapter.enable(feature1, gate, gate.wrap(true))

    const result = await adapter.getMulti([feature1, feature2])

    expect(result['feature-1']?.['boolean']).toBe('true')
    expect(result['feature-2']?.['boolean']).toBeUndefined()
  })

  test('getAll returns gate values for all features', async () => {
    const feature1 = new Feature('feature-1', adapter, {})
    const feature2 = new Feature('feature-2', adapter, {})
    const gate = new BooleanGate()

    await adapter.add(feature1)
    await adapter.add(feature2)
    await adapter.enable(feature1, gate, gate.wrap(true))

    const result = await adapter.getAll()

    expect(result['feature-1']?.['boolean']).toBe('true')
    expect(result['feature-2']?.['boolean']).toBeUndefined()
    expect(Object.keys(result)).toHaveLength(2)
  })

  test('readOnly returns false', () => {
    expect(adapter.readOnly()).toBe(false)
  })
})
