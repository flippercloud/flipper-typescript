import ActorType from './ActorType'
import FeatureCheckContext from './FeatureCheckContext'
import { IType } from './interfaces'

class GroupType implements IType {
  public static wrap(thing: string | GroupType): GroupType {
    if (thing instanceof GroupType) { return thing }
    return new GroupType(thing)
  }

  public callback: any
  public value: string

  constructor(value: string, callback?: any) {
    this.value = value
    this.callback = callback
  }

  public isMatch(actorType: ActorType, context: FeatureCheckContext) {
    return this.callback(actorType.thing)
  }
}

export default GroupType
