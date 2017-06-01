import Adapter from './Adapter'
import { Actor } from './interfaces'
import ActorType from './ActorType'
import Gate from './Gate'
import BooleanGate from './BooleanGate'
import ActorGate from './ActorGate'
import PercentageOfActorsGate from './PercentageOfActorsGate'
import FeatureCheckContext from './FeatureCheckContext'
import PercentageOfActorsType from './PercentageOfActorsType'

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
    const thingType = gate.wrap(thing)
    return this.adapter.enable(this, gate, thingType)
  }

  enableActor(actor: Actor) {
    return this.enable(ActorType.wrap(actor))
  }

  enablePercentageOfActors(percentage: number) {
    return this.enable(PercentageOfActorsType.wrap(percentage))
  }

  disable(thing?: any) {
    if (thing === undefined || thing === null) thing = true
    this.adapter.add(this)
    const gate = this.gateFor(thing)
    const thingType = gate.wrap(thing)
    return this.adapter.disable(this, gate, thingType)
  }

  disableActor(actor: Actor) {
    return this.disable(ActorType.wrap(actor))
  }

  isEnabled(thing?: any) {
    const values = this.gateValues()
    let isEnabled = false

    this.gates.some((gate) => {
      let thingType = thing
      if(typeof(thingType) !== 'undefined') { thingType = this.gate('actor').wrap(thing) }
      const context = new FeatureCheckContext(this.name, values, thingType)
      const isOpen = gate.isOpen(context)
      if(isOpen) { isEnabled = true }
      return isOpen
    })

    return isEnabled
  }

  gateValues() {
    return this.adapter.get(this)
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

  gate(name: string) {
    return this.gates.find((gate) => {
      return gate.name === name
    })
  }
}

export default Feature
