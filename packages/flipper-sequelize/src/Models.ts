import { DataTypes, Model, Sequelize } from 'sequelize'

/**
 * Sequelize model for Flipper features.
 * Represents a feature flag with a unique key.
 */
export class FlipperFeatureModel extends Model {
  declare id: number
  declare key: string
  declare createdAt: Date
  declare updatedAt: Date
}

/**
 * Sequelize model for Flipper gates.
 * Represents the gate configuration (boolean, actor, group, percentage, etc.) for a feature.
 */
export class FlipperGateModel extends Model {
  declare id: number
  declare feature_id: number
  declare key: string
  declare value: string
  declare createdAt: Date
  declare updatedAt: Date
}

/**
 * Options for creating Flipper models.
 */
export interface CreateFlipperModelsOptions {
  featureTableName?: string
  gateTableName?: string
  timestamps?: boolean
  underscored?: boolean
}

/**
 * Factory function to create Flipper Sequelize models.
 *
 * This sets up the Feature and Gate models with their associations.
 * By default, uses 'flipper_features' and 'flipper_gates' table names.
 *
 * @param sequelize - The Sequelize instance
 * @param options - Configuration options for table names and behavior
 * @returns Object with Feature and Gate models
 *
 * @example
 * const sequelize = new Sequelize('mysql://user:pass@localhost/db');
 * const { Feature, Gate } = createFlipperModels(sequelize);
 * await Feature.sync(); // Create tables if they don't exist
 */
export function createFlipperModels(
  sequelize: Sequelize,
  options: CreateFlipperModelsOptions = {}
): {
  Feature: any
  Gate: any
} {
  const {
    featureTableName = 'flipper_features',
    gateTableName = 'flipper_gates',
    timestamps = true,
    underscored = true,
  } = options

  const Feature = sequelize.define(
    'FlipperFeature',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      key: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: featureTableName,
      timestamps,
      underscored,
      modelName: 'FlipperFeature',
    }
  )

  const Gate = sequelize.define(
    'FlipperGate',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      feature_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      key: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
      },
    },
    {
      tableName: gateTableName,
      timestamps,
      underscored,
      modelName: 'FlipperGate',
      indexes: [
        {
          unique: true,
          fields: ['feature_id', 'key'],
          name: `index_${gateTableName}_on_feature_id_and_key`,
        },
      ],
    }
  )

  // Set up associations
  Feature.hasMany(Gate, {
    foreignKey: 'feature_id',
    as: 'gates',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })

  Gate.belongsTo(Feature, {
    foreignKey: 'feature_id',
    as: 'feature',
  })

  return { Feature, Gate }
}
