import Feature from './Feature'
import { IActor } from './interfaces'
import MemoryAdapter from './MemoryAdapter'
import { makeActor } from './test_helper'

let adapter: MemoryAdapter
let feature: Feature

describe('Feature', () => {
  beforeEach(() => {
    adapter = new MemoryAdapter()
    feature = new Feature('feature-1', adapter, {})
  })

  test('has name', () => {
    expect(feature.name).toEqual('feature-1')
  })

  test('enable and disable feature', () => {
    expect(feature.isEnabled()).toEqual(false)
    feature.enable()
    expect(feature.isEnabled()).toEqual(true)
    feature.disable()
    expect(feature.isEnabled()).toEqual(false)
  })

  test('enable and disable feature for actor', () => {
    const actor = makeActor(5)
    expect(feature.isEnabled(actor)).toEqual(false)
    feature.enableActor(actor)
    expect(feature.isEnabled(actor)).toEqual(true)
    feature.disableActor(actor)
    expect(feature.isEnabled(actor)).toEqual(false)
  })
})
