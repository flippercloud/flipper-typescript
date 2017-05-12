import FeatureCheckContext from './FeatureCheckContext'

interface IsOpenFunction {
  (context: FeatureCheckContext): boolean;
}

interface ProtectsThingFunction {
  (thing: any)
}

interface Gate {
  name: string
  key: string
  dataType: string
  isOpen(IsOpenFunction)
  protectsThing(ProtectsThingFunction)
}

export default Gate
