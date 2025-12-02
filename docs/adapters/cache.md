# Cache adapter (read-through/write-through)

The cache adapter wraps any Flipper TypeScript storage adapter to add fast, consistent read caching. It supports read-through and optional write-through behavior, with pluggable backends.

## When to use
- Reduce latency and load for frequent reads of feature and gate state.
- Smooth over bursty traffic with short TTLs.
- Decouple cache backend choice from storage (e.g., Sequelize/MySQL as source of truth, Redis/Memcached for cache).

## Installation

```bash
bun add @flippercloud/flipper-cache
```

## Quick start

```ts
import { Flipper } from '@flippercloud/flipper'
import SequelizeAdapter, { createFlipperModels } from '@flippercloud/flipper-sequelize'
import { Sequelize } from 'sequelize'
import Cache, { MemoryCache } from '@flippercloud/flipper-cache'

const sequelize = new Sequelize(process.env.DATABASE_URL!)
const { Feature, Gate } = createFlipperModels(sequelize)
await sequelize.sync()

const store = new SequelizeAdapter({ Feature, Gate })
const cache = new MemoryCache()
const cached = new Cache(store, cache, { ttlSeconds: 300, prefix: 'flipper:' })

const flipper = new Flipper(cached)
```

## Concepts
- Read-through: misses are loaded from storage and written to cache; subsequent reads hit cache.
- Write-through: after mutations, the cache is updated with new values instead of invalidated. Disable for simpler invalidation or when storage is authoritative and recomputation is cheap.
- TTL: default time-to-live for cached entries; tune per your consistency and freshness needs.
- Prefix: namespacing to avoid key collisions across applications/environments.

## API surface
The package exposes:
- `Cache` — wrapper implementing the Flipper adapter interface
- `MemoryCache` — simple in-memory `ICache` implementation
- `ICache` — minimal cache interface

```ts
export interface ICache {
  get(key: string): Promise<unknown | undefined>
  getMulti(keys: string[]): Promise<Record<string, unknown | undefined>>
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>
  delete(key: string): Promise<void>
}
```

## Configuration

```ts
new Cache(store, backend, {
  ttlSeconds: 300,       // default TTL in seconds
  prefix: 'flipper:',    // optional key namespace
  writeThrough: false,   // update cache on writes (true) or invalidate (false)
})
```

## Custom cache backend
Implement `ICache` for Redis, Memcached, or your platform cache.

```ts
import type { ICache } from '@flippercloud/flipper-cache'

class RedisCache implements ICache {
  constructor(private client: any) {}
  async get(key: string) { return await this.client.get(key) }
  async getMulti(keys: string[]) { /* implement MGET */ return {} }
  async set(key: string, value: unknown, ttlSeconds?: number) {
    // e.g. SETEX key ttl serialized
  }
  async delete(key: string) { await this.client.del(key) }
}
```

## Best practices
- Keep TTL modest (e.g., 60–300s) to balance freshness and cost.
- Prefer invalidation over write-through when derived values are complex or batch updates occur.
- Use a distinct prefix per environment (e.g., `prod:`, `staging:`).
- Pair with request-level memoization for hot paths.

## Notes
- Export/import operate on the underlying storage adapter; cache stores derived state only.
- During migrations, consider `DualWrite` (coming soon) to synchronize storage while using cache for reads.
