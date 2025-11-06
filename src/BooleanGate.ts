import BooleanType from './BooleanType'
import FeatureCheckContext from './FeatureCheckContext'
import { IGate, IType } from './interfaces'

class BooleanGate implements IGate {
  public name: string
  public key: string
  public dataType: string

  constructor() {
    this.name = 'boolean'
    this.key = 'boolean'
    this.dataType = 'boolean'
  }

  public isOpen(context: FeatureCheckContext): boolean {
    return context.booleanValue === true
  }

  public protectsThing(thing: unknown): boolean {
    if (thing instanceof BooleanType) { return true }
    if (thing === true) { return true }
    if (thing === false) { return true }
    return false
  }

  public wrap(thing: unknown): IType {
    return BooleanType.wrap(thing)
  }
}

export default BooleanGate
