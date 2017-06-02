import { IType } from './interfaces'

class PercentageOfTimeType implements IType {
  public static wrap(thing: number | PercentageOfTimeType): PercentageOfTimeType {
    if (thing instanceof PercentageOfTimeType) { return thing }
    return new PercentageOfTimeType(thing)
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
