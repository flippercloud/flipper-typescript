import Feature from './Feature'
import Gate from './Gate'

interface Features {
  [index: string]: Feature
}

interface FeatureGates {
  [index: string]: any
}

class MemoryAdapter {
  name: string;
  private _features: Features
  private _source: FeatureGates

  constructor() {
    this.name = 'memory'
    this._features = {}
    this._source = {}
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
    const result = {}

    feature.gates.forEach((gate) => {
      switch(gate.dataType) {
        case 'boolean': {
          result[gate.key] = this.read(this.key(feature, gate))
          break
        }
        case 'set': {
          result[gate.key] = this.setMembers(this.key(feature, gate))
          break
        }
        default: {
          throw `${gate} is not supported by this adapter yet`
        }
      }
    })

    return result
  }

  enable(feature: Feature, gate: Gate, thing: any) {
    switch (gate.dataType) {
      case 'boolean': {
        this.write(this.key(feature, gate), String(true))
        break
      }
      case 'set': {
        this.setAdd(this.key(feature, gate), String(thing.value))
        break
      }
      default: {
        throw `${gate} is not supported by this adapter yet`
      }
    }
    return true
  }

  disable(feature: Feature, gate: Gate, thing: any) {
    switch (gate.dataType) {
      case 'boolean': {
        this.clear(feature)
        break
      }
      case 'set': {
        this.setDelete(this.key(feature, gate), String(thing.value))
        break
      }
      default: {
        throw `${gate} is not supported by this adapter yet`
      }
    }
    return true
  }

  clear(feature: Feature) {
    feature.gates.forEach((gate) => {
      this.delete(this.key(feature, gate))
    })
    return true
  }

  private key(feature: Feature, gate: Gate) {
    return `${feature.key}/${gate.key}`
  }

  private read(key: string) {
    return this._source[key]
  }

  private write(key: string, value: string) {
    return this._source[key] = value
  }

  private delete(key: string) {
    delete this._source[key]
  }

  private setAdd(key: string, value: string) {
    this.ensure_set_initialized(key)
    this._source[key].add(value)
  }

  private setDelete(key: string, value: string) {
    this.ensure_set_initialized(key)
    this._source[key].delete(value)
  }

  private setMembers(key: string) {
    this.ensure_set_initialized(key)
    return this._source[key]
  }

  private ensure_set_initialized(key: string) {
    if(this._source[key] === undefined) {
      this._source[key] = new Set()
    }
  }
}

export default MemoryAdapter
