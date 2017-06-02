import { assert } from 'chai'
const { suite, test } = require('mocha')

function makeActor(id: number) {
  return { flipperId: `actor:${id}` }
}

export {
  assert,
  makeActor,
  test,
  suite,
}
