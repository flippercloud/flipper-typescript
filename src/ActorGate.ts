import ActorType from './ActorType'
import FeatureCheckContext from './FeatureCheckContext'
import { IGate } from './interfaces'

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
        return enabledActors.has(String(context.thing.value))
      } else {
        return false
      }
    }
  }

  public protectsThing(thing: any) {
    if (thing instanceof ActorType) { return true }
    if (typeof(thing) === 'object' && typeof(thing.flipperId) !== 'undefined') { return true }
    return false
  }

  public wrap(thing: any) {
    return ActorType.wrap(thing)
  }
}

export default ActorGate
