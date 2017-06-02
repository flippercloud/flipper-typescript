import { IActor, IType } from './interfaces'

class ActorType implements IType {
  public static wrap(thing: IActor | ActorType): ActorType {
    if (thing instanceof ActorType) { return thing }
    return new ActorType(thing)
  }

  public value: string

  constructor(thing: any) {
    this.value = typeof(thing) === 'undefined' ? undefined : thing.flipperId
  }
}

export default ActorType
