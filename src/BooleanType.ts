import { IType } from './interfaces'

class BooleanType implements IType {
  public static wrap(thing: unknown): BooleanType {
    if (thing instanceof BooleanType) { return thing }
    if (typeof thing === 'boolean') {
      return new BooleanType(thing)
    }
    throw new Error('Invalid boolean type')
  }

  public value: boolean

  constructor(thing: boolean) {
    this.value = thing
  }
}

export default BooleanType
