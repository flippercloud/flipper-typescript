import { Sequelize } from 'sequelize'
import { createFlipperModels, CreateFlipperModelsOptions } from './Models'

describe('createFlipperModels', () => {
  let sequelize: Sequelize

  beforeEach(async () => {
    // Create fresh Sequelize instance for each test
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    })
  })

  afterEach(async () => {
    await sequelize.close()
  })

  describe('default configuration', () => {
    it('creates Feature and Gate models with default table names', async () => {
      const models = createFlipperModels(sequelize)

      expect(models.Feature).toBeDefined()
      expect(models.Gate).toBeDefined()
      expect(models.Feature.tableName).toBe('flipper_features')
      expect(models.Gate.tableName).toBe('flipper_gates')
    })

    it('syncs and creates tables successfully', async () => {
      createFlipperModels(sequelize)

      await sequelize.sync({ force: true })

      // Tables should be created
      const tables = await sequelize.getQueryInterface().showAllTables()
      expect(tables).toContain('flipper_features')
      expect(tables).toContain('flipper_gates')
    })
  })

  describe('custom configuration', () => {
    it('creates models with custom table names', async () => {
      const options: CreateFlipperModelsOptions = {
        featureTableName: 'custom_features',
        gateTableName: 'custom_gates',
      }

      const { Feature, Gate } = createFlipperModels(sequelize, options)

      expect(Feature.tableName).toBe('custom_features')
      expect(Gate.tableName).toBe('custom_gates')
    })

    it('respects timestamps configuration', async () => {
      const options: CreateFlipperModelsOptions = {
        timestamps: false,
      }

      const { Feature } = createFlipperModels(sequelize, options)

      expect(Feature.options.timestamps).toBe(false)
    })

    it('respects underscored configuration', async () => {
      const options: CreateFlipperModelsOptions = {
        underscored: false,
      }

      const { Feature } = createFlipperModels(sequelize, options)

      expect(Feature.options.underscored).toBe(false)
    })
  })

  describe('model structure', () => {
    it('Feature model has correct attributes', async () => {
      const { Feature } = createFlipperModels(sequelize)

      await sequelize.sync({ force: true })

      const feature = await Feature.create({ key: 'test-feature' })

      expect(feature.id).toBeDefined()
      expect(feature.key).toBe('test-feature')
      expect(feature.createdAt).toBeInstanceOf(Date)
      expect(feature.updatedAt).toBeInstanceOf(Date)
    })

    it('Gate model has correct attributes', async () => {
      const { Feature, Gate } = createFlipperModels(sequelize)

      await sequelize.sync({ force: true })

      const feature = await Feature.create({ key: 'test-feature' })
      const gate = await Gate.create({
        featureKey: feature.key,
        key: 'boolean',
        value: 'true',
      })

      expect(gate.id).toBeDefined()
      expect(gate.featureKey).toBe(feature.key)
      expect(gate.key).toBe('boolean')
      expect(gate.value).toBe('true')
    })

    it('enforces unique constraint on feature key', async () => {
      const { Feature } = createFlipperModels(sequelize)

      await sequelize.sync({ force: true })

      await Feature.create({ key: 'unique-feature' })

      await expect(Feature.create({ key: 'unique-feature' })).rejects.toThrow()
    })
  })

  describe('model associations', () => {
    it('Feature has many Gates', async () => {
      const { Feature, Gate } = createFlipperModels(sequelize)

      await sequelize.sync({ force: true })

      const feature = await Feature.create({ key: 'test-feature' })
      await Gate.create({ featureKey: feature.key, key: 'boolean', value: 'true' })
      await Gate.create({ featureKey: feature.key, key: 'actors', value: 'user-1' })

      const featureWithGates = await Feature.findByPk(feature.id, { include: 'gates' })

      expect(featureWithGates?.gates).toHaveLength(2)
    })

    it('Gate belongs to Feature', async () => {
      const { Feature, Gate } = createFlipperModels(sequelize)

      await sequelize.sync({ force: true })

      const feature = await Feature.create({ key: 'test-feature' })
      const gate = await Gate.create({
        featureKey: feature.key,
        key: 'boolean',
        value: 'true',
      })

      const gateWithFeature = await Gate.findByPk(gate.id, { include: 'feature' })

      expect(gateWithFeature?.feature).toBeDefined()
      expect(gateWithFeature?.feature?.key).toBe('test-feature')
    })

    it('cascades delete when feature is deleted', async () => {
      const { Feature, Gate } = createFlipperModels(sequelize)

      await sequelize.sync({ force: true })

      const feature = await Feature.create({ key: 'test-feature' })
      await Gate.create({ featureKey: feature.key, key: 'boolean', value: 'true' })

      await Feature.destroy({ where: { id: feature.id } })

      const gates = await Gate.findAll({ where: { featureKey: feature.key } })
      expect(gates).toHaveLength(0)
    })
  })
})
