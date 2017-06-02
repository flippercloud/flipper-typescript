import Feature from './Feature'
import { IActor, IAdapter } from './interfaces'

interface IMemoizedFeatures {
  [index: string]: Feature
}

class Dsl {
  public adapter: IAdapter
  private memoizedFeatures: IMemoizedFeatures

  constructor(adapter) {
    this.adapter = adapter
    this.memoizedFeatures = {}
  }

  public isFeatureEnabled(featureName: string, thing?: any): boolean {
    return this.feature(featureName).isEnabled(thing)
  }

  public enable(featureName: string) {
    this.feature(featureName).enable()
    return true
  }

  public enableActor(featureName: string, actor: IActor) {
    this.feature(featureName).enableActor(actor)
    return true
  }

  public enablePercentageOfActors(featureName: string, percentage: number) {
    this.feature(featureName).enablePercentageOfActors(percentage)
  }

  public disable(featureName: string) {
    this.feature(featureName).disable()
    return true
  }

  public disableActor(featureName: string, actor: IActor) {
    this.feature(featureName).disableActor(actor)
    return true
  }

  public feature(featureName: string) {
    let feature = this.memoizedFeatures[featureName]

    if (feature === undefined) {
      feature = new Feature(featureName, this.adapter)
    }

    return feature
  }
}

export default Dsl
