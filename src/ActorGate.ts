import { Actor } from './interfaces'
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
    if(thing === undefined) { return false }
    return typeof(thing.flipperId) !== 'undefined'
  }
}

export default ActorGate
