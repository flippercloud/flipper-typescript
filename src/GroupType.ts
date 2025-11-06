import ActorType from './ActorType'
import FeatureCheckContext from './FeatureCheckContext'
import { GroupCallback, IType } from './interfaces'

class GroupType implements IType {
  public static wrap(thing: unknown): GroupType {
    if (thing instanceof GroupType) { return thing }
    if (typeof thing === 'string') {
      return new GroupType(thing)
    }
    throw new Error('Invalid group type')
  }

  public callback?: GroupCallback
  public value: string

  constructor(value: string, callback?: GroupCallback) {
    this.value = value
    this.callback = callback
  }

  public isMatch(actorType: ActorType, _context: FeatureCheckContext): boolean {
    if (!this.callback) {
      return false
    }
    return Boolean(this.callback(actorType.thing))
  }
}

export default GroupType
