import { assert } from 'chai'
const { suite, test } = require('mocha')

function makeActor(id: number, isAdmin = false) {
  return { flipperId: `actor:${id}`, isAdmin }
}

export {
  assert,
  makeActor,
  test,
  suite,
}
