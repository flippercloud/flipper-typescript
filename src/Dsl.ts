import Feature from './Feature'
import Actor from './Actor'
import Adapter from './Adapter'

interface MemoizedFeatures {
  [index: string]: Feature
}

class Dsl {
  adapter: Adapter;
  _memoized_features: MemoizedFeatures

  constructor(adapter) {
    this.adapter = adapter
    this._memoized_features = {}
  }

  isFeatureEnabled(featureName: string, thing?: any): boolean {
    return this.feature(featureName).isEnabled(thing)
  }

  enableFeature(featureName: string) {
    this.feature(featureName).enable()
    return true
  }

  enableFeatureForActor(featureName: string, actor: Actor) {
    this.feature(featureName).enableActor(actor)
    return true
  }

  disableFeature(featureName: string) {
    this.feature(featureName).disable()
    return true
  }

  disableFeatureForActor(featureName: string, actor: Actor) {
    this.feature(featureName).disableActor(actor)
    return true
  }

  feature(featureName: string) {
    let feature = this._memoized_features[featureName]

    if(feature === undefined) {
      feature = new Feature(featureName, this.adapter)
    }

    return feature
  }
}

export default Dsl;
