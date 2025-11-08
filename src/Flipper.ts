import Dsl from './Dsl'

/**
 * Main entry point for Flipper feature flag management.
 *
 * Flipper is the primary class for managing feature flags. It extends Dsl
 * to provide a simple, intuitive API for enabling/disabling features and
 * checking their state.
 *
 * @example
 * ```typescript
 * const adapter = new MemoryAdapter();
 * const flipper = new Flipper(adapter);
 *
 * // Enable a feature for everyone
 * flipper.enable('new-ui');
 *
 * // Check if feature is enabled
 * if (flipper.isFeatureEnabled('new-ui')) {
 *   // Show new UI
 * }
 *
 * // Enable for specific actor
 * flipper.enableActor('beta-features', { flipperId: 'user-123' });
 *
 * // Enable for percentage of users
 * flipper.enablePercentageOfActors('gradual-rollout', 25);
 * ```
 */
class Flipper extends Dsl {
}

export default Flipper
