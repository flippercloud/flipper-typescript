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
        const enabledActorIds = context.values[this.key]
        return enabledActorIds.has(String(context.thing.flipperId))
      } else {
        return false
      }
    }
  }

  protectsThing(thing: any) {
    return thing && typeof(thing.flipperId) !== 'undefined'
  }
}

export default ActorGate
