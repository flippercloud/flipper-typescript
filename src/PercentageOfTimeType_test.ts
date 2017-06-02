import PercentageOfTimeType from './PercentageOfTimeType'
import { assert, suite, test } from './test_helper'

const percentage = 50
const wrapped = PercentageOfTimeType.wrap(percentage)

suite('PercentageOfTimeType', () => {
  test('wraps percentage', () => {
    assert.equal(percentage, wrapped.value)
  })

  test('does not wrap already wrapped percentage', () => {
    assert.equal(wrapped, PercentageOfTimeType.wrap(wrapped))
  })

  test('throws exception if percentage is out of bounds', () => {
    const below = () => {
      PercentageOfTimeType.wrap(-1)
    }
    const above = () => {
      PercentageOfTimeType.wrap(101)
    }
    assert.throws(below, 'value must be a positive number less than or equal to 100, but was -1')
    assert.throws(above, `value must be a positive number less than or equal to 100, but was 101`)
  })
})
