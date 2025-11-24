import type Feature from '../Feature'
import Wrapper from './Wrapper'

/**
 * Error thrown when a feature is not found in strict mode.
 */
export class FeatureNotFoundError extends Error {
  /**
   * Creates a new FeatureNotFoundError.
   * @param name - The name of the feature that was not found
   */
  constructor(name: string) {
    super(`Could not find feature "${name}". Call \`flipper.add("${name}")\` to create it.`)
    this.name = 'FeatureNotFoundError'
  }
}

/**
 * Handler for feature not found errors.
 *
 * Possible values:
 * - `true` or `'raise'`: Throw FeatureNotFoundError
 * - `'warn'`: Log warning to console
 * - `'noop'` or `false`: Do nothing
 * - Function: Call the function with the feature
 */
export type StrictHandler = boolean | 'raise' | 'warn' | 'noop' | ((feature: Feature) => void)

/**
 * Adapter wrapper that ensures features exist before operations.
 *
 * Helps catch bugs where feature names are misspelled or features are accessed
 * before being added to the adapter.
 *
 * @example
 * const adapter = new MemoryAdapter()
 * const strictAdapter = new Strict(adapter) // throws by default
 *
 * // This will throw FeatureNotFoundError
 * await strictAdapter.get(feature)
 *
 * // Add the feature first
 * await strictAdapter.add(feature)
 * await strictAdapter.get(feature) // now works
 *
 * // Use 'warn' mode to log instead of throwing
 * const warnAdapter = new Strict(adapter, 'warn')
 *
 * // Use custom handler
 * const customAdapter = new Strict(adapter, (feature) => {
 *   console.log(`Feature ${feature.name} not found`)
 * })
 */
export default class Strict extends Wrapper {
  /**
   * Handler to use when a feature is not found.
   */
  private handler: StrictHandler

  /**
   * Creates a new Strict adapter.
   * @param adapter - The adapter to wrap with strict checking
   * @param handler - How to handle missing features (default: throw error)
   */
  constructor(adapter: IAdapter, handler: StrictHandler = true) {
    super(adapter)
    this.handler = handler
  }

  /**
   * Get a feature's state, ensuring it exists first.
   * @param feature - Feature to get state for
   * @returns Feature gate values
   * @throws {FeatureNotFoundError} If feature doesn't exist and handler is 'raise' or true
   */
  override async get(feature: Feature): Promise<Record<string, unknown>> {
    await this.assertFeatureExists(feature)
    return await super.get(feature)
  }

  /**
   * Get multiple features' state, ensuring they all exist first.
   * @param features - Features to get state for
   * @returns Map of feature keys to gate values
   * @throws {FeatureNotFoundError} If any feature doesn't exist and handler is 'raise' or true
   */
  override async getMulti(features: Feature[]): Promise<Record<string, Record<string, unknown>>> {
    for (const feature of features) {
      await this.assertFeatureExists(feature)
    }
    return await super.getMulti(features)
  }

  /**
   * Assert that a feature exists in the adapter.
   * Behavior depends on the configured handler.
   * @param feature - Feature to check
   * @throws {FeatureNotFoundError} If feature doesn't exist and handler is 'raise' or true
   */
  private async assertFeatureExists(feature: Feature): Promise<void> {
    const features = await this.adapter.features()
    const exists = features.some(f => f.key === feature.key)

    if (exists) {
      return
    }

    switch (this.handler) {
      case 'warn':
        console.warn(new FeatureNotFoundError(feature.name).message)
        break
      case 'noop':
      case false:
        // Do nothing
        break
      case true:
      case 'raise':
        throw new FeatureNotFoundError(feature.name)
      default:
        if (typeof this.handler === 'function') {
          this.handler(feature)
        }
        break
    }
  }
}

// Fix import
import type { IAdapter } from '../interfaces'
