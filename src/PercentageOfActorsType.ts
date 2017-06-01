import { Type } from './interfaces'

class PercentageOfActorsType implements Type {
  public value: number

  static wrap(thing: number | PercentageOfActorsType) {
    if(typeof(thing) === 'undefined') { return thing }
    if(thing instanceof PercentageOfActorsType) { return thing }
    return new PercentageOfActorsType(thing)
  }

  constructor(value: number) {
    if (value < 0 || value > 100) {
      throw `value must be a positive number less than or equal to 100, but was ${value}`
    }

    this.value = value
  }
}

export default PercentageOfActorsType
