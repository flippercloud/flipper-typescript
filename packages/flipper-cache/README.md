# @flippercloud/flipper-cache

Generic cache wrapper for Flipper TypeScript adapters. Implements read-through and optional write-through caching, inspired by Ruby's CacheBase and ActiveSupportCacheStore.

## Features
- Wraps any Flipper adapter (Sequelize, Redis, Memory, etc.)
- Pluggable cache backend via `ICache` interface
- TTL and key prefix support
- Read-through caching for `features`, `get`, `getMulti`, `getAll`
- Cache invalidation or write-through on mutations (`add`, `remove`, `clear`, `enable`, `disable`)

## Install

```bash
bun install @flippercloud/flipper-cache
```

## Usage

### Sequelize as store, Redis as cache

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

### Custom cache backend

Implement `ICache` and pass it to `Cache`:

```ts
import type { ICache } from '@flippercloud/flipper-cache'

class RedisCache implements ICache {
  constructor(private client: any) {}
  async get(key: string) { return await this.client.get(key) }
  async getMulti(keys: string[]) { /* ... */ return {} }
  async set(key: string, value: unknown, ttl?: number) { /* ... */ }
  async delete(key: string) { await this.client.del(key) }
}
```

### Options
- `ttlSeconds`: number | undefined — default TTL for cached entries
- `prefix`: string — namespace prefix (e.g., `app1:`)
- `writeThrough`: boolean — when true, update cache after writes instead of invalidating

## Notes
- Cache holds derived state; export/import operate on the wrapped storage adapter.
- Pair with `Memoizable` for request-scoped caching and `DualWrite` for migrations.
