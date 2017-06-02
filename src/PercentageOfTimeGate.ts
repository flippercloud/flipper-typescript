import FeatureCheckContext from './FeatureCheckContext'
import { IActor, IGate } from './interfaces'
import PercentageOfTimeType from './PercentageOfTimeType'

class PercentageOfTimeGate implements IGate {
  public name: string
  public key: string
  public dataType: string

  constructor() {
    this.name = 'percentageOfTime'
    this.key = 'percentageOfTime'
    this.dataType = 'number'
  }

  public isOpen(context: FeatureCheckContext): boolean {
    return Math.random() < (context.percentageOfTimeValue / 100)
  }

  public protectsThing(thing: any) {
    if (thing instanceof PercentageOfTimeType) { return true }
    return false
  }

  public wrap(thing: any) {
    return PercentageOfTimeType.wrap(thing)
  }
}

export default PercentageOfTimeGate
