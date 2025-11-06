import ActorType from './ActorType'
import { makeActor } from './test_helper'

const actor = makeActor(1)
const wrapped = ActorType.wrap(actor)

describe('ActorType', () => {
  test('wraps actor', () => {
    expect(actor.flipperId).toBe(wrapped.value)
  })

  test('does not wrap already wrapped actor', () => {
    expect(wrapped).toBe(ActorType.wrap(wrapped))
  })
})
