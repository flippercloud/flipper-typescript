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
    return thing && typeof(thing) === 'boolean'
  }
}

export default BooleanGate
