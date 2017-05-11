import Feature from './Feature'
import MemoryAdapter from './MemoryAdapter'

class Flipper {
  adapter: MemoryAdapter;

  constructor(adapter) {
    this.adapter = adapter
  }

  isFeatureEnabled(feature: Feature): boolean {
    const featureFromAdapter = this.adapter.get(feature)

    if (featureFromAdapter === undefined) {
      return false
    } else {
      return featureFromAdapter.value
    }
  }

  enableFeature(feature: Feature) {
    this.adapter.enable(feature)
    return true
  }

  disableFeature(feature: Feature) {
    this.adapter.disable(feature)
    return true
  }
}

export default Flipper;
