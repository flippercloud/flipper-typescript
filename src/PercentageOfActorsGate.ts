import {crc32} from 'crc'
import { Actor } from './interfaces'
import ActorType from './ActorType'
import Gate from './Gate'
import FeatureCheckContext from './FeatureCheckContext'

function instanceOfActor(thing: any): thing is Actor {
  return 'flipperId' in thing
}

class PercentageOfActorsGate implements Gate {
  name: string
  key: string
  dataType: string

  constructor() {
    this.name = 'percentage_of_actors'
    this.key = 'percentage_of_actors'
    this.dataType = 'number'
  }

  isOpen(context: FeatureCheckContext): boolean {
    if(context.thing && instanceOfActor(context.thing)) {
      const actorType = ActorType.wrap(context.thing)
      const percentage = context.values[this.key]
      const id = `${context.featureName}${actorType.value}`
      return crc32(id).valueOf() % 100 < percentage
    } else {
      return false
    }
  }

  protectsThing(thing: any) {
    return typeof(thing) === this.dataType
  }
}

export default PercentageOfActorsGate
