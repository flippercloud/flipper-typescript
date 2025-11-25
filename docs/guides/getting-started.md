# Getting Started with Flipper TypeScript

This guide walks you through installing Flipper, wiring it into an application, and verifying that feature flags are working as expected.

## 1. Install the SDK

```bash
bun add @flippercloud/flipper
```

## 2. Choose an Adapter

For most scenarios you can begin with the in-memory adapter:

```typescript
import { Flipper, MemoryAdapter } from '@flippercloud/flipper'

const adapter = new MemoryAdapter()
const flipper = new Flipper(adapter)
```

Later you can swap in Redis, Sequelize, or any custom adapter that implements the storage contract.

## 3. Check a Feature Flag

```typescript
const featureKey = 'search'
const isEnabled = await flipper.isFeatureEnabled(featureKey, currentUser)

if (isEnabled) {
  // roll out the feature
}
```

Flags are disabled by default. Use the Flipper API to target who sees what.

## 4. Enable Features

```typescript
await flipper.enable('search')
await flipper.enableActor('search', currentUser)
await flipper.enableGroup('search', 'admin')
await flipper.enablePercentageOfActors('search', 25)
```

## 5. Plan for Persistence (Optional)

- Memory adapter: best for tests and simple apps.
- Redis adapter: distribute feature state across servers.
- SQL adapters: manage state alongside relational data.

Browse the [adapter guides](../adapters/README.md) once you're ready to move beyond in-memory storage.

## 6. Explore More

- [Workspace command reference](../reference/workspace-commands.md)
- [Create a new package](../how-to/create-package.md)
- [Documentation upkeep checklist](../contributing/documentation.md)
