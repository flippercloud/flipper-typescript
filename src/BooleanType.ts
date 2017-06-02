import { IType } from './interfaces'

class BooleanType implements IType {
  public static wrap(thing: boolean | BooleanType) {
    if (thing instanceof BooleanType) { return thing }
    return new BooleanType(thing)
  }

  public value: boolean

  constructor(thing: any) {
    this.value = typeof(thing) === 'undefined' ? undefined : thing
  }
}

export default BooleanType
