import { Actor, Type } from './interfaces'

class ActorType implements Type {
  public thing: any
  public value: string

  static wrap(thing: Actor | ActorType): ActorType {
    if(thing instanceof ActorType) { return thing }
    return new ActorType(thing)
  }

  constructor(thing: any) {
    if(typeof(thing) === 'undefined') {
      this.value = undefined
    } else {
      this.value = thing.flipperId
    }
  }
}

export default ActorType
