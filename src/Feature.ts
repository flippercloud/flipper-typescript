import Adapter from './Adapter'
import { Actor } from './interfaces'
import Gate from './Gate'
import BooleanGate from './BooleanGate'
import ActorGate from './ActorGate'
import PercentageOfActorsGate from './PercentageOfActorsGate'
import FeatureCheckContext from './FeatureCheckContext'

class Feature {
  name: string;
  key: string;
  adapter: Adapter;
  state: string;
  gates: [Gate];

  constructor(name: string, adapter: Adapter) {
    this.name = name
    this.key = name
    this.adapter = adapter
    this.gates = [
      new BooleanGate(),
      new ActorGate(),
      new PercentageOfActorsGate()
    ]
  }

  enable(thing?: any) {
    if (thing === undefined || thing === null) thing = true
    this.adapter.add(this)
    const gate = this.gateFor(thing)
    return this.adapter.enable(this, gate, thing)
  }

  enableActor(actor: Actor) {
    return this.enable(actor)
  }

  enablePercentageOfActors(percentage: number) {
    return this.enable(percentage)
  }

  disable(thing?: any) {
    if (thing === undefined || thing === null) thing = true
    this.adapter.add(this)
    const gate = this.gateFor(thing)
    return this.adapter.disable(this, gate, thing)
  }

  disableActor(actor: Actor) {
    return this.disable(actor)
  }

  isEnabled(thing?: any) {
    const values = this.adapter.get(this)
    const context = new FeatureCheckContext(this.name, values, thing)
    let isEnabled = false

    this.gates.some((gate) => {
      const isOpen = gate.isOpen(context)
      if(isOpen) { isEnabled = true }
      return isOpen
    })

    return isEnabled
  }

  actorsValue() {
    return []
  }

  gateFor(thing: any) {
    let returnGate

    this.gates.some((gate) => {
      const protectsThing = gate.protectsThing(thing)
      if(protectsThing) { returnGate = gate }
      return protectsThing
    })

    return returnGate
  }
}

export default Feature
