# Sequelize Adapter

The Sequelize adapter stores feature gate state in a SQL database via [Sequelize](https://sequelize.org). Use it when you already run a relational database and want Flipper data to live alongside your application tables.

## Installation

```bash
# Add the adapter and its peer dependency to your project
bun add @flippercloud/flipper-sequelize sequelize

# Or, inside the monorepo, ensure the workspace is linked:
bun install
```

> **Prerequisites:** Node.js ≥ 18, Bun ≥ 1.3.2, and a database supported by Sequelize (e.g., PostgreSQL, MySQL, SQLite).

> **Note:** `sequelize` is a required peer dependency of this adapter. Install it alongside the adapter in your application.

## Database Setup

The adapter expects two tables: `flipper_features` and `flipper_gates`. You can generate them with migrations or sync models at runtime. The package exports helper models for convenience:

```typescript
import { Sequelize } from 'sequelize'
import { createFlipperModels } from '@flippercloud/flipper-sequelize'

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  logging: false,
})

const { Feature, Gate } = createFlipperModels(sequelize)
await sequelize.sync()
```

> For production, run migrations ahead of time. The helpers expose the model definitions so you can integrate them into your own migration tooling.

## Migrations (example)

For production environments, we recommend managing schema via migrations. Below is a minimal migration example that creates the two tables used by the adapter:

```typescript
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('flipper_features', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      key: { allowNull: false, type: Sequelize.STRING, unique: true },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
    })

    await queryInterface.createTable('flipper_gates', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      feature_key: { allowNull: false, type: Sequelize.STRING },
      key: { allowNull: false, type: Sequelize.STRING },
      value: { allowNull: true, type: Sequelize.TEXT },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
      updated_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('now') },
    })

    await queryInterface.addIndex('flipper_gates', ['feature_key', 'key', 'value'], {
      unique: true,
      name: 'index_flipper_gates_on_feature_key_and_key_and_value',
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('flipper_gates')
    await queryInterface.dropTable('flipper_features')
  },
}
```

If you prefer to avoid migrations in development or tests, you can rely on `sequelize.sync()` to create the tables at runtime, as shown above.

## Usage

```typescript
import { Flipper } from '@flippercloud/flipper'
import SequelizeAdapter from '@flippercloud/flipper-sequelize'
import { createFlipperModels } from '@flippercloud/flipper-sequelize'
import { Sequelize } from 'sequelize'

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  logging: false,
})

const models = createFlipperModels(sequelize)
await sequelize.sync()

const adapter = new SequelizeAdapter({
  Feature: models.Feature,
  Gate: models.Gate,
})

const flipper = new Flipper(adapter)

await flipper.enable('search')
const enabled = await flipper.isFeatureEnabled('search')
```

## API surface

The adapter implements the full Flipper adapter contract:

- enable: Enable a feature for all users or specific criteria
- disable: Disable a feature
- get: Get the current state of a feature
- getMulti: Get state for multiple features
- getAll: Get state for all features
- add: Add a new feature
- remove: Remove a feature
- clear: Clear all gates for a feature
- features: List all features
- export: Export features as JSON
- import: Import features from another source

### Read-only Mode

Pass `readOnly: true` when constructing the adapter to prevent mutating methods. This is useful for replicas or background workers:

```typescript
const readOnlyAdapter = new SequelizeAdapter({
  Feature: models.Feature,
  Gate: models.Gate,
  readOnly: true,
})
```

Mutations such as `enable` or `disable` will throw `ReadOnlyError` while reads continue to work.

### Import / Export

The adapter supports moving feature state between stores:

```typescript
const backup = await adapter.export({ format: 'json' })
// ...persist backup...
await adapter.import(otherAdapter)
```

When importing, the adapter creates missing features and gates automatically.

## Supported databases

Any database supported by Sequelize, including:

- PostgreSQL
- MySQL / MariaDB
- SQLite
- MSSQL

## Testing

The `@flippercloud/flipper-sequelize` package includes a Jest suite that spins up an in-memory SQLite database. Run it whenever you change adapter behavior:

```bash
bun run test -w @flippercloud/flipper-sequelize
```

For CI environments that lack SQLite, point Sequelize to your preferred engine before running tests.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| `rootDir` TypeScript error when testing | Ensure the adapter's `tsconfig` includes the flipper workspace (`packages/flipper`) or rely on compiled output by running `bun run build` before tests. |
| Connection refused | Verify `DATABASE_URL` and that the database accepts connections from the running environment. |
| Tables missing | Run migrations or `sequelize.sync()` before enabling features. |

## Next Steps

- Review the source code in `packages/flipper-sequelize/` for advanced options.
- Pair Sequelize with the [Cache adapter](../adapters/cache.md) for read-heavy workloads.
- Share feedback or improvements in `docs/adapters/sequelize.md` to keep this guide accurate.
