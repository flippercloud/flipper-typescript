# @flippercloud/flipper-sequelize

A Sequelize adapter for [Flipper](https://github.com/flippercloud/flipper) feature flags. This adapter allows you to store feature flag data in any database supported by Sequelize (MySQL, PostgreSQL, SQLite, etc.).

## Installation

```bash
bun add @flippercloud/flipper-sequelize sequelize
```

## Quick usage

```typescript
import { Sequelize } from 'sequelize'
import Flipper from '@flippercloud/flipper'
import SequelizeAdapter, { createFlipperModels } from '@flippercloud/flipper-sequelize'

const sequelize = new Sequelize(process.env.DATABASE_URL!)
const { Feature, Gate } = createFlipperModels(sequelize)
await sequelize.sync()

const adapter = new SequelizeAdapter({ Feature, Gate })
const flipper = new Flipper(adapter)

await flipper.enable('search')
const enabled = await flipper.isFeatureEnabled('search')
```

## Docs

Looking for database setup, migrations, read-only mode, and best practices? See the full guide: [Sequelize adapter guide](../../docs/adapters/sequelize.md).

## License

MIT
