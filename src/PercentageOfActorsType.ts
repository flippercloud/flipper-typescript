import { IType } from './interfaces'

class PercentageOfActorsType implements IType {
  public static wrap(thing: unknown): PercentageOfActorsType {
    if (thing instanceof PercentageOfActorsType) { return thing }
    if (typeof thing === 'number') {
      return new PercentageOfActorsType(thing)
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

export default PercentageOfActorsType
