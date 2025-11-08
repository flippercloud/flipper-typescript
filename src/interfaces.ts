import FeatureCheckContext from './FeatureCheckContext'
import Feature from './Feature'

export interface IActor {
  flipperId: string
  isAdmin: boolean
}

export interface IAdapter {
  name: string
  features: () => Feature[]
  add: (feature: Feature) => boolean
  remove: (feature: Feature) => boolean
  clear: (feature: Feature) => boolean
  get: (feature: Feature) => Record<string, unknown>
  getMulti: (features: Feature[]) => Record<string, Record<string, unknown>>
  getAll: () => Record<string, Record<string, unknown>>
  enable: (feature: Feature, gate: IGate, thing: IType) => boolean
  disable: (feature: Feature, gate: IGate, thing: IType) => boolean
  readOnly: () => boolean
}

export interface IGate {
  name: string
  key: string
  dataType: string
  isOpen: (context: FeatureCheckContext) => boolean
  isEnabled: (value: unknown) => boolean
  protectsThing: (thing: unknown) => boolean
  wrap: (thing: unknown) => IType
}

export interface IType {
  value: boolean | number | string
}

export type GroupCallback = (actor: IActor) => boolean
