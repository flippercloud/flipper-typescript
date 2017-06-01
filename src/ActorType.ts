import { Actor, Type } from './interfaces'

class ActorType implements Type {
  public value: string

  static wrap(thing : Actor | ActorType) {
    if(thing instanceof ActorType) {
      return thing
    } else {
      return new ActorType(thing)
    }
  }

  constructor(thing: any) {
    this.value = thing.flipperId
  }
}

export default ActorType
