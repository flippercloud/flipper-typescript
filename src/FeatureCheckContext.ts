class FeatureCheckContext {
  featureName: string
  values: any
  thing: any

  constructor(featureName: string, values: any, thing: any) {
    this.featureName = featureName
    this.values = values
    this.thing = thing
  }

  get booleanValue(): string {
    return this.values.boolean
  }

  get actorsValue(): any {
    return this.values.actors
  }

  get percentageOfActorsValue(): number {
    return this.values.percentageOfActorsValue
  }
}

export default FeatureCheckContext
