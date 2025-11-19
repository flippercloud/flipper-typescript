import PercentageOfTimeType from './PercentageOfTimeType'

const percentage = 50
const wrapped = PercentageOfTimeType.wrap(percentage)

describe('PercentageOfTimeType', () => {
  test('wraps percentage', () => {
    expect(wrapped.value).toEqual(percentage)
  })

  test('does not wrap already wrapped percentage', () => {
    expect(PercentageOfTimeType.wrap(wrapped)).toEqual(wrapped)
  })

  test('throws exception if percentage is out of bounds', () => {
    expect(() => PercentageOfTimeType.wrap(-1)).toThrow(
      'value must be a positive number less than or equal to 100, but was -1'
    )
    expect(() => PercentageOfTimeType.wrap(101)).toThrow(
      'value must be a positive number less than or equal to 100, but was 101'
    )
  })
})
