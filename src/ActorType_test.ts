import ActorType from './ActorType'
import { assert, makeActor, suite, test } from './test_helper'

const actor = makeActor(1)
const wrapped = ActorType.wrap(actor)

suite('ActorType', () => {
  test('wraps actor', () => {
    assert.equal(actor.flipperId, wrapped.value)
  })

  test('does not wrap already wrapped actor', () => {
    assert.equal(wrapped, ActorType.wrap(wrapped))
  })
})
