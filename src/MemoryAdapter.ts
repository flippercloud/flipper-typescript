import Feature from './Feature'
import { IGate } from './interfaces'

interface IFeatures {
  [index: string]: Feature
}

interface IFeatureGates {
  [index: string]: any
}

class MemoryAdapter {
  public name: string
  private featuresStore: IFeatures
  private sourceStore: IFeatureGates

  constructor() {
    this.name = 'memory'
    this.featuresStore = {}
    this.sourceStore = {}
  }

  public features() {
    return Object.keys(this.featuresStore).map((key, _) => {
      return this.featuresStore[key]
    })
  }

  public add(feature: Feature) {
    if (this.featuresStore[feature.name] === undefined) {
      this.featuresStore[feature.name] = feature
    }
    return true
  }

  public remove(feature: Feature) {
    delete this.featuresStore[feature.name]
    this.clear(feature)
    return true
  }

  public get(feature: Feature) {
    const result = {}

    feature.gates.forEach((gate) => {
      switch (gate.dataType) {
        case 'boolean': {
          result[gate.key] = this.read(this.key(feature, gate))
          break
        }
        case 'number': {
          result[gate.key] = this.read(this.key(feature, gate))
          break
        }
        case 'set': {
          result[gate.key] = this.setMembers(this.key(feature, gate))
          break
        }
        default: {
          throw new Error(`${gate} is not supported by this adapter yet`)
        }
      }
    })

    return result
  }

  public enable(feature: Feature, gate: IGate, thing: any) {
    switch (gate.dataType) {
      case 'boolean': {
        this.write(this.key(feature, gate), String(true))
        break
      }
      case 'number': {
        this.write(this.key(feature, gate), String(thing.value))
        break
      }
      case 'set': {
        this.setAdd(this.key(feature, gate), String(thing.value))
        break
      }
      default: {
        throw new Error(`${gate} is not supported by this adapter yet`)
      }
    }
    return true
  }

  public disable(feature: Feature, gate: IGate, thing: any) {
    switch (gate.dataType) {
      case 'boolean': {
        this.clear(feature)
        break
      }
      case 'number': {
        this.clear(feature)
        break
      }
      case 'set': {
        this.setDelete(this.key(feature, gate), String(thing.value))
        break
      }
      default: {
        throw new Error(`${gate} is not supported by this adapter yet`)
      }
    }
    return true
  }

  public  clear(feature: Feature) {
    feature.gates.forEach((gate) => {
      this.delete(this.key(feature, gate))
    })
    return true
  }

  private key(feature: Feature, gate: IGate) {
    return `${feature.key}/${gate.key}`
  }

  private read(key: string) {
    return this.sourceStore[key]
  }

  private write(key: string, value: string) {
    return this.sourceStore[key] = value
  }

  private delete(key: string) {
    delete this.sourceStore[key]
  }

  private setAdd(key: string, value: string) {
    this.ensure_set_initialized(key)
    this.sourceStore[key].add(value)
  }

  private setDelete(key: string, value: string) {
    this.ensure_set_initialized(key)
    this.sourceStore[key].delete(value)
  }

  private setMembers(key: string) {
    this.ensure_set_initialized(key)
    return this.sourceStore[key]
  }

  private ensure_set_initialized(key: string) {
    if (this.sourceStore[key] === undefined) {
      this.sourceStore[key] = new Set()
    }
  }
}

export default MemoryAdapter
