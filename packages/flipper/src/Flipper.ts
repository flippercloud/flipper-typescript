import Dsl from './Dsl'
import { buildExpression, Constant, type ExpressionLike } from './expressions'

/**
 * Main entry point for Flipper feature flag management.
 *
 * Flipper is the primary class for managing feature flags. It extends Dsl
 * to provide a simple, intuitive API for enabling/disabling features and
 * checking their state.
 *
 * @example
 * const adapter = new MemoryAdapter()
 * const flipper = new Flipper(adapter)
 *
 * // Enable a feature for everyone
 * await flipper.enable('new-ui')
 *
 * // Check if feature is enabled
 * if (await flipper.isFeatureEnabled('new-ui')) {
 *   // Show new UI
 * }
 *
 * // Enable for specific actor
 * await flipper.enableActor('beta-features', { flipperId: 'user-123' })
 *
 * // Enable for percentage of users
 * await flipper.enablePercentageOfActors('gradual-rollout', 25)
 */
class Flipper extends Dsl {
  /**
   * Get the names of all registered groups.
   * @returns Array of group names
   *
   * @example
   * flipper.register('admins', (actor) => actor.isAdmin)
   * flipper.register('beta-users', (actor) => actor.betaTester)
   * flipper.groupNames() // ['admins', 'beta-users']
   */
  public groupNames(): string[] {
    return Object.keys(this.groups)
  }

  /**
   * Check if a group exists by name.
   * @param groupName - The name of the group to check
   * @returns True if the group is registered
   *
   * @example
   * flipper.register('admins', (actor) => actor.isAdmin)
   * flipper.groupExists('admins') // true
   * flipper.groupExists('unknown') // false
   */
  public groupExists(groupName: string): boolean {
    return groupName in this.groups
  }

  /**
   * Clear all registered groups.
   * @returns void
   *
   * @example
   * flipper.register('admins', (actor) => actor.isAdmin)
   * flipper.groupNames() // ['admins']
   * flipper.unregisterGroups()
   * flipper.groupNames() // []
   */
  public unregisterGroups(): void {
    this.groups = {}
  }

  /**
   * Build an expression from an object representation.
   *
   * @param object - Expression object or primitive value
   * @returns ExpressionLike instance
   * @example
   * const expr = Flipper.build({ Property: 'admin' })
   */
  public static build(object: unknown): ExpressionLike {
    return buildExpression(object)
  }

  /**
   * Create a constant expression.
   *
   * @param value - The constant value
   * @returns Constant expression
   * @example
   * const expr = Flipper.constant('hello')
   * expr.evaluate({ properties: {} }) // => 'hello'
   */
  public static constant(value: unknown): Constant {
    return new Constant(value)
  }

  /**
   * Create a property lookup expression.
   *
   * @param name - Property name to lookup
   * @returns Property expression
   * @example
   * const expr = Flipper.property('admin')
   * expr.evaluate({ properties: { admin: true } }) // => true
   */
  public static property(name: string): ExpressionLike {
    return buildExpression({ Property: name })
  }

  /**
   * Create an Any expression (logical OR).
   *
   * @param args - Expressions to OR together
   * @returns Any expression
   * @example
   * const expr = Flipper.any(
   *   Flipper.property('admin'),
   *   Flipper.property('beta_user')
   * )
   */
  public static any(...args: unknown[]): ExpressionLike {
    return buildExpression({ Any: args })
  }

  /**
   * Create an All expression (logical AND).
   *
   * @param args - Expressions to AND together
   * @returns All expression
   * @example
   * const expr = Flipper.all(
   *   Flipper.property('admin'),
   *   Flipper.property('active')
   * )
   */
  public static all(...args: unknown[]): ExpressionLike {
    return buildExpression({ All: args })
  }

  /**
   * Create a string conversion expression.
   *
   * @param value - Value to convert to string
   * @returns String expression
   * @example
   * const expr = Flipper.string(42)
   * expr.evaluate({ properties: {} }) // => '42'
   */
  public static string(value: unknown): ExpressionLike {
    return buildExpression({ String: value })
  }

  /**
   * Create a number conversion expression.
   *
   * @param value - Value to convert to number
   * @returns Number expression
   * @example
   * const expr = Flipper.number('42')
   * expr.evaluate({ properties: {} }) // => 42
   */
  public static number(value: unknown): ExpressionLike {
    return buildExpression({ Number: value })
  }

  /**
   * Create a boolean conversion expression.
   *
   * @param value - Value to convert to boolean
   * @returns Boolean expression
   * @example
   * const expr = Flipper.boolean('truthy')
   * expr.evaluate({ properties: {} }) // => true
   */
  public static boolean(value: unknown): ExpressionLike {
    return buildExpression({ Boolean: value })
  }

  /**
   * Create a random number expression.
   *
   * @param max - Maximum value (exclusive)
   * @returns Random expression
   * @example
   * const expr = Flipper.random(100)
   * expr.evaluate({ properties: {} }) // => 0-99
   */
  public static random(max: number): ExpressionLike {
    return buildExpression({ Random: max })
  }

  /**
   * Create a current time expression.
   *
   * @returns Now expression
   * @example
   * const expr = Flipper.now()
   * expr.evaluate({ properties: {} }) // => current Unix timestamp
   */
  public static now(): ExpressionLike {
    return buildExpression({ Now: [] })
  }

  /**
   * Create a time parsing expression.
   *
   * @param timeString - ISO 8601 time string
   * @returns Time expression
   * @example
   * const expr = Flipper.time('2024-01-01T00:00:00Z')
   * expr.evaluate({ properties: {} }) // => Unix timestamp
   */
  public static time(timeString: string): ExpressionLike {
    return buildExpression({ Time: timeString })
  }

  /**
   * Create a duration expression.
   *
   * @param scalar - Duration value
   * @param unit - Unit of time (second, minute, hour, day, week, month, year)
   * @returns Duration expression
   * @example
   * const expr = Flipper.duration(5, 'minutes')
   * expr.evaluate({ properties: {} }) // => 300
   */
  public static duration(scalar: number, unit: string = 'second'): ExpressionLike {
    return buildExpression({ Duration: [scalar, unit] })
  }
}

export default Flipper
