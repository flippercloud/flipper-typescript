import ActorType from './ActorType'
import FeatureCheckContext from './FeatureCheckContext'
import { IGate, IType } from './interfaces'

class ActorGate implements IGate {
  public name: string
  public key: string
  public dataType: string

  constructor() {
    this.name = 'actor'
    this.key = 'actors'
    this.dataType = 'set'
  }

  public isOpen(context: FeatureCheckContext): boolean {
    if (context.thing === 'undefined') {
      return false
    } else {
      if (this.protectsThing(context.thing)) {
        const enabledActors = context.actorsValue
        const actorType = context.thing as ActorType
        return enabledActors.has(String(actorType.value))
      } else {
        return false
      }
    }
  }

  public protectsThing(thing: unknown): boolean {
    if (thing instanceof ActorType) { return true }
    if (typeof(thing) === 'object' && thing !== null && 'flipperId' in thing) { return true }
    return false
  }

  public wrap(thing: unknown): IType {
    return ActorType.wrap(thing)
  }
}

export default ActorGate
