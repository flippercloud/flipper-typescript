import {crc32} from 'crc'
import { Actor } from './interfaces'
import ActorType from './ActorType'
import Gate from './Gate'
import FeatureCheckContext from './FeatureCheckContext'
import PercentageOfActorsType from './PercentageOfActorsType'

function instanceOfActor(thing: any): thing is Actor {
  return 'flipperId' in thing
}

class PercentageOfActorsGate implements Gate {
  name: string
  key: string
  dataType: string

  constructor() {
    this.name = 'percentageOfActors'
    this.key = 'percentageOfActors'
    this.dataType = 'number'
  }

  isOpen(context: FeatureCheckContext): boolean {
    let usable = false
    if(typeof(context.thing) === 'undefined') { return false }
    if(!usable && context.thing instanceof ActorType) { usable = true }
    if(!usable && instanceOfActor(context.thing)) { usable = true }
    if(!usable) { return false }

    const actorType = ActorType.wrap(context.thing)
    const percentage = context.percentageOfActorsValue
    const id = `${context.featureName}${actorType.value}`
    return crc32(id).valueOf() % 100 < percentage
  }

  protectsThing(thing: any) {
    if(thing instanceof PercentageOfActorsType) { return true }
    return false
  }

  wrap(thing: any) {
    return PercentageOfActorsType.wrap(thing)
  }
}

export default PercentageOfActorsGate
