class FeatureCheckContext {
  public featureName: string
  public values: any
  public thing: any

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

  get groupsValue(): Set<string> {
    return this.values.groups
  }

  get percentageOfActorsValue(): number {
    return this.values.percentageOfActors
  }

  get percentageOfTimeValue(): number {
    return this.values.percentageOfTime
  }
}

export default FeatureCheckContext
