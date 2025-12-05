# @flippercloud/flipper-cache

Generic cache wrapper for Flipper adapters, providing read-through and optional write-through caching for improved performance.

## Installation

```bash
bun add @flippercloud/flipper-cache
```

## Quick usage

```typescript
import Flipper from '@flippercloud/flipper'
import Cache, { MemoryCache } from '@flippercloud/flipper-cache'

const storeAdapter = new YourAdapter() // e.g., RedisAdapter, SequelizeAdapter
const cacheAdapter = new Cache(storeAdapter, new MemoryCache(), {
  ttlSeconds: 300,
  prefix: 'flipper:',
})
const flipper = new Flipper(cacheAdapter)

await flipper.enable('cached-feature')
const isEnabled = await flipper.isEnabled('cached-feature')
```

## Docs

Looking for cache backends, TTL configuration, and best practices? See the full guide: [Cache adapter guide](../../docs/adapters/cache.md).

## License

MIT
