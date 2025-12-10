# @flippercloud/flipper-cloud

Official Flipper Cloud adapter for TypeScript/JavaScript. This adapter provides seamless synchronization between your local adapter and Flipper Cloud, with low-latency reads and automatic background sync.

## Installation

```bash
bun add @flippercloud/flipper-cloud
```

**Note:** You'll also need a local adapter for fast reads. We recommend the memory adapter (built-in) for simple cases, or Redis/Sequelize for distributed systems.

## Quick usage

```typescript
import Flipper from '@flippercloud/flipper'
import { FlipperCloud } from '@flippercloud/flipper-cloud'

const flipper = await FlipperCloud({
  token: 'your-cloud-token',
})

await flipper.enable('new-feature')
const isEnabled = await flipper.isEnabled('new-feature')
console.log(isEnabled) // true
```

## Docs

Looking for configuration options, local adapters, sync strategies, and best practices? See the full guide: [Cloud adapter guide](../../docs/adapters/cloud.md).

## License

MIT
