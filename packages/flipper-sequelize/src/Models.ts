import { DataTypes, Model, Sequelize, ModelStatic } from 'sequelize'

/**
 * Sequelize model for Flipper features.
 * Represents a feature flag with a unique key.
 */
export class FlipperFeatureModel extends Model {
  declare id: number
  declare key: string
  declare createdAt: Date
  declare updatedAt: Date
  declare gates?: FlipperGateModel[]
}

/**
 * Sequelize model for Flipper gates.
 * Represents the gate configuration (boolean, actor, group, percentage, etc.) for a feature.
 */
export class FlipperGateModel extends Model {
  declare id: number
  declare featureKey: string
  declare key: string
  declare value: string | null
  declare createdAt: Date
  declare updatedAt: Date
  declare feature?: FlipperFeatureModel
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
 * Return type for createFlipperModels
 */
export interface FlipperModels {
  Feature: ModelStatic<FlipperFeatureModel>
  Gate: ModelStatic<FlipperGateModel>
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
 * const sequelize = new Sequelize('mysql://user:pass@localhost/db')
 * const { Feature, Gate } = createFlipperModels(sequelize)
 * await Feature.sync() // Create tables if they don't exist
 */
export function createFlipperModels(
  sequelize: Sequelize,
  options: CreateFlipperModelsOptions = {}
): FlipperModels {
  const {
    featureTableName = 'flipper_features',
    gateTableName = 'flipper_gates',
    timestamps = true,
    underscored = true,
  } = options

  const Feature = sequelize.define<FlipperFeatureModel>(
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
  ) as ModelStatic<FlipperFeatureModel>

  const Gate = sequelize.define<FlipperGateModel>(
    'FlipperGate',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      featureKey: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'feature_key',
      },
      key: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true,
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
          fields: ['feature_key', 'key', 'value'],
          name: `index_${gateTableName}_on_feature_key_and_key_and_value`,
        },
      ],
    }
  ) as ModelStatic<FlipperGateModel>

  // Set up associations
  Feature.hasMany(Gate, {
    foreignKey: {
      name: 'featureKey',
      field: 'feature_key',
    },
    sourceKey: 'key',
    as: 'gates',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })

  Gate.belongsTo(Feature, {
    foreignKey: {
      name: 'featureKey',
      field: 'feature_key',
    },
    targetKey: 'key',
    as: 'feature',
  })

  return { Feature, Gate }
}
