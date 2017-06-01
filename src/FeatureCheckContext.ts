class FeatureCheckContext {
  featureName: string
  values: any
  thing: any

  constructor(featureName: string, values: any, thing: any) {
    this.featureName = featureName
    this.values = values
    this.thing = thing
  }

  get booleanValue(): boolean {
    return this.values.boolean
  }

  get actorsValue(): Set<string> {
    return this.values.actors
  }

  get percentageOfActorsValue(): number {
    return this.values.percentageOfActors
  }
}

export default FeatureCheckContext
