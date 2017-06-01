import { Actor } from './interfaces'
import ActorType from './ActorType'
import Gate from './Gate'
import FeatureCheckContext from './FeatureCheckContext'

class ActorGate implements Gate {
  name: string
  key: string
  dataType: string

  constructor() {
    this.name = 'actor'
    this.key = 'actors'
    this.dataType = 'set'
  }

  isOpen(context: FeatureCheckContext): boolean {
    if(context.thing === 'undefined') {
      return false
    } else {
      if(this.protectsThing(context.thing)) {
        const enabledActors = context.values[this.key]
        return enabledActors.has(String(context.thing.value))
      } else {
        return false
      }
    }
  }

  protectsThing(thing: any) {
    if(thing instanceof ActorType) { return true }
    if(typeof(thing) === 'object' && typeof(thing.flipperId) !== 'undefined') { return true }
    return false
  }

  wrap(thing: any) {
    return ActorType.wrap(thing)
  }
}

export default ActorGate
