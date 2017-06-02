import { IType } from './interfaces'

class PercentageOfActorsType implements IType {
  public static wrap(thing: number | PercentageOfActorsType): PercentageOfActorsType {
    if (thing instanceof PercentageOfActorsType) { return thing }
    return new PercentageOfActorsType(thing)
  }

  public value: number

  constructor(value: number) {
    if (value < 0 || value > 100) {
      throw new Error(`value must be a positive number less than or equal to 100, but was ${value}`)
    }

    this.value = value
  }
}

export default PercentageOfActorsType
