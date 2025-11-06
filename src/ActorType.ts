import { IActor, IType } from './interfaces'

class ActorType implements IType {
  public static wrap(thing: unknown): ActorType {
    if (thing instanceof ActorType) { return thing }
    if (typeof thing === 'object' && thing !== null && 'flipperId' in thing) {
      return new ActorType(thing as IActor)
    }
    throw new Error('Invalid actor type')
  }

  public thing: IActor
  public value: string

  constructor(thing: IActor) {
    this.thing = thing
    this.value = thing.flipperId
  }
}

export default ActorType
