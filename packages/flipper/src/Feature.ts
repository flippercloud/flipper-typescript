import ActorGate from './ActorGate'
import ActorType from './ActorType'
import BooleanGate from './BooleanGate'
import ExpressionGate from './ExpressionGate'
import ExpressionType from './ExpressionType'
import FeatureCheckContext from './FeatureCheckContext'
import GateValues from './GateValues'
import GroupGate from './GroupGate'
import GroupType from './GroupType'
import { IActor, IAdapter, IInstrumenter, InstrumentationPayload, IType } from './interfaces'
import NoopInstrumenter from './instrumenters/NoopInstrumenter'
import PercentageOfActorsGate from './PercentageOfActorsGate'
import PercentageOfActorsType from './PercentageOfActorsType'
import PercentageOfTimeGate from './PercentageOfTimeGate'
import PercentageOfTimeType from './PercentageOfTimeType'
import { type ExpressionLike } from './expressions'

/**
 * Represents a single feature flag with its enabled state and gate values.
 *
 * Features are the core entity in Flipper, encapsulating all logic for checking
 * if a feature is enabled based on various gate types (boolean, expression, actor,
 * group, percentage of actors, percentage of time).
 *
 * @example
 * const adapter = new MemoryAdapter()
 * const groups = {}
 * const feature = new Feature('new-ui', adapter, groups)
 *
 * // Enable for everyone
 * await feature.enable()
 *
 * // Enable for specific actor
 * await feature.enableActor({ flipperId: 'user-123' })
 *
 * // Enable with expression
 * await feature.enableExpression({ Property: 'admin' })
 *
 * // Check if enabled
 * await feature.isEnabled() // true
 * await feature.isEnabled({ flipperId: 'user-123' }) // true
 *
 * // Check state
 * await feature.state() // 'on' | 'off' | 'conditional'
 */
class Feature {
  /**
   * The human-readable name of the feature.
   */
  public name: string

  /**
   * The storage key for the feature (same as name).
   */
  public key: string

  /**
   * All available gate types for this feature.
   */
  public gates: Array<
    | ActorGate
    | BooleanGate
    | ExpressionGate
    | GroupGate
    | PercentageOfActorsGate
    | PercentageOfTimeGate
  >

  /**
   * The adapter used for persisting feature state.
   */
  private adapter: IAdapter

  /**
   * Registry of all registered groups.
   */
  private groups: Record<string, GroupType>

  /**
   * The instrumenter used for tracking operations.
   */
  private instrumenter: IInstrumenter

  /**
   * Name of the instrumentation event emitted by Feature operations.
   */
  private static readonly INSTRUMENTATION_NAME = 'feature_operation.flipper'

  /**
   * Creates a new Feature instance.
   * @param name - The name of the feature
   * @param adapter - The adapter to use for persistence
   * @param groups - Registry of registered groups
   * @param options - Optional configuration
   * @param options.instrumenter - The instrumenter to use for tracking operations
   */
  constructor(
    name: string,
    adapter: IAdapter,
    groups: Record<string, GroupType>,
    options: { instrumenter?: IInstrumenter } = {}
  ) {
    this.name = name
    this.key = name
    this.adapter = adapter
    this.groups = groups
    this.instrumenter = options.instrumenter ?? new NoopInstrumenter()
    this.gates = [
      new BooleanGate(),
      new ExpressionGate(),
      new ActorGate(),
      new GroupGate(this.groups),
      new PercentageOfActorsGate(),
      new PercentageOfTimeGate(),
    ]
  }

  /**
   * Enable the feature for a specific gate type or fully enable it.
   * @param thing - Optional value determining which gate to enable (boolean, actor, group, percentage)
   * @returns True if successful
   */
  async enable(thing?: unknown): Promise<boolean> {
    return this.instrument('enable', async payload => {
      if (thing === undefined || thing === null) {
        thing = true
      }
      await this.adapter.add(this)
      const gate = this.gateFor(thing)
      const thingType = gate.wrap(thing)
      payload.gate_name = gate.key
      payload.thing = thingType
      return await this.adapter.enable(this, gate, thingType)
    })
  }

  /**
   * Enable the feature for a specific actor.
   * @param actor - The actor to enable the feature for
   * @returns True if successful
   */
  public enableActor(actor: IActor) {
    return this.enable(ActorType.wrap(actor))
  }

