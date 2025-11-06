import Feature from './Feature'
import { IGate, IType } from './interfaces'

interface IFeatures {
  [index: string]: Feature
}

type StorageValue = string | Set<string> | undefined

interface IFeatureGates {
  [index: string]: StorageValue
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

  public features(): Feature[] {
    return Object.keys(this.featuresStore)
      .map((key) => this.featuresStore[key])
      .filter((feature): feature is Feature => feature !== undefined)
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

  public get(feature: Feature): Record<string, unknown> {
    const result: Record<string, unknown> = {}

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
          throw new Error(`${gate.name} is not supported by this adapter yet`)
        }
      }
    })

    return result
  }

  public enable(feature: Feature, gate: IGate, thing: IType): boolean {
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
        throw new Error(`${gate.name} is not supported by this adapter yet`)
      }
    }
    return true
  }

  public disable(feature: Feature, gate: IGate, thing: IType): boolean {
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
        throw new Error(`${gate.name} is not supported by this adapter yet`)
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

  private read(key: string): StorageValue {
    return this.sourceStore[key]
  }

  private write(key: string, value: string) {
    return this.sourceStore[key] = value
  }

  private delete(key: string) {
    delete this.sourceStore[key]
  }

  private setAdd(key: string, value: string): void {
    this.ensure_set_initialized(key)
    const set = this.sourceStore[key]
    if (set instanceof Set) {
      set.add(value)
    }
  }

  private setDelete(key: string, value: string): void {
    this.ensure_set_initialized(key)
    const set = this.sourceStore[key]
    if (set instanceof Set) {
      set.delete(value)
    }
  }

  private setMembers(key: string): Set<string> {
    this.ensure_set_initialized(key)
    const set = this.sourceStore[key]
    return set instanceof Set ? set : new Set()
  }

  private ensure_set_initialized(key: string): void {
    if (!(this.sourceStore[key] instanceof Set)) {
      this.sourceStore[key] = new Set()
    }
  }
}

export default MemoryAdapter
