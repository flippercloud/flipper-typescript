/**
 * @flippercloud/flipper-sequelize
 *
 * Sequelize adapter for Flipper feature flags.
 */

export { default as SequelizeAdapter } from './SequelizeAdapter'
export type { SequelizeAdapterOptions } from './SequelizeAdapter'

export { createFlipperModels, FlipperFeatureModel, FlipperGateModel } from './Models'
export type { CreateFlipperModelsOptions } from './Models'

export { createFlipperMigration } from './Migration'
export type { MigrationOptions } from './Migration'
