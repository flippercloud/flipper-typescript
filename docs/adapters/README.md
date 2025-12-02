# Adapter Guides

Flipper TypeScript ships with an in-memory adapter out of the box and provides optional packages for external stores. Each sub-page in this directory covers installation, configuration, and best practices for a specific adapter.

## Available Guides

- [Cache](./cache.md)
- [Redis](./redis.md)
- [Sequelize](./sequelize.md)

## Coming Soon

- MongoDB
- Custom adapter recipes

## Quick Start

All adapters share the same basic pattern:

1. Install the adapter package (or add it to your workspace).
2. Create an instance of the adapter with any required storage configuration.
3. Pass the adapter into the `Flipper` constructor.
4. Ensure the adapter's tests run in CI and that documentation stays in sync with future changes.

If you add a new adapter package, create a companion doc in this folder and link it here.
