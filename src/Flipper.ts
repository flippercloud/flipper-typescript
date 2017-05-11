import Feature from './Feature'
import MemoryAdapter from './MemoryAdapter'

interface MemoizedFeatures {
  [index: string]: Feature
}

class Flipper {
  adapter: MemoryAdapter;
  _memoized_features: MemoizedFeatures

  constructor(adapter) {
    this.adapter = adapter
    this._memoized_features = {}
  }

  isFeatureEnabled(featureName: string): boolean {
    return this.feature(featureName).isEnabled()
  }

  enableFeature(featureName: string) {
    this.feature(featureName).enable()
    return true
  }

  disableFeature(featureName: string) {
    this.feature(featureName).disable()
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

export default Flipper;
