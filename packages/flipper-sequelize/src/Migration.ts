/**
 * Migration helper for creating Flipper tables with Sequelize.
 *
 * This module provides a reusable migration for setting up the required
 * Flipper feature flag tables in your database.
 *
 * @example
 * // In your migration file (migrations/xxx-create-flipper-tables.js):
 * import { createFlipperMigration } from '@flippercloud/flipper-sequelize';
 *
 * const migration = createFlipperMigration();
 * export const up = migration.up;
 * export const down = migration.down;
 */

import type { QueryInterface } from 'sequelize'

export interface MigrationOptions {
  featureTableName?: string
  gateTableName?: string
}

/**
 * Create a migration object for Flipper tables.
 *
 * @param options - Migration configuration options
 * @returns Object with up and down migration functions
 */
export function createFlipperMigration(options: MigrationOptions = {}) {
  const featureTableName = options.featureTableName ?? 'flipper_features'
  const gateTableName = options.gateTableName ?? 'flipper_gates'

  return {
    // Sequelize migrations have untyped Sequelize parameter by design
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async up(queryInterface: QueryInterface, Sequelize: any) {
      // Create features table
      await queryInterface.createTable(featureTableName, {
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

      // Create gates table
      await queryInterface.createTable(gateTableName, {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        feature_id: {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: featureTableName,
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        key: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        value: {
          allowNull: false,
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

      // Add composite unique index
      await queryInterface.addIndex(gateTableName, ['feature_id', 'key'], {
        unique: true,
        name: `index_${gateTableName}_on_feature_id_and_key`,
      })

      // Add index on feature_id for faster queries
      await queryInterface.addIndex(gateTableName, ['feature_id'], {
        name: `index_${gateTableName}_on_feature_id`,
      })
    },

    async down(queryInterface: QueryInterface) {
      await queryInterface.dropTable(gateTableName)
      await queryInterface.dropTable(featureTableName)
    },
  }
}
