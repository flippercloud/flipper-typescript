import Typecast from './Typecast'

class GateValues {
  public boolean: boolean
  public actors: Set<string>
  public percentageOfActors: number

  constructor(values: any) {
    this.boolean = Typecast.toBoolean(values.boolean)
    this.actors = Typecast.toSet(values.actors)
    this.percentageOfActors = Typecast.toNumber(values.percentageOfActors)
  }
}

export default GateValues
