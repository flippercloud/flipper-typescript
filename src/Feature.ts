import ActorGate from './ActorGate'
import ActorType from './ActorType'
import BooleanGate from './BooleanGate'
import FeatureCheckContext from './FeatureCheckContext'
import GateValues from './GateValues'
import GroupGate from './GroupGate'
import GroupType from './GroupType'
import { IActor, IAdapter } from './interfaces'
import PercentageOfActorsGate from './PercentageOfActorsGate'
import PercentageOfActorsType from './PercentageOfActorsType'
import PercentageOfTimeGate from './PercentageOfTimeGate'
import PercentageOfTimeType from './PercentageOfTimeType'

class Feature {
  public name: string
  public key: string
  public gates: Array<ActorGate | BooleanGate | GroupGate | PercentageOfActorsGate | PercentageOfTimeGate>
  private adapter: IAdapter
  private groups: Record<string, GroupType>

  constructor(name: string, adapter: IAdapter, groups: Record<string, GroupType>) {
    this.name = name
    this.key = name
    this.adapter = adapter
    this.groups = groups
    this.gates = [
      new ActorGate(),
      new BooleanGate(),
      new GroupGate(groups),
      new PercentageOfActorsGate(),
      new PercentageOfTimeGate(),
    ]
  }

  public enable(thing?: unknown): boolean {
    if (thing === undefined || thing === null) { thing = true }
    this.adapter.add(this)
    const gate = this.gateFor(thing)
    const thingType = gate.wrap(thing)
    return this.adapter.enable(this, gate, thingType)
  }

  public enableActor(actor: IActor) {
    return this.enable(ActorType.wrap(actor))
  }

  public enableGroup(groupName: string) {
    return this.enable(GroupType.wrap(groupName))
  }

  public enablePercentageOfActors(percentage: number) {
    return this.enable(PercentageOfActorsType.wrap(percentage))
  }

  public enablePercentageOfTime(percentage: number) {
    return this.enable(PercentageOfTimeType.wrap(percentage))
  }

  public disable(thing?: unknown): boolean {
    if (thing === undefined || thing === null) { thing = false }
    this.adapter.add(this)
    const gate = this.gateFor(thing)
    const thingType = gate.wrap(thing)
    return this.adapter.disable(this, gate, thingType)
  }

  public disableActor(actor: IActor) {
    return this.disable(ActorType.wrap(actor))
  }

  public disableGroup(groupName: string) {
    return this.disable(GroupType.wrap(groupName))
  }

  public disablePercentageOfActors() {
    return this.disable(PercentageOfActorsType.wrap(0))
  }

  public disablePercentageOfTime() {
    return this.disable(PercentageOfTimeType.wrap(0))
  }

  public isEnabled(thing?: unknown): boolean {
    const values = this.gateValues()
    let isEnabled = false

    this.gates.some((gate) => {
      let thingType: unknown = thing
      const actorGate = this.gate('actor')
      if (typeof(thingType) !== 'undefined' && actorGate) { thingType = actorGate.wrap(thing) }
      const context = new FeatureCheckContext(this.name, values, thingType)
      const isOpen = gate.isOpen(context)
      if (isOpen) { isEnabled = true }
      return isOpen
    })

    return isEnabled
  }

  public state(): 'on' | 'off' | 'conditional' {
    const values = this.gateValues()
    const booleanGate = this.gate('boolean')
    const nonBooleanGates = this.gates.filter(gate => gate !== booleanGate)

    // Fully on if boolean gate is enabled or percentage of time is 100
    if (values.boolean || values.percentageOfTime === 100) {
      return 'on'
    }

    // Conditional if any non-boolean gate is enabled
    const hasEnabledNonBooleanGate = nonBooleanGates.some(gate => {
      const gateKey = gate.key as keyof GateValues
      const value: boolean | Set<string> | number = values[gateKey]
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return gate.isEnabled(value)
    })

    if (hasEnabledNonBooleanGate) {
      return 'conditional'
    }

    return 'off'
  }

  public isOn(): boolean {
    return this.state() === 'on'
  }

  public isOff(): boolean {
    return this.state() === 'off'
  }

  public isConditional(): boolean {
    return this.state() === 'conditional'
  }

  public booleanValue(): boolean {
    return this.gateValues().boolean
  }

  public actorsValue(): Set<string> {
    return this.gateValues().actors
  }

  public groupsValue(): Set<string> {
    return this.gateValues().groups
  }

  public percentageOfActorsValue(): number {
    return this.gateValues().percentageOfActors
  }

  public percentageOfTimeValue(): number {
    return this.gateValues().percentageOfTime
  }

  public add(): boolean {
    return this.adapter.add(this)
  }

  public exist(): boolean {
    const features = this.adapter.features()
    return features.some(f => f.key === this.key)
  }

  public remove(): boolean {
    return this.adapter.remove(this)
  }

  public clear(): boolean {
    return this.adapter.clear(this)
  }

  public enabledGates(): Array<ActorGate | BooleanGate | GroupGate | PercentageOfActorsGate | PercentageOfTimeGate> {
    const values = this.gateValues()
    return this.gates.filter(gate => {
      const gateKey = gate.key as keyof GateValues
      const value: boolean | Set<string> | number = values[gateKey]
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return gate.isEnabled(value)
    })
  }

  public disabledGates(): Array<ActorGate | BooleanGate | GroupGate | PercentageOfActorsGate | PercentageOfTimeGate> {
    const enabled = this.enabledGates()
    return this.gates.filter(gate => !enabled.includes(gate))
  }

  public enabledGateNames(): string[] {
    return this.enabledGates().map(gate => gate.name)
  }

  public disabledGateNames(): string[] {
    return this.disabledGates().map(gate => gate.name)
  }

  public enabledGroups(): GroupType[] {
    const enabledGroupNames = this.groupsValue()
    return Object.values(this.groups).filter(group =>
      enabledGroupNames.has(group.value)
    )
  }

  public disabledGroups(): GroupType[] {
    const enabled = this.enabledGroups()
    return Object.values(this.groups).filter(group =>
      !enabled.includes(group)
    )
  }

  private gateValues() {
    return new GateValues(this.adapter.get(this))
  }

  public gateFor(thing: unknown): ActorGate | BooleanGate | GroupGate | PercentageOfActorsGate | PercentageOfTimeGate {
    let returnGate: ActorGate | BooleanGate | GroupGate | PercentageOfActorsGate | PercentageOfTimeGate | undefined

    this.gates.some((gate) => {
      const protectsThing = gate.protectsThing(thing)
      if (protectsThing) { returnGate = gate }
      return protectsThing
    })

    if (!returnGate) {
      throw new Error(`No gate found for ${String(thing)}`)
    }

    return returnGate
  }

  public gate(name: string): ActorGate | BooleanGate | GroupGate | PercentageOfActorsGate | PercentageOfTimeGate | undefined {
    return this.gates.find((gate) => {
      return gate.name === name
    })
  }

  public gatesHash(): Record<string, ActorGate | BooleanGate | GroupGate | PercentageOfActorsGate | PercentageOfTimeGate> {
    const hash: Record<string, ActorGate | BooleanGate | GroupGate | PercentageOfActorsGate | PercentageOfTimeGate> = {}
    this.gates.forEach((gate) => {
      hash[gate.name] = gate
    })
    return hash
  }

  public toString(): string {
    return this.name
  }
}

export default Feature
