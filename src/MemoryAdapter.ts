import Feature from './Feature'

interface Features {
  [index: string]: Feature;
}

class MemoryAdapter {
  name: string;
  private _features: Features;

  constructor() {
    this.name = 'memory'
    this._features = {}
  }

  features() {
    return Object.keys(this._features).map((key, _) => {
      return this._features[key]
    })
  }

  add(feature: Feature) {
    this._features[feature.name] = feature
    return true
  }

  remove(feature: Feature) {
    delete this._features[feature.name]
    return true
  }

  get(feature: Feature) {
    return this._features[feature.name]
  }

  enable(feature: Feature) {
    let featureFromAdapter = this.get(feature)
    if (featureFromAdapter === undefined) {
      this.add(feature)
      featureFromAdapter = this.get(feature)
    }
    featureFromAdapter.value = true

    return true
  }

  disable(feature: Feature) {
    let featureFromAdapter = this.get(feature)
    if (featureFromAdapter === undefined) {
      this.add(feature)
      featureFromAdapter = this.get(feature)
    }
    featureFromAdapter.value = false

    return true
  }
}

export default MemoryAdapter