  /**
   * Enable the feature for a specific group.
   * @param groupName - The name of the group to enable for
   * @returns True if successful
   */
  public enableGroup(groupName: string) {
    return this.enable(GroupType.wrap(groupName))
  }

  /**
   * Enable the feature for a percentage of actors (deterministic based on actor ID).
   * @param percentage - Percentage of actors (0-100)
   * @returns True if successful
   */
  public enablePercentageOfActors(percentage: number) {
    return this.enable(PercentageOfActorsType.wrap(percentage))
  }

  /**
   * Enable the feature for a percentage of time (random).
   * @param percentage - Percentage of time (0-100)
   * @returns True if successful
   */
  public enablePercentageOfTime(percentage: number) {
    return this.enable(PercentageOfTimeType.wrap(percentage))
  }

  /**
   * Enable the feature with an expression.
   *
   * Expressions provide complex conditional logic based on actor properties.
   * Actors must have a `flipperProperties` property for expression evaluation.
   *
   * @param expression - Expression object or ExpressionLike instance
   * @returns True if successful
   * @example
   * // Enable for admins
   * await feature.enableExpression({ Property: 'admin' })
   *
   * // Enable for admins OR enterprise users
   * await feature.enableExpression({
   *   Any: [
   *     { Property: 'admin' },
   *     { Equal: [{ Property: 'plan' }, 'enterprise'] }
   *   ]
   * })
   */
  public enableExpression(expression: Record<string, unknown> | ExpressionLike) {
    const expressionType = ExpressionType.wrap(expression)
    return this.enable(expressionType)
  }

  /**
   * Disable the feature for a specific gate type or fully disable it.
   * @param thing - Optional value determining which gate to disable (boolean, actor, group, percentage)
   * @returns True if successful
   */
  async disable(thing?: unknown): Promise<boolean> {
    return this.instrument('disable', async payload => {
      if (thing === undefined || thing === null) {
        thing = false
      }
      await this.adapter.add(this)
      const gate = this.gateFor(thing)
      const thingType = gate.wrap(thing)
      payload.gate_name = gate.key
      payload.thing = thingType
      return await this.adapter.disable(this, gate, thingType)
    })
  }

  /**
   * Disable the feature for a specific actor.
   * @param actor - The actor to disable the feature for
   * @returns True if successful
   */
  public disableActor(actor: IActor) {
    return this.disable(ActorType.wrap(actor))
  }

  /**
   * Disable the feature for a specific group.
   * @param groupName - The name of the group to disable for
   * @returns True if successful
   */
  public disableGroup(groupName: string) {
    return this.disable(GroupType.wrap(groupName))
  }

  /**
   * Disable percentage of actors gate (sets to 0%).
   * @returns True if successful
   */
  public disablePercentageOfActors() {
    return this.disable(PercentageOfActorsType.wrap(0))
  }

  /**
   * Disable percentage of time gate (sets to 0%).
   * @returns True if successful
   */
  public disablePercentageOfTime() {
    return this.disable(PercentageOfTimeType.wrap(0))
  }

  /**
   * Disable the expression gate.
   * @returns True if successful
   */
  async disableExpression(): Promise<boolean> {
    const gate = this.gate('expression')
    if (!gate) {
      throw new Error('Expression gate not found')
    }
    await this.adapter.add(this)
    return this.adapter.clear(this)
  }

  /**
   * Check if the feature is enabled for a specific actor or context.
   * @param thing - Optional actor or context to check against
   * @returns True if the feature is enabled
   */
  async isEnabled(thing?: unknown): Promise<boolean> {
    return this.instrument('enabled?', async payload => {
      const values = await this.gateValues()
      let isEnabled = false

      if (thing !== undefined) {
        payload.thing = thing as unknown as IType
      }

      this.gates.some(gate => {
        let thingType: unknown = thing
        const actorGate = this.gate('actor')
        if (typeof thingType !== 'undefined' && actorGate) {
          thingType = actorGate.wrap(thing)
        }
        const context = new FeatureCheckContext(this.name, values, thingType)
        const isOpen = gate.isOpen(context)
        if (isOpen) {
          isEnabled = true
          payload.gate_name = gate.key
        }
        return isOpen
      })

      return isEnabled
    })
  }

