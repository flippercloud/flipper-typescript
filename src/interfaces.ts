import FeatureCheckContext from './FeatureCheckContext'

export interface IActor {
  flipperId: string
}

export interface IAdapter {
  features: any
  add: any
  remove: any
  get: any
  enable: any
  disable: any
}

export interface IGate {
  name: string
  key: string
  dataType: string
  isOpen: (context: FeatureCheckContext) => boolean
  protectsThing: (thing: any) => boolean
  wrap: (thing: any) => IType
}

export interface IType {
  value: boolean | number | string
}
