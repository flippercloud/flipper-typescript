interface Features {
  [index: string]: boolean;
}

class Flipper {
  features: Features;

  constructor() {
    this.features = {}
  }

  isFeatureEnabled(featureName: string): boolean {
    return this.features[featureName] || false
  }

  enableFeature(featureName: string) {
    this.features[featureName] = true
  }

  disableFeature(featureName: string) {
    this.features[featureName] = false
  }
}

export default Flipper;
