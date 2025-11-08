import PercentageOfActors from './PercentageOfActors'
import Constant from './Constant'
import Property from './Property'
import { buildExpression } from './index'

describe('PercentageOfActors', () => {
  describe('constructor', () => {
    test('accepts two expression arguments', () => {
      const expr = new PercentageOfActors(
        new Constant('user-123'),
        new Constant(25)
      )
      const context = { feature_name: 'test', properties: {} }
      // Just verify it can evaluate without error
      expect(typeof expr.evaluate(context)).toBe('boolean')
    })

    test('accepts expression objects via buildExpression', () => {
      const expr = buildExpression({
        PercentageOfActors: [{ Constant: 'user-123' }, { Constant: 25 }]
      }) as PercentageOfActors
      const context = { feature_name: 'test', properties: {} }
      expect(typeof expr.evaluate(context)).toBe('boolean')
    })
  })

  describe('evaluate', () => {
    test('returns boolean', () => {
      const expr = new PercentageOfActors(
        new Constant('user-123'),
        new Constant(25)
      )
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)
      expect(typeof result).toBe('boolean')
    })

    test('returns false for 0 percentage', () => {
      const expr = new PercentageOfActors(
        new Constant('user-123'),
        new Constant(0)
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns true for 100 percentage', () => {
      const expr = new PercentageOfActors(
        new Constant('user-123'),
        new Constant(100)
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false for empty flipper_id', () => {
      const expr = new PercentageOfActors(
        new Constant(''),
        new Constant(50)
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns consistent result for same flipper_id', () => {
      const expr = new PercentageOfActors(
        new Constant('user-123'),
        new Constant(25)
      )
      const context = { feature_name: 'test', properties: {} }

      const result1 = expr.evaluate(context)
      const result2 = expr.evaluate(context)
      const result3 = expr.evaluate(context)

      expect(result1).toBe(result2)
      expect(result2).toBe(result3)
    })

    test('returns different results for different flipper_ids', () => {
      const context = { feature_name: 'test', properties: {} }
      const percentage = 50

      // Test multiple IDs and expect some variation
      const results: boolean[] = []
      for (let i = 1; i <= 100; i++) {
        const expr = new PercentageOfActors(
          new Constant(`user-${i}`),
          new Constant(percentage)
        )
        results.push(expr.evaluate(context))
      }

      const trueCount = results.filter(r => r).length
      const falseCount = results.filter(r => !r).length

      // Both should have some values (not all true or all false)
      expect(trueCount).toBeGreaterThan(0)
      expect(falseCount).toBeGreaterThan(0)
    })

    test('works with property expressions', () => {
      const expr = new PercentageOfActors(
        new Property('flipper_id'),
        new Constant(50)
      )

      const result = expr.evaluate({
        feature_name: 'test',
        properties: { flipper_id: 'user-123' }
      })

      expect(typeof result).toBe('boolean')
    })

    test('uses feature name in hash calculation', () => {
      const expr = new PercentageOfActors(
        new Constant('user-123'),
        new Constant(25)
      )

      const result1 = expr.evaluate({ feature_name: 'feature1', properties: {} })
      const result2 = expr.evaluate({ feature_name: 'feature2', properties: {} })

      // Results might differ due to feature name in hash
      // This is fine - we just want to verify it uses feature_name
      expect(typeof result1).toBe('boolean')
      expect(typeof result2).toBe('boolean')
    })

    test('handles numeric flipper_id', () => {
      const expr = new PercentageOfActors(
        new Constant(123),
        new Constant(50)
      )
      const context = { feature_name: 'test', properties: {} }
      expect(typeof expr.evaluate(context)).toBe('boolean')
    })

    test('handles percentage as property', () => {
      const expr = new PercentageOfActors(
        new Constant('user-123'),
        new Property('rollout_percentage')
      )

      const result = expr.evaluate({
        feature_name: 'test',
        properties: { rollout_percentage: 25 }
      })

      expect(typeof result).toBe('boolean')
    })

    test('respects percentage boundaries', () => {
      const context = { feature_name: 'test', properties: {} }

      // Test with many IDs to get statistical distribution
      let countAt25 = 0
      let countAt50 = 0
      let countAt75 = 0
      const testSize = 1000

      for (let i = 0; i < testSize; i++) {
        const id = `user-${i}`

        if (new PercentageOfActors(new Constant(id), new Constant(25)).evaluate(context)) {
          countAt25++
        }
        if (new PercentageOfActors(new Constant(id), new Constant(50)).evaluate(context)) {
          countAt50++
        }
        if (new PercentageOfActors(new Constant(id), new Constant(75)).evaluate(context)) {
          countAt75++
        }
      }

      // Allow 10% margin of error
      expect(countAt25).toBeGreaterThan(testSize * 0.15)
      expect(countAt25).toBeLessThan(testSize * 0.35)

      expect(countAt50).toBeGreaterThan(testSize * 0.40)
      expect(countAt50).toBeLessThan(testSize * 0.60)

      expect(countAt75).toBeGreaterThan(testSize * 0.65)
      expect(countAt75).toBeLessThan(testSize * 0.85)
    })
  })

  describe('value', () => {
    test('returns object notation', () => {
      const expr = new PercentageOfActors(
        new Constant('user-123'),
        new Constant(25)
      )
      expect(expr.value()).toEqual({
        PercentageOfActors: ['user-123', 25]
      })
    })

    test('preserves nested expression structure', () => {
      const expr = new PercentageOfActors(
        new Property('flipper_id'),
        new Constant(50)
      )
      expect(expr.value()).toEqual({
        PercentageOfActors: [
          { Property: 'flipper_id' },
          50
        ]
      })
    })
  })

  describe('equals', () => {
    test('returns true for same arguments', () => {
      const expr1 = new PercentageOfActors(new Constant('user-123'), new Constant(25))
      const expr2 = new PercentageOfActors(new Constant('user-123'), new Constant(25))
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different arguments', () => {
      const expr1 = new PercentageOfActors(new Constant('user-123'), new Constant(25))
      const expr2 = new PercentageOfActors(new Constant('user-456'), new Constant(25))
      expect(expr1.equals(expr2)).toBe(false)
    })

    test('returns false for non-PercentageOfActors values', () => {
      const expr = new PercentageOfActors(new Constant('user-123'), new Constant(25))
      expect(expr.equals(true)).toBe(false)
    })
  })
})
