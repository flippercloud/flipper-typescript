import { crc32 } from 'crc'

import FeatureCheckContext from './FeatureCheckContext'
import GateValues from './GateValues'
import PercentageOfActorsGate from './PercentageOfActorsGate'

const gate = new PercentageOfActorsGate()

describe('PercentageOfActorsGate', () => {
  test('has name, key, and dataType', () => {
    expect(gate.name).toBe('percentageOfActors')
    expect(gate.key).toBe('percentageOfActors')
    expect(gate.dataType).toBe('number')
  })

  test('matches Ruby hashing semantics (single actor)', () => {
    const featureName = 'my-feature'
    const actor = { flipperId: 'user-42' }

    const values = new GateValues({ percentageOfActors: 25 })
    const context = new FeatureCheckContext(featureName, values, actor)

    const expected = rubyPercentageOfActorsOpen(featureName, [actor.flipperId], 25)
    expect(gate.isOpen(context)).toBe(expected)
  })

  test('supports up to 3 decimal places like Ruby (value stored as string)', () => {
    const featureName = 'my-feature'

    // Pick an actor ID that deterministically lands in the (12.0%, 12.5%) bucket range.
    // This ensures the decimal portion actually affects the result.
    const scalingFactor = 1000
    const scaledThreshold = 100 * scalingFactor
    let actorId: string | null = null
    let bucket: number | null = null

    for (let i = 0; i < 100_000; i++) {
      const candidate = `user-${i}`
      const candidateBucket = crc32(`${featureName}${candidate}`).valueOf() % scaledThreshold

      if (candidateBucket >= 12_000 && candidateBucket < 12_500) {
        actorId = candidate
        bucket = candidateBucket
        break
      }
    }

    expect(actorId).not.toBeNull()
    expect(bucket).not.toBeNull()

    const actor = { flipperId: actorId as string }

    // MemoryAdapter stores numeric gates as strings; GateValues must parse these.
    const values12 = new GateValues({ percentageOfActors: '12.0' })
    const context12 = new FeatureCheckContext(featureName, values12, actor)
    expect(gate.isOpen(context12)).toBe(false)

    const values125 = new GateValues({ percentageOfActors: '12.5' })
    const context125 = new FeatureCheckContext(featureName, values125, actor)
    expect(gate.isOpen(context125)).toBe(true)
  })
})

function rubyPercentageOfActorsOpen(
  featureName: string,
  actorIds: string[],
  percentage: number
): boolean {
  const scalingFactor = 1000
  const id = `${featureName}${[...actorIds].sort().join('')}`
  const hash = crc32(id).valueOf()

  return hash % (100 * scalingFactor) < percentage * scalingFactor
}
