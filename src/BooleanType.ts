import { Type } from './interfaces'

class BooleanType implements Type {
  public value: boolean

  static wrap(thing: boolean | BooleanType) {
    if(thing instanceof BooleanType) { return thing }
    return new BooleanType(thing)
  }

  constructor(thing: any) {
    if(thing === undefined) {
      this.value = true
    } else {
      this.value = thing
    }
  }
}

export default BooleanType
