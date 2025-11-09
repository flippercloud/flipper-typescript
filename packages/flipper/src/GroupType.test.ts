import GroupType from './GroupType'

const groupName = 'admins'
const wrapped = GroupType.wrap(groupName)

describe('GroupType', () => {
  test('wraps group', () => {
    expect(wrapped.value).toEqual(groupName)
  })

  test('does not wrap already wrapped group', () => {
    expect(GroupType.wrap(wrapped)).toEqual(wrapped)
  })
})
