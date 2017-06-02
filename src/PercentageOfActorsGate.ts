import { crc32 } from 'crc'
import ActorType from './ActorType'
import FeatureCheckContext from './FeatureCheckContext'
import { IActor, IGate } from './interfaces'
import PercentageOfActorsType from './PercentageOfActorsType'

function instanceOfActor(thing: any): thing is IActor {
  return 'flipperId' in thing
}

class PercentageOfActorsGate implements IGate {
  public name: string
  public key: string
  public dataType: string

  constructor() {
    this.name = 'percentageOfActors'
    this.key = 'percentageOfActors'
    this.dataType = 'number'
  }

  public isOpen(context: FeatureCheckContext): boolean {
    let usable = false
    if (typeof(context.thing) === 'undefined') { return false }
    if (!usable && context.thing instanceof ActorType) { usable = true }
    if (!usable && instanceOfActor(context.thing)) { usable = true }
    if (!usable) { return false }

    const actorType = ActorType.wrap(context.thing)
    const percentage = context.percentageOfActorsValue
    const id = `${context.featureName}${actorType.value}`
    return crc32(id).valueOf() % 100 < percentage
  }

  public protectsThing(thing: any) {
    if (thing instanceof PercentageOfActorsType) { return true }
    return false
  }

  public wrap(thing: any) {
    return PercentageOfActorsType.wrap(thing)
  }
}

export default PercentageOfActorsGate