  /**
   * Get the overall state of the feature.
   * @returns 'on' if fully enabled, 'off' if disabled, 'conditional' if partially enabled
   */
  public async state(): Promise<'on' | 'off' | 'conditional'> {
    const values = await this.gateValues()
    const booleanGate = this.gate('boolean')
    const nonBooleanGates = this.gates.filter(gate => gate !== booleanGate)

    // Fully on if boolean gate is enabled or percentage of time is 100
    if (values.boolean || values.percentageOfTime === 100) {
      return 'on'
    }

    // Conditional if any non-boolean gate is enabled
    const hasEnabledNonBooleanGate = nonBooleanGates.some(gate => {
      const gateKey = gate.key as keyof GateValues
      const value: boolean | Set<string> | number | Record<string, unknown> | null = values[gateKey]
      return gate.isEnabled(value)
    })

    if (hasEnabledNonBooleanGate) {
      return 'conditional'
    }

    return 'off'
  }

  /**
   * Check if the feature state is 'on' (fully enabled).
   * @returns True if feature is fully enabled
   */
  public async isOn(): Promise<boolean> {
    return (await this.state()) === 'on'
  }

  /**
   * Check if the feature state is 'off' (fully disabled).
   * @returns True if feature is fully disabled
   */
  public async isOff(): Promise<boolean> {
    return (await this.state()) === 'off'
  }

  /**
   * Check if the feature state is 'conditional' (partially enabled).
   * @returns True if feature is conditionally enabled
   */
  public async isConditional(): Promise<boolean> {
    return (await this.state()) === 'conditional'
  }

  /**
   * Get the boolean gate value.
   * @returns True if boolean gate is enabled
   */
  public async booleanValue(): Promise<boolean> {
    return (await this.gateValues()).boolean
  }

  /**
   * Get the set of actor IDs that have this feature enabled.
   * @returns Set of actor IDs
   */
  public async actorsValue(): Promise<Set<string>> {
    return (await this.gateValues()).actors
  }

  /**
   * Get the set of group names that have this feature enabled.
   * @returns Set of group names
   */
  public async groupsValue(): Promise<Set<string>> {
    return (await this.gateValues()).groups
  }

  /**
   * Get the percentage of actors value.
   * @returns Percentage (0-100)
   */
  public async percentageOfActorsValue(): Promise<number> {
    return (await this.gateValues()).percentageOfActors
  }

  /**
   * Get the percentage of time value.
   * @returns Percentage (0-100)
   */
  public async percentageOfTimeValue(): Promise<number> {
    return (await this.gateValues()).percentageOfTime
  }

  /**
   * Add this feature to the adapter if it doesn't already exist.
   * @returns True if successful
   */
  async add(): Promise<boolean> {
    return this.instrument('add', async () => this.adapter.add(this))
  }

  /**
   * Check if this feature exists in the adapter.
   * @returns True if the feature exists
   */
  async exist(): Promise<boolean> {
    return this.instrument('exist?', async () => {
      const features = await this.adapter.features()
      return features.some(f => f.key === this.key)
    })
  }

  /**
   * Remove this feature from the adapter (deletes it completely).
   * @returns True if successful
   */
  async remove(): Promise<boolean> {
    return this.instrument('remove', async () => this.adapter.remove(this))
  }

  /**
   * Clear all gate values for this feature.
   * @returns True if successful
   */
  async clear(): Promise<boolean> {
    return this.instrument('clear', async () => this.adapter.clear(this))
  }

  /**
   * Get all gates that are currently enabled for this feature.
   * @returns Array of enabled gate instances
   */
  public async enabledGates(): Promise<
    Array<
      | ActorGate
      | BooleanGate
      | ExpressionGate
      | GroupGate
      | PercentageOfActorsGate
      | PercentageOfTimeGate
    >
  > {
    const values = await this.gateValues()
    return this.gates.filter(gate => {
      const gateKey = gate.key as keyof GateValues
      const value: boolean | Set<string> | number | Record<string, unknown> | null = values[gateKey]
      return gate.isEnabled(value)
    })
  }

  /**
   * Get all gates that are currently disabled for this feature.
   * @returns Array of disabled gate instances
   */
  public async disabledGates(): Promise<
    Array<
      | ActorGate
      | BooleanGate
      | ExpressionGate
      | GroupGate
      | PercentageOfActorsGate
      | PercentageOfTimeGate
    >
  > {
    const enabled = await this.enabledGates()
    return this.gates.filter(gate => !enabled.includes(gate))
  }

