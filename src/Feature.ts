import Adapter from './Adapter'

class Feature {
  name: string;
  adapter: Adapter;
  state: string;

  constructor(name: string, adapter: Adapter) {
    this.name = name
    this.adapter = adapter
  }

  enable() {
    this.adapter.add(this)
    this.adapter.enable(this)
    return true
  }

  disable() {
    this.adapter.add(this)
    this.adapter.disable(this)
    return true
  }

  isEnabled() {
    const gateValue = this.adapter.get(this)

    if(gateValue === undefined) {
      return false
    }

    return gateValue
  }
}

export default Feature
