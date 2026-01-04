import { Sequelize } from 'sequelize'
import { Flipper, Feature } from '@flippercloud/flipper'
import { createFlipperModels } from './Models'
import SequelizeAdapter from './SequelizeAdapter'

describe('SequelizeAdapter', () => {
  let sequelize: Sequelize
  let adapter: SequelizeAdapter
  let flipper: Flipper
  let FeatureModel: any
  let GateModel: any

  beforeAll(async () => {
    // Use in-memory SQLite for testing
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    })

    // Create models once
    const models = createFlipperModels(sequelize)
    FeatureModel = models.Feature
    GateModel = models.Gate

    // Sync models with database (create tables)
    await sequelize.sync({ force: true })
  })

  beforeEach(async () => {
    // Clear tables before each test
    await GateModel.destroy({ where: {} })
    await FeatureModel.destroy({ where: {} })

    adapter = new SequelizeAdapter({
      Feature: FeatureModel,
      Gate: GateModel,
    })

    flipper = new Flipper(adapter, {})
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('add', () => {
    it('adds a new feature', async () => {
      const feature = new Feature('test-feature', adapter, {})
      const result = await adapter.add(feature)

      expect(result).toBe(true)

      const features = await adapter.features()
      expect(features.length).toBe(1)
      expect(features[0]?.key).toBe('test-feature')
    })

    it('returns false when adding a duplicate feature', async () => {
      const feature = new Feature('test-feature', adapter, {})
      await adapter.add(feature)
      const result = await adapter.add(feature)

      expect(result).toBe(false)
    })
  })

  describe('remove', () => {
    it('removes a feature', async () => {
      const feature = new Feature('test-feature', adapter, {})
      await adapter.add(feature)

      const result = await adapter.remove(feature)
      expect(result).toBe(true)

      const features = await adapter.features()
      expect(features.length).toBe(0)
    })

    it('returns false when removing a non-existent feature', async () => {
      const feature = new Feature('non-existent', adapter, {})
      const result = await adapter.remove(feature)

      expect(result).toBe(false)
    })
  })

  describe('features', () => {
    it('returns all features', async () => {
      const feature1 = new Feature('feature-1', adapter, {})
      const feature2 = new Feature('feature-2', adapter, {})

      await adapter.add(feature1)
      await adapter.add(feature2)

      const features = await adapter.features()
      expect(features.length).toBe(2)
      expect(features.map(f => f.key)).toEqual(['feature-1', 'feature-2'])
    })

    it('returns empty array when no features exist', async () => {
      const features = await adapter.features()
      expect(features).toEqual([])
    })
  })

  describe('enable', () => {
    it('enables a boolean gate', async () => {
      const feature = new Feature('test-feature', adapter, {})
      await flipper.enable('test-feature')

      const state = await adapter.get(feature)
      expect(state.boolean).toBe(true)
    })

    it('enables an actor gate', async () => {
      const feature = new Feature('test-feature', adapter, {})
      const actor = { flipperId: 'user-123' }

      await flipper.enableActor('test-feature', actor)

      const state = await adapter.get(feature)
      expect(state.actors).toBeInstanceOf(Set)
      expect(state.actors).toContain('user-123')
    })

    it('enables a group gate', async () => {
      const feature = new Feature('test-feature', adapter, {})
      flipper.register('admin', (actor: any) => actor.isAdmin)
      await flipper.enableGroup('test-feature', 'admin')

      const state = await adapter.get(feature)
      expect(state.groups).toBeInstanceOf(Set)
      expect(state.groups).toContain('admin')
    })

    it('auto-creates a feature when enabling', async () => {
      const features = await adapter.features()
      expect(features.length).toBe(0)

      await flipper.enable('auto-created-feature')

      const features2 = await adapter.features()
      expect(features2.length).toBe(1)
      expect(features2[0]?.key).toBe('auto-created-feature')
    })
  })

  describe('disable', () => {
    it('disables a boolean gate completely', async () => {
      await flipper.enable('test-feature')
      const feature = new Feature('test-feature', adapter, {})

      let state = await adapter.get(feature)
      expect(state.boolean).toBe(true)

      await flipper.disable('test-feature')
      state = await adapter.get(feature)
      expect(state.boolean).toBeUndefined()
    })

    it('removes an actor from the actors gate', async () => {
      const actor = { flipperId: 'user-123' }
      await flipper.enableActor('test-feature', actor)
      const feature = new Feature('test-feature', adapter, {})

      let state = await adapter.get(feature)
      expect(state.actors).toContain('user-123')

      await flipper.disableActor('test-feature', actor)
      state = await adapter.get(feature)
      expect(
        (state.actors as string[] | undefined) === undefined ||
          !(state.actors as string[]).includes('user-123')
      ).toBe(true)
    })
  })

  describe('clear', () => {
    it('clears all gates for a feature', async () => {
      await flipper.enable('test-feature')
      await flipper.enableActor('test-feature', { flipperId: 'user-123' })

      const feature = new Feature('test-feature', adapter, {})
      let state = await adapter.get(feature)
      expect(Object.keys(state).length).toBeGreaterThan(0)

      await adapter.clear(feature)
      state = await adapter.get(feature)
      expect(state).toEqual({})
    })

    it('returns false when clearing a non-existent feature', async () => {
      const feature = new Feature('non-existent', adapter, {})
      const result = await adapter.clear(feature)

      expect(result).toBe(false)
    })
  })

  describe('get', () => {
    it('returns feature state', async () => {
      await flipper.enable('test-feature')

      const feature = new Feature('test-feature', adapter, {})
      const state = await adapter.get(feature)

      expect(state).toHaveProperty('boolean')
      expect(state.boolean).toBe(true)
    })

    it('returns empty object for non-existent feature', async () => {
      const feature = new Feature('non-existent', adapter, {})
      const state = await adapter.get(feature)

      expect(state).toEqual({})
    })
  })

  describe('getMulti', () => {
    it('returns state for multiple features', async () => {
      await flipper.enable('feature-1')
      await flipper.enable('feature-2')

      const feature1 = new Feature('feature-1', adapter, {})
      const feature2 = new Feature('feature-2', adapter, {})

      const state = await adapter.getMulti([feature1, feature2])

      expect(state).toHaveProperty('feature-1')
      expect(state).toHaveProperty('feature-2')
      expect(state['feature-1']?.boolean).toBe(true)
      expect(state['feature-2']?.boolean).toBe(true)
    })
  })

  describe('getAll', () => {
    it('returns state for all features', async () => {
      await flipper.enable('feature-1')
      await flipper.enable('feature-2')

      const state = await adapter.getAll()

      expect(Object.keys(state).length).toBe(2)
      expect(state).toHaveProperty('feature-1')
      expect(state).toHaveProperty('feature-2')
    })

    it('returns empty object when no features exist', async () => {
      const state = await adapter.getAll()

      expect(state).toEqual({})
    })
  })

  describe('Ruby compatibility for percentage gate keys', () => {
    it('reads percentage gates stored in snake_case', async () => {
      const featureKey = 'ruby-feature'
      await FeatureModel.create({ key: featureKey })
      await GateModel.create({ featureKey, key: 'percentage_of_actors', value: '10' })
      await GateModel.create({ featureKey, key: 'percentage_of_time', value: '15' })

      const feature = new Feature(featureKey, adapter, {})
      const state = await adapter.get(feature)

      expect(state.percentageOfActors).toBe(10)
      expect(state.percentageOfTime).toBe(15)
    })

    it('writes percentage gates using snake_case for storage', async () => {
      await flipper.enablePercentageOfActors('ts-feature', 20)
      await flipper.enablePercentageOfTime('ts-feature', 30)

      const gates = await GateModel.findAll({
        where: { featureKey: 'ts-feature' },
        order: [['key', 'ASC']],
      })

      const keys = gates.map((g: { key: string }) => g.key).sort()
      expect(keys).toEqual(expect.arrayContaining(['percentage_of_actors', 'percentage_of_time']))
      // Ensure we did not leave camelCase duplicates
      expect(keys).not.toContain('percentageOfActors')
      expect(keys).not.toContain('percentageOfTime')
    })
  })

  describe('export', () => {
    it('exports features as JSON', async () => {
      await flipper.enable('test-feature')

      const exportedData = await adapter.export({ format: 'json' })

      expect(exportedData).toBeDefined()
    })
  })

  describe('import', () => {
    it('imports features from another adapter', async () => {
      // Create source adapter with data
      const { Feature: FeatureModel, Gate: GateModel } = createFlipperModels(sequelize)
      const sourceAdapter = new SequelizeAdapter({
        Feature: FeatureModel,
        Gate: GateModel,
      })

      const sourceFlipper = new Flipper(sourceAdapter, {})
      await sourceFlipper.enable('imported-feature')

      // Import into target adapter
      await adapter.import(sourceAdapter)

      const features = await adapter.features()
      expect(features.length).toBe(1)
      expect(features[0]?.key).toBe('imported-feature')
    })
  })

  describe('readOnly', () => {
    it('returns false by default', () => {
      expect(adapter.readOnly()).toBe(false)
    })

    it('returns true when specified in options', () => {
      const { Feature: FeatureModel, Gate: GateModel } = createFlipperModels(sequelize)
      const readOnlyAdapter = new SequelizeAdapter({
        Feature: FeatureModel,
        Gate: GateModel,
        readOnly: true,
      })

      expect(readOnlyAdapter.readOnly()).toBe(true)
    })

    it('throws error when trying to modify a read-only adapter', async () => {
      const { Feature: FeatureModel, Gate: GateModel } = createFlipperModels(sequelize)
      const readOnlyAdapter = new SequelizeAdapter({
        Feature: FeatureModel,
        Gate: GateModel,
        readOnly: true,
      })

      const feature = new Feature('test-feature', readOnlyAdapter, {})
      await expect(readOnlyAdapter.add(feature)).rejects.toThrow('Adapter is read-only')
    })
  })

  describe('useMaster option', () => {
    it('passes useMaster to read queries when true', async () => {
      // Spy on findAll and findOne
      const spyFindAll = jest.spyOn(FeatureModel, 'findAll')
      const spyFindOne = jest.spyOn(FeatureModel, 'findOne')

      const masterAdapter = new SequelizeAdapter({
        Feature: FeatureModel,
        Gate: GateModel,
        useMaster: true,
      })

      // Trigger reads
      await masterAdapter.features()

      // Add then get to trigger findOne path with useMaster
      const feature = new Feature('master-read-feature', masterAdapter, {})
      await masterAdapter.add(feature)
      await masterAdapter.get(feature)

      // Assertions
      expect(spyFindAll).toHaveBeenCalled()
      const findAllArgs = spyFindAll.mock.calls[0]?.[0] as { useMaster?: boolean } | undefined
      expect(findAllArgs).toMatchObject({ useMaster: true })

      // Ensure at least one findOne received useMaster true
      const findOneCallWithUseMaster = spyFindOne.mock.calls.find(call => {
        const args = call[0] as { useMaster?: boolean } | undefined
        return args?.useMaster === true
      })
      expect(findOneCallWithUseMaster).toBeTruthy()

      // Cleanup spies
      spyFindAll.mockRestore()
      spyFindOne.mockRestore()
    })

    it('defaults to replica (no useMaster) when option not set', async () => {
      const spyFindAll = jest.spyOn(FeatureModel, 'findAll')
      await adapter.features()
      const findAllArgs = spyFindAll.mock.calls[0]?.[0] as { useMaster?: boolean } | undefined
      expect(findAllArgs?.useMaster).toBe(false)
      spyFindAll.mockRestore()
    })
  })

  describe('isFeatureEnabled checks', () => {
    it('enabled feature returns true', async () => {
      await flipper.enable('enabled-feature')
      const result = await flipper.isFeatureEnabled('enabled-feature')

      expect(result).toBe(true)
    })

    it('disabled feature returns false', async () => {
      const result = await flipper.isFeatureEnabled('disabled-feature')

      expect(result).toBe(false)
    })

    it('feature enabled for actor returns true for that actor', async () => {
      const actor = { flipperId: 'user-123' }
      await flipper.enableActor('user-feature', actor)

      const result = await flipper.isFeatureEnabled('user-feature', actor)

      expect(result).toBe(true)
    })

    it('feature enabled for actor returns false for different actor', async () => {
      const actor1 = { flipperId: 'user-123' }
      const actor2 = { flipperId: 'user-456' }

      await flipper.enableActor('user-feature', actor1)
      const result = await flipper.isFeatureEnabled('user-feature', actor2)

      expect(result).toBe(false)
    })
  })
})
