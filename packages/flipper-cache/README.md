# @flippercloud/flipper-cache

Generic cache wrapper for Flipper TypeScript adapters, providing read-through and optional write-through caching.

## Install

```bash
bun add @flippercloud/flipper-cache
```

## Quick usage

```ts
import Cache, { MemoryCache } from '@flippercloud/flipper-cache'
const cached = new Cache(storeAdapter, new MemoryCache(), { ttlSeconds: 300, prefix: 'flipper:' })
```

## Docs

Looking for setup, options, custom backends, and best practices? See the full guide: [Cache adapter guide](../../docs/adapters/cache.md).

## License

MIT