  /**
   * Get the names of all enabled gates.
   * @returns Array of enabled gate names
   */
  public async enabledGateNames(): Promise<string[]> {
    return (await this.enabledGates()).map(gate => gate.name)
  }

  /**
   * Get the names of all disabled gates.
   * @returns Array of disabled gate names
   */
  public async disabledGateNames(): Promise<string[]> {
    return (await this.disabledGates()).map(gate => gate.name)
  }

  /**
   * Get all groups that are enabled for this feature.
   * @returns Array of enabled GroupType instances
   */
  public async enabledGroups(): Promise<GroupType[]> {
    const enabledGroupNames = await this.groupsValue()
    return Object.values(this.groups).filter(group => enabledGroupNames.has(group.value))
  }

  /**
   * Get all groups that are disabled for this feature.
   * @returns Array of disabled GroupType instances
   */
  public async disabledGroups(): Promise<GroupType[]> {
    const enabled = await this.enabledGroups()
    return Object.values(this.groups).filter(group => !enabled.includes(group))
  }

  /**
   * Get the current gate values from the adapter.
   * @private
   * @returns GateValues instance
   */
  private async gateValues(): Promise<GateValues> {
    return new GateValues(await this.adapter.get(this))
  }

  /**
   * Find the appropriate gate for a given value.
   * @param thing - The value to find a gate for
   * @returns The gate that protects this value type
   * @throws Error if no gate is found
   */
  public gateFor(
    thing: unknown
  ): ActorGate | BooleanGate | GroupGate | PercentageOfActorsGate | PercentageOfTimeGate {
    let returnGate:
      | ActorGate
      | BooleanGate
      | GroupGate
      | PercentageOfActorsGate
      | PercentageOfTimeGate
      | undefined

    this.gates.some(gate => {
      const protectsThing = gate.protectsThing(thing)
      if (protectsThing) {
        returnGate = gate
      }
      return protectsThing
    })

    if (!returnGate) {
      throw new Error(`No gate found for ${String(thing)}`)
    }

    return returnGate
  }

  /**
   * Get a gate by its name.
   * @param name - The name of the gate (e.g., 'actor', 'boolean', 'group')
   * @returns The gate instance or undefined if not found
   */
  public gate(
    name: string
  ):
    | ActorGate
    | BooleanGate
    | GroupGate
    | PercentageOfActorsGate
    | PercentageOfTimeGate
    | undefined {
    return this.gates.find(gate => {
      return gate.name === name
    })
  }

  /**
   * Get all gates as a hash map keyed by gate name.
   * @returns Object mapping gate names to gate instances
   */
  public gatesHash(): Record<
    string,
    ActorGate | BooleanGate | GroupGate | PercentageOfActorsGate | PercentageOfTimeGate
  > {
    const hash: Record<
      string,
      ActorGate | BooleanGate | GroupGate | PercentageOfActorsGate | PercentageOfTimeGate
    > = {}
    this.gates.forEach(gate => {
      hash[gate.name] = gate
    })
    return hash
  }

  /**
   * Get string representation of the feature.
   * @returns Feature name
   */
  public toString(): string {
    return this.name
  }

  /**
   * Get JSON representation of the feature.
   * @returns Object with feature details
   */
  public async toJSON(): Promise<{
    name: string
    state: string
    enabledGates: string[]
    adapter: string
  }> {
    return {
      name: this.name,
      state: await this.state(),
      enabledGates: await this.enabledGateNames(),
      adapter: String(this.adapter.name),
    }
  }

  /**
   * Custom inspect method for Node.js console output.
   * @returns Formatted string representation
   */
  public async [Symbol.for('nodejs.util.inspect.custom')](): Promise<string> {
    return `Feature(${this.name}) { state: ${await this.state()}, gates: [${(await this.enabledGateNames()).join(', ')}] }`
  }

  /**
   * Instrument a feature operation.
   *
   * @param operation - The name of the operation being performed
   * @param fn - The function to execute and instrument
   * @returns The result of the function
   */
  private instrument<T>(
    operation: string,
    fn: (payload: InstrumentationPayload) => T | Promise<T>
  ): T | Promise<T> {
    return this.instrumenter.instrument(Feature.INSTRUMENTATION_NAME, {}, payload => {
      payload.feature_name = this.name
      payload.operation = operation
      return fn(payload)
    })
  }
}

export default Feature
