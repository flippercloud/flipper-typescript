# @flippercloud/flipper-redis

Redis adapter for [Flipper](https://github.com/flippercloud/flipper) feature flags.

This adapter stores feature flag state in Redis using hashes for feature gate values and a set to track all feature keys. It's fully compatible with the Ruby Flipper Redis adapter for cross-language interoperability.

## Installation

```bash
npm install @flippercloud/flipper-redis ioredis
# or
yarn add @flippercloud/flipper-redis ioredis
# or
pnpm add @flippercloud/flipper-redis ioredis
# or
bun add @flippercloud/flipper-redis ioredis
```

**Note:** This package uses [ioredis](https://github.com/redis/ioredis) as its Redis client. You must install `ioredis` as a peer dependency.

## Usage

### Basic Setup

```typescript
import Redis from 'ioredis'
import Flipper from '@flippercloud/flipper'
import { RedisAdapter } from '@flippercloud/flipper-redis'

// Create Redis client
const redis = new Redis({
  host: 'localhost',
  port: 6379,
})

// Create adapter
const adapter = new RedisAdapter({ client: redis })

// Create Flipper instance
const flipper = new Flipper(adapter)

// Use Flipper
await flipper.enable('new-feature')
const isEnabled = await flipper.isEnabled('new-feature')
console.log(isEnabled) // true
```

### With Key Prefix

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

### Using Redis Cluster

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

The adapter uses the following Redis data structure:

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

This format is compatible with the Ruby Flipper Redis adapter.

## API

### `RedisAdapter(options)`

Creates a new Redis adapter.

#### Options

- `client` (required): ioredis `Redis` or `Cluster` instance
- `keyPrefix` (optional): String prefix for all Redis keys (default: `''`)
- `readOnly` (optional): Boolean, when `true` prevents all write operations (default: `false`)

### Methods

Implements the full `IAdapter` interface:

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

The adapter uses Redis pipelining for batch operations:
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

## License

MIT
