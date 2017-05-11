import Feature from './Feature'

interface Features {
  [index: string]: Feature
}

interface FeatureGates {
  [index: string]: boolean
}

class MemoryAdapter {
  name: string;
  private _features: Features;
  private _feature_gates: FeatureGates

  constructor() {
    this.name = 'memory'
    this._features = {}
    this._feature_gates = {}
  }

  features() {
    return Object.keys(this._features).map((key, _) => {
      return this._features[key]
    })
  }

  add(feature: Feature) {
    if(this._features[feature.name] === undefined) {
      this._features[feature.name] = feature
    }
    return true
  }

  remove(feature: Feature) {
    delete this._features[feature.name]
    this.clear(feature)
    return true
  }

  get(feature: Feature) {
    return this._feature_gates[feature.name]
  }

  enable(feature: Feature) {
    this._feature_gates[feature.name] = true
    return true
  }

  disable(feature: Feature) {
    this._feature_gates[feature.name] = false
    return true
  }

  clear(feature: Feature) {
    delete this._feature_gates[feature.name]
    return true
  }
}

export default MemoryAdapter
