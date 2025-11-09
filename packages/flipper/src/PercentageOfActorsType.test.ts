import PercentageOfActorsType from './PercentageOfActorsType'

const percentage = 50
const wrapped = PercentageOfActorsType.wrap(percentage)

describe('PercentageOfActorsType', () => {
  test('wraps percentage', () => {
    expect(wrapped.value).toEqual(percentage)
  })

  test('does not wrap already wrapped percentage', () => {
    expect(PercentageOfActorsType.wrap(wrapped)).toEqual(wrapped)
  })

  test('throws exception if percentage is out of bounds', () => {
    expect(() => {
      PercentageOfActorsType.wrap(-1)
    }).toThrow('value must be a positive number less than or equal to 100, but was -1')

    expect(() => {
      PercentageOfActorsType.wrap(101)
    }).toThrow('value must be a positive number less than or equal to 100, but was 101')
  })
})
