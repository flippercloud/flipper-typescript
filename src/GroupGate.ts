import FeatureCheckContext from './FeatureCheckContext'
import GroupType from './GroupType'
import { IGate } from './interfaces'

class GroupGate implements IGate {
  public name: string
  public key: string
  public dataType: string
  private groups: any

  constructor(groups: any) {
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

      if (groupType) {
        groupMatch = groupType.isMatch(context.thing, context)
      }

      return groupMatch
    })

    return groupMatch
  }

  public protectsThing(thing: any) {
    if (thing instanceof GroupType) { return true }
    if (typeof(thing) === 'string') { return true }
    return false
  }

  public wrap(thing: any) {
    return GroupType.wrap(thing)
  }
}

export default GroupGate
