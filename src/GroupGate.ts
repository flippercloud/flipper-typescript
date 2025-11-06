import ActorType from './ActorType'
import FeatureCheckContext from './FeatureCheckContext'
import GroupType from './GroupType'
import { IGate } from './interfaces'

class GroupGate implements IGate {
  public name: string
  public key: string
  public dataType: string
  private groups: Record<string, GroupType>

  constructor(groups: Record<string, GroupType>) {
    this.name = 'group'
    this.key = 'groups'
    this.dataType = 'set'
    this.groups = groups
  }

  public isOpen(context: FeatureCheckContext): boolean {
    if (context.thing === 'undefined') { return false }

    const groupNames = Array.from(context.groupsValue)
    let groupMatch = false

    groupNames.some((groupName) => {
      const groupType = this.groups[groupName]

      if (groupType && context.thing instanceof ActorType) {
        groupMatch = groupType.isMatch(context.thing, context)
      }

      return groupMatch
    })

    return groupMatch
  }

  public protectsThing(thing: unknown): boolean {
    if (thing instanceof GroupType) { return true }
    if (typeof(thing) === 'string') { return true }
    return false
  }

  public wrap(thing: unknown) {
    return GroupType.wrap(thing)
  }
}

export default GroupGate
