import {crc32} from 'crc'
import Actor from './Actor'
import Gate from './Gate'
import FeatureCheckContext from './FeatureCheckContext'

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
    if(context.thing instanceof Actor) {
      const percentage = context.values[this.key]
      const id = `${context.featureName}${context.thing.value}`
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
