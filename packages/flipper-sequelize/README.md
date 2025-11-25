# @flippercloud/flipper-sequelize

A Sequelize adapter for [Flipper](https://github.com/flippercloud/flipper) feature flags. This adapter allows you to store feature flag data in any database supported by Sequelize (MySQL, PostgreSQL, SQLite, etc.).

## Installation

```bash
npm install @flippercloud/flipper-sequelize sequelize
```

## Setup

### 1. Create Database Tables

You can create the required tables using a Sequelize migration:

```bash
npx sequelize migration:generate --name create_flipper_tables
```

Then add the following code to your migration file:

```typescript
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('flipper_features', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      key: {
        allowNull: false,
        type: Sequelize.STRING,
        unique: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
    })

    await queryInterface.createTable('flipper_gates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      feature_key: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      key: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      value: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
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

### 2. Define Sequelize Models

Create models for the flipper tables:

```typescript
import { DataTypes } from 'sequelize'

export const createFlipperModels = (sequelize) => {
  const Feature = sequelize.define(
    'FlipperFeature',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: 'flipper_features',
      timestamps: true,
      underscored: true,
    }
  )

  const Gate = sequelize.define(
    'FlipperGate',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      featureKey: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'feature_key',
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'flipper_gates',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['feature_key', 'key', 'value'],
        },
      ],
    }
  )

  Feature.hasMany(Gate, {
    foreignKey: { name: 'featureKey', field: 'feature_key' },
    sourceKey: 'key',
    as: 'gates',
  })
  Gate.belongsTo(Feature, {
    foreignKey: { name: 'featureKey', field: 'feature_key' },
    targetKey: 'key',
  })

  return { Feature, Gate }
}
```

### 3. Initialize the Adapter

```typescript
import { Sequelize } from 'sequelize'
import Flipper from '@flippercloud/flipper'
import { SequelizeAdapter } from '@flippercloud/flipper-sequelize'
import { createFlipperModels } from './models'

// Create your Sequelize instance
const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'mysql',
})

// Create flipper models
const { Feature, Gate } = createFlipperModels(sequelize)

// Create adapter
const adapter = new SequelizeAdapter({ Feature, Gate })

// Create flipper instance
const flipper = new Flipper(adapter, {})

// Use Flipper
if (await flipper.isEnabled('new-feature')) {
  console.log('Feature is enabled!')
}
```

## API

The adapter implements the full Flipper adapter interface, supporting:

- **enable**: Enable a feature for all users or specific criteria
- **disable**: Disable a feature
- **get**: Get the current state of a feature
- **getMulti**: Get state for multiple features
- **getAll**: Get state for all features
- **add**: Add a new feature
- **remove**: Remove a feature
- **clear**: Clear all gates for a feature
- **features**: List all features
- **export**: Export features as JSON
- **import**: Import features from another source

## Supported Databases

- MySQL
- PostgreSQL
- SQLite
- MSSQL
- MariaDB
- Oracle

## License

MIT
