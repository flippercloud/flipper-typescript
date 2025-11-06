import { IType } from './interfaces'

class PercentageOfTimeType implements IType {
  public static wrap(thing: unknown): PercentageOfTimeType {
    if (thing instanceof PercentageOfTimeType) { return thing }
    if (typeof thing === 'number') {
      return new PercentageOfTimeType(thing)
    }
    throw new Error('Invalid percentage type')
  }

  public value: number

  constructor(value: number) {
    if (value < 0 || value > 100) {
      throw new Error(`value must be a positive number less than or equal to 100, but was ${value}`)
    }

    this.value = value
  }
}

export default PercentageOfTimeType
