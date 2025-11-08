import Feature from './Feature'
import GroupType from './GroupType'
import { GroupCallback, IActor, IAdapter } from './interfaces'

class Dsl {
  public adapter: IAdapter
  public groups: Record<string, GroupType>
  private memoizedFeatures: Record<string, Feature>

  constructor(adapter: IAdapter) {
    this.adapter = adapter
    this.groups = {}
    this.memoizedFeatures = {}
  }

  public isFeatureEnabled(featureName: string, thing?: unknown): boolean {
    return this.feature(featureName).isEnabled(thing)
  }

  public enable(featureName: string) {
    this.feature(featureName).enable()
    return true
  }

  public enableActor(featureName: string, actor: IActor) {
    this.feature(featureName).enableActor(actor)
    return true
  }

  public enableGroup(featureName: string, groupName: string) {
    this.feature(featureName).enableGroup(groupName)
    return true
  }

  public enablePercentageOfActors(featureName: string, percentage: number) {
    this.feature(featureName).enablePercentageOfActors(percentage)
  }

  public enablePercentageOfTime(featureName: string, percentage: number) {
    this.feature(featureName).enablePercentageOfTime(percentage)
  }

  public disable(featureName: string) {
    this.feature(featureName).disable()
    return true
  }

  public disableActor(featureName: string, actor: IActor) {
    this.feature(featureName).disableActor(actor)
    return true
  }

  public disableGroup(featureName: string, groupName: string) {
    this.feature(featureName).disableGroup(groupName)
    return true
  }

  public add(featureName: string): boolean {
    return this.feature(featureName).add()
  }

  public exist(featureName: string): boolean {
    return this.feature(featureName).exist()
  }

  public remove(featureName: string): boolean {
    return this.feature(featureName).remove()
  }

  public features(): Feature[] {
    const featureObjects = this.adapter.features()
    // Return memoized versions or create new ones
    return featureObjects.map(f => this.feature(f.name))
  }

  public feature(featureName: string) {
    let feature = this.memoizedFeatures[featureName]

    if (feature === undefined) {
      feature = new Feature(featureName, this.adapter, this.groups)
      this.memoizedFeatures[featureName] = feature
    }

    return feature
  }

  public preload(featureNames: string[]): Feature[] {
    const features = featureNames.map(name => this.feature(name))
    this.adapter.getMulti(features)
    return features
  }

  public preloadAll(): Feature[] {
    const allData = this.adapter.getAll()
    const keys = Object.keys(allData)
    return keys.map(key => this.feature(key))
  }

  public readOnly(): boolean {
    return this.adapter.readOnly()
  }

  public register(groupName: string, callback: GroupCallback): void {
    this.groups[groupName] = new GroupType(groupName, callback)
  }

  // Alias for feature() - provides shorthand access
  public get(featureName: string): Feature {
    return this.feature(featureName)
  }

  public group(groupName: string): GroupType | undefined {
    return this.groups[groupName]
  }
}

export default Dsl
