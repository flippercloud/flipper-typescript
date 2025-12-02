# @flippercloud/flipper-redis

Redis adapter for [Flipper](https://github.com/flippercloud/flipper) feature flags.

This adapter stores feature flag state in Redis using hashes for feature gate values and a set to track all feature keys. It's fully compatible with the Ruby Flipper Redis adapter for cross-language interoperability.

## Installation

```bash
bun add @flippercloud/flipper-redis ioredis
```

**Note:** This package uses [ioredis](https://github.com/redis/ioredis) as its Redis client. You must install `ioredis` as a peer dependency.

## Quick usage

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

## Docs

Looking for setup options, clustering, read-only mode, data structures, and best practices? See the full guide: [Redis adapter guide](../../docs/adapters/redis.md).

## License

MIT
