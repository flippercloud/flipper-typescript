import type FeatureCheckContext from './FeatureCheckContext'
import type Feature from './Feature'

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

/**
 * Payload passed to and from instrumentation callbacks.
 *
 * The instrumenter can modify the payload during instrumentation,
 * and the result of the instrumented operation will be added to it.
 */
export interface InstrumentationPayload {
  /**
   * Name of the feature being operated on.
   */
  feature_name?: string

  /**
   * The operation being performed.
   */
  operation?: string

  /**
   * The name of the gate being operated on.
   */
  gate_name?: string

  /**
   * The thing being enabled/disabled.
   */
  thing?: IType

  /**
   * The result of the operation.
   */
  result?: unknown

  /**
   * Name of the adapter being operated on.
   */
  adapter_name?: string

  /**
   * Feature names for multi-feature operations.
   */
  feature_names?: string[]

  /**
   * Additional custom properties.
   */
  [key: string]: unknown
}

/**
 * Instrumenter interface for tracking and monitoring operations.
 *
 * Instrumenters allow you to observe all Flipper operations for
 * debugging, monitoring, or analytics purposes.
 *
 * @example
 * ```typescript
 * class CustomInstrumenter implements IInstrumenter {
 *   instrument<T>(name: string, payload: InstrumentationPayload, fn: (payload: InstrumentationPayload) => T): T {
 *     console.log('Starting:', name, payload);
 *     const result = fn(payload);
 *     console.log('Finished:', name, 'result:', result);
 *     return result;
 *   }
 * }
 * ```
 */
export interface IInstrumenter {
  /**
   * Instrument an operation.
   *
   * @param name - The name of the instrumentation event (e.g., 'feature_operation.flipper')
   * @param payload - The payload containing operation details
   * @param fn - The function to execute and instrument
   * @returns The result of the function
   */
  instrument<T>(name: string, payload: InstrumentationPayload, fn: (payload: InstrumentationPayload) => T): T
}
