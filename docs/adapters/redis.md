# Redis Adapter

The Redis adapter stores feature gate state in Redis using hashes for feature gate values and a set to track all feature keys. Use it when you need distributed feature flag storage across multiple application servers.

## Installation

```bash
bun add @flippercloud/flipper-redis ioredis
```

> **Prerequisites:** Node.js ≥ 18, Bun ≥ 1.3.2, and a Redis instance. This adapter uses [ioredis](https://github.com/redis/ioredis) as its Redis client, which must be installed as a peer dependency.

## Quick Start

```typescript
import Redis from 'ioredis'
import Flipper from '@flippercloud/flipper'
import { RedisAdapter } from '@flippercloud/flipper-redis'

const redis = new Redis({
  host: 'localhost',
  port: 6379,
})

const adapter = new RedisAdapter({ client: redis })
const flipper = new Flipper(adapter)

await flipper.enable('new-feature')
const isEnabled = await flipper.isEnabled('new-feature')
console.log(isEnabled) // true
```

## Configuration Options

### Key Prefix

Use a key prefix to namespace your Flipper keys in Redis:

```typescript
const adapter = new RedisAdapter({
  client: redis,
  keyPrefix: 'myapp:flipper:',
})

// All Redis keys will be prefixed:
// - myapp:flipper:flipper_features (set of all features)
// - myapp:flipper:feature_name (hash of gate values)
```

This is useful when sharing a Redis instance across multiple applications or environments.

### Read-only Mode

Create a read-only adapter for replicas or background workers:

```typescript
const adapter = new RedisAdapter({
  client: redis,
  readOnly: true,
})

// Read operations work
const isEnabled = await flipper.isEnabled('feature')

// Write operations throw ReadOnlyError
await flipper.enable('feature') // throws!
```

Read-only mode prevents accidental mutations while still allowing feature flag checks.

## Advanced Usage

### Redis Cluster

For high availability setups, use Redis Cluster:

```typescript
import { Cluster } from 'ioredis'

const cluster = new Cluster([
  { host: 'localhost', port: 6380 },
  { host: 'localhost', port: 6381 },
])

const adapter = new RedisAdapter({ client: cluster })
const flipper = new Flipper(adapter)
```

### Connection Pooling

Configure connection pooling and retry behavior:

```typescript
import Redis from 'ioredis'

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
})

await redis.connect()

const adapter = new RedisAdapter({ client: redis })
const flipper = new Flipper(adapter)
```

## Redis Data Structure

The adapter uses the following Redis data structure to ensure compatibility with the Ruby Flipper Redis adapter:

### Features Set
```
SADD flipper_features "feature_name"
```

The `flipper_features` set contains all feature keys.

### Feature Hash
```
HSET feature_name "boolean" "true"
HSET feature_name "percentage_of_time" "50"
HSET feature_name "actors/User:123" "1"
HSET feature_name "groups/admins" "1"
```

Each feature is stored as a Redis hash where:
- Simple gates (boolean, integer) store the value directly
- Set gates (actors, groups) store each member as `gate_key/value` → `1`
- JSON gates store serialized JSON

## API Reference

### Constructor: `RedisAdapter(options)`

Creates a new Redis adapter.

#### Options

- `client` (required): ioredis `Redis` or `Cluster` instance
- `keyPrefix` (optional): String prefix for all Redis keys (default: `''`)
- `readOnly` (optional): Boolean, when `true` prevents all write operations (default: `false`)

### Methods

The adapter implements the full `IAdapter` interface:

- `features()`: Get all feature instances
- `add(feature)`: Add a feature to the features set
- `remove(feature)`: Remove a feature and all its data
- `clear(feature)`: Clear all gate values for a feature
- `get(feature)`: Get all gate values for a feature
- `getMulti(features)`: Get gate values for multiple features (uses pipelining)
- `getAll()`: Get all features and their gate values
- `enable(feature, gate, thing)`: Enable a gate
- `disable(feature, gate, thing)`: Disable a gate
- `readOnly()`: Check if adapter is read-only
- `export(options)`: Export features to a format
- `import(source)`: Import features from another source

## Performance

### Pipelining

The adapter uses Redis pipelining for batch operations to minimize round trips:
- `getMulti()` fetches multiple features in one round trip
- `getAll()` efficiently loads all feature data

### Memory Usage

Each feature uses:
- 1 set member in `flipper_features` (~50 bytes)
- 1 hash with N fields (~100 bytes + field data)

For 1000 features with typical gate values: ~500KB

## Compatibility

### Ruby Flipper

This adapter is fully compatible with the Ruby Flipper Redis adapter. You can:
- Use Ruby Flipper to read flags written by TypeScript Flipper
- Use TypeScript Flipper to read flags written by Ruby Flipper
- Run both in the same application

The data structure and key naming conventions match exactly, enabling seamless cross-language interoperability.

### ioredis Version

Requires ioredis 5.x or later.

## Testing

Use `ioredis-mock` for testing without a real Redis instance:

```typescript
import RedisMock from 'ioredis-mock'
import { RedisAdapter } from '@flippercloud/flipper-redis'

const redis = new RedisMock()
const adapter = new RedisAdapter({ client: redis })

// Use in tests
await flipper.enable('test-feature')
```

## Best Practices

- Use a distinct key prefix per environment (e.g., `prod:flipper:`, `staging:flipper:`)
- Enable connection pooling for high-traffic applications
- Consider read-only adapters for worker processes that only check flags
- Monitor Redis memory usage as feature count grows
- Use Redis Cluster for high availability requirements
- Combine with the cache adapter for read-heavy workloads

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Connection refused | Verify Redis is running and accessible at the specified host/port |
| High latency | Check network between app and Redis; consider adding cache adapter |
| Memory growth | Audit feature count and gate complexity; use TTLs if appropriate |
| Cross-language issues | Ensure key prefixes match between Ruby and TypeScript implementations |

## Next Steps

- Combine with the [Cache adapter](./cache.md) for read-heavy workloads
- Review the [Getting Started guide](../guides/getting-started.md) for basic usage patterns
- Share feedback or improvements in this doc to keep it accurate
