import ActorGate from './ActorGate'
import ActorType from './ActorType'
import BooleanGate from './BooleanGate'
import FeatureCheckContext from './FeatureCheckContext'
import GateValues from './GateValues'
import { IActor, IAdapter, IGate } from './interfaces'
import PercentageOfActorsGate from './PercentageOfActorsGate'
import PercentageOfActorsType from './PercentageOfActorsType'

class Feature {
  public name: string
  public key: string
  public gates: [IGate]
  private adapter: IAdapter

  constructor(name: string, adapter: IAdapter) {
    this.name = name
    this.key = name
    this.adapter = adapter
    this.gates = [
      new BooleanGate(),
      new ActorGate(),
      new PercentageOfActorsGate(),
    ]
  }

  public enable(thing?: any) {
    if (thing === undefined || thing === null) { thing = true }
    this.adapter.add(this)
    const gate = this.gateFor(thing)
    const thingType = gate.wrap(thing)
    return this.adapter.enable(this, gate, thingType)
  }

  public enableActor(actor: IActor) {
    return this.enable(ActorType.wrap(actor))
  }

  public enablePercentageOfActors(percentage: number) {
    return this.enable(PercentageOfActorsType.wrap(percentage))
  }

  public disable(thing?: any) {
    if (thing === undefined || thing === null) { thing = true }
    this.adapter.add(this)
    const gate = this.gateFor(thing)
    const thingType = gate.wrap(thing)
    return this.adapter.disable(this, gate, thingType)
  }

  public disableActor(actor: IActor) {
    return this.disable(ActorType.wrap(actor))
  }

  public isEnabled(thing?: any) {
    const values = this.gateValues()
    let isEnabled = false

    this.gates.some((gate) => {
      let thingType = thing
      if (typeof(thingType) !== 'undefined') { thingType = this.gate('actor').wrap(thing) }
      const context = new FeatureCheckContext(this.name, values, thingType)
      const isOpen = gate.isOpen(context)
      if (isOpen) { isEnabled = true }
      return isOpen
    })

    return isEnabled
  }

  private gateValues() {
    return new GateValues(this.adapter.get(this))
  }

  private gateFor(thing: any) {
    let returnGate

    this.gates.some((gate) => {
      const protectsThing = gate.protectsThing(thing)
      if (protectsThing) { returnGate = gate }
      return protectsThing
    })

    return returnGate
  }

  private gate(name: string) {
    return this.gates.find((gate) => {
      return gate.name === name
    })
  }
}

export default Feature
