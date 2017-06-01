import BooleanType from './BooleanType'
import Gate from './Gate'
import FeatureCheckContext from './FeatureCheckContext'

class BooleanGate implements Gate {
  name: string
  key: string
  dataType: string

  constructor() {
    this.name = 'boolean'
    this.key = 'boolean'
    this.dataType = 'boolean'
  }

  isOpen(context: FeatureCheckContext): boolean {
    return context.booleanValue === 'true'
  }

  protectsThing(thing: any) {
    if(thing instanceof BooleanType) { return true }
    if(thing === true) { return true }
    if(thing === false) { return true }
    return false
  }

  wrap(thing: any) {
    return BooleanType.wrap(thing)
  }
}

export default BooleanGate
