import GroupType from './GroupType'
import { assert, suite, test } from './test_helper'

const groupName = 'admins'
const wrapped = GroupType.wrap(groupName)

suite('GroupType', () => {
  test('wraps group', () => {
    assert.equal(groupName, wrapped.value)
  })

  test('does not wrap already wrapped group', () => {
    assert.equal(wrapped, GroupType.wrap(wrapped))
  })
})
