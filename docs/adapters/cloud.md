# Cloud Adapter

The Flipper Cloud adapter provides seamless synchronization between a local adapter and Flipper Cloud. All reads go to the local adapter for low latency, while writes are dual-written to both local and cloud. A background poller keeps the local adapter in sync with cloud changes.

## Installation

```bash
bun add @flippercloud/flipper-cloud
```

> **Prerequisites:** Node.js ≥ 18, Bun ≥ 1.3.2, and a Flipper Cloud account with an environment token.

> **Note:** The Cloud adapter requires a local adapter for fast reads. By default it uses an in-memory adapter, but you can provide Redis, Sequelize, or any other adapter for distributed systems.

## Quick Start

```typescript
import { FlipperCloud } from '@flippercloud/flipper-cloud'

const flipper = await FlipperCloud({
  token: process.env.FLIPPER_CLOUD_TOKEN!,
})

await flipper.enable('new-feature')
const isEnabled = await flipper.isEnabled('new-feature')
console.log(isEnabled) // true
```

## Configuration Options

### Custom URL

Override the Flipper Cloud URL (useful for development):

```typescript
const flipper = await FlipperCloud({
  token: process.env.FLIPPER_CLOUD_TOKEN!,
  url: 'http://localhost:5000/adapter',
})
```

### Custom Local Adapter

Use Redis or another adapter for the local cache:

```typescript
import { RedisAdapter } from '@flippercloud/flipper-redis'
import Redis from 'ioredis'

const redis = new Redis()
const localAdapter = new RedisAdapter({ client: redis })

const flipper = await FlipperCloud({
  token: process.env.FLIPPER_CLOUD_TOKEN!,
  localAdapter,
})
```

This is essential for distributed systems where multiple application servers need to share the same local cache.

### Sync Interval

Control how often the background poller syncs with cloud (default: 10 seconds):

```typescript
const flipper = await FlipperCloud({
  token: process.env.FLIPPER_CLOUD_TOKEN!,
  syncInterval: 30000, // 30 seconds
})
```

Longer intervals reduce network traffic but increase staleness. Shorter intervals keep data fresh but increase load.

### HTTP Timeout

Configure timeouts for HTTP requests to Flipper Cloud (default: 5000ms):

```typescript
const flipper = await FlipperCloud({
  token: process.env.FLIPPER_CLOUD_TOKEN!,
  timeout: 10000, // 10 seconds
})
```

## Architecture

The Cloud adapter uses three layers:

1. **HttpAdapter** - Communicates with Flipper Cloud API via HTTP
2. **DualWrite** - Writes to both local and cloud, reads from local only
3. **Poller** - Background sync that fetches latest state from cloud

```
┌─────────────┐
│   Flipper   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   DualWrite     │
└────┬────────┬───┘
     │        │
     │        └──────────────┐
     │                       │
     ▼                       ▼
┌──────────┐          ┌────────────┐
│  Local   │◄─────────┤  Poller    │
│ Adapter  │  sync    └─────┬──────┘
└──────────┘                │
                            ▼
                     ┌─────────────┐
                     │HttpAdapter  │
                     │(Cloud API)  │
                     └─────────────┘
```

**Read path:** Flipper → DualWrite → Local Adapter (fast)
**Write path:** Flipper → DualWrite → Local Adapter + HttpAdapter (dual write)
**Sync path:** Poller → HttpAdapter → Local Adapter (background)

## Advanced Usage

### Manual Sync

Force an immediate sync with cloud:

```typescript
await flipper.adapter.sync()
```

This is useful after important changes or for testing.

### Read-only Mode

Create a read-only cloud adapter for worker processes:

```typescript
const flipper = await FlipperCloud({
  token: process.env.FLIPPER_CLOUD_TOKEN!,
  readOnly: true,
})

// Reads work
const enabled = await flipper.isEnabled('feature')

// Writes throw
await flipper.enable('feature') // throws ReadOnlyError!
```

Read-only mode still syncs from cloud but prevents writes.

### Stop Polling

Stop the background sync (useful during shutdown):

```typescript
flipper.adapter.stopPolling()
```

The poller will clean up its interval timer and stop syncing.

## Best Practices

### Use a Distributed Local Adapter

For multi-server deployments, use Redis or another distributed adapter as your local cache:

```typescript
import { RedisAdapter } from '@flippercloud/flipper-redis'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)
const localAdapter = new RedisAdapter({ client: redis })

const flipper = await FlipperCloud({
  token: process.env.FLIPPER_CLOUD_TOKEN!,
  localAdapter,
  syncInterval: 10000, // 10 seconds
})
```

This ensures all servers see the same feature flag state and reduces latency.

### Handle Initial Sync

The `FlipperCloud` function waits for the first sync before returning:

```typescript
try {
  const flipper = await FlipperCloud({
    token: process.env.FLIPPER_CLOUD_TOKEN!,
    timeout: 10000,
  })
  console.log('Cloud adapter ready!')
} catch (error) {
  console.error('Failed to sync with cloud:', error)
  // Fall back to local-only mode or exit
}
```

If the initial sync fails, the promise rejects. Consider your fallback strategy.

### Monitor Sync Health

The poller emits sync events that you can monitor:

```typescript
const flipper = await FlipperCloud({
  token: process.env.FLIPPER_CLOUD_TOKEN!,
})

// Listen for sync events (if instrumentation is configured)
// Implementation depends on your instrumenter setup
```

### Graceful Shutdown

Stop polling when your app shuts down:

```typescript
process.on('SIGTERM', () => {
  flipper.adapter.stopPolling()
  process.exit(0)
})
```

## Troubleshooting

### Sync Failures

If the poller fails to sync, it will retry on the next interval. Check:

1. Network connectivity to Flipper Cloud
2. Token validity
3. HTTP timeout settings

### Stale Data

If feature flags seem out of date:

1. Verify `syncInterval` isn't too long
2. Check that the poller is running
3. Force a manual sync: `await flipper.adapter.sync()`

### High Latency

All reads should be sub-millisecond since they hit the local adapter. If you see slow reads:

1. Check local adapter performance (Redis, Sequelize, etc.)
2. Ensure you're not accidentally reading from cloud directly

## Ruby Interoperability

The Cloud adapter is fully compatible with the Ruby Flipper Cloud adapter. Both use:

- Same HTTP API contract
- Same dual-write pattern
- Same polling mechanism
- Same ETag-based caching

You can mix Ruby and TypeScript services pointing to the same Flipper Cloud environment.

## See Also

- [Redis Adapter](./redis.md) - Recommended local adapter for distributed systems
- [Sequelize Adapter](./sequelize.md) - SQL-backed local adapter
- [Cache Adapter](./cache.md) - Layered caching strategies
