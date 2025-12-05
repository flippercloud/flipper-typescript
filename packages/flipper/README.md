# @flippercloud/flipper

A TypeScript/JavaScript implementation of [Flipper](https://github.com/flippercloud/flipper) - a feature flagging library for controlling features and behavior.

## Installation

```bash
bun add @flippercloud/flipper
```

## Quick usage

```typescript
import Flipper from '@flippercloud/flipper'
import { MemoryAdapter } from '@flippercloud/flipper'

const adapter = new MemoryAdapter()
const flipper = new Flipper(adapter)

// Enable a feature
await flipper.enable('new-ui')

// Check if a feature is enabled
const isEnabled = await flipper.isEnabled('new-ui')
console.log(isEnabled) // true

// Enable for specific actors
await flipper.enableActor('premium-feature', 'user-123')

// Check if enabled for a specific actor
const isPremiumEnabled = await flipper.isEnabledFor('premium-feature', 'user-123')
console.log(isPremiumEnabled) // true
```

## Docs

Looking for configuration, adapters, advanced usage, and best practices? See the full guide: [Flipper documentation](../../docs/README.md).

## License

MIT
