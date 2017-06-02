import PercentageOfActorsType from './PercentageOfActorsType'
import { assert, suite, test } from './test_helper'

const percentage = 50
const wrapped = PercentageOfActorsType.wrap(percentage)

suite('PercentageOfActorsType', () => {
  test('wraps percentage', () => {
    assert.equal(percentage, wrapped.value)
  })

  test('does not wrap already wrapped percentage', () => {
    assert.equal(wrapped, PercentageOfActorsType.wrap(wrapped))
  })

  test('throws exception if percentage is out of bounds', () => {
    const below = () => {
      PercentageOfActorsType.wrap(-1)
    }
    const above = () => {
      PercentageOfActorsType.wrap(101)
    }
    assert.throws(below, 'value must be a positive number less than or equal to 100, but was -1')
    assert.throws(above, `value must be a positive number less than or equal to 100, but was 101`)
  })
})
