import Random from './Random'
import Constant from './Constant'
import Property from './Property'
import { buildExpression } from './index'

describe('Random', () => {
  describe('constructor', () => {
    test('accepts expression argument', () => {
      const expr = new Random(new Constant(100))
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)
      expect(typeof result).toBe('number')
    })

    test('accepts expression object via buildExpression', () => {
      const expr = buildExpression({
        Random: { Constant: 100 }
      }) as Random
      const context = { feature_name: 'test', properties: {} }
      expect(typeof expr.evaluate(context)).toBe('number')
    })
  })

  describe('evaluate', () => {
    test('returns a number', () => {
      const expr = new Random(new Constant(100))
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)
      expect(typeof result).toBe('number')
    })

    test('returns value between 0 and max (exclusive)', () => {
      const expr = new Random(new Constant(100))
      const context = { feature_name: 'test', properties: {} }

      // Test multiple times to verify range
      for (let i = 0; i < 50; i++) {
        const result = expr.evaluate(context)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThan(100)
        expect(Number.isInteger(result)).toBe(true)
      }
    })

    test('returns 0 for max of 0', () => {
      const expr = new Random(new Constant(0))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(0)
    })

    test('returns 0 for max of 1', () => {
      const expr = new Random(new Constant(1))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(0)
    })

    test('generates different values', () => {
      const expr = new Random(new Constant(1000))
      const context = { feature_name: 'test', properties: {} }

      const results = new Set<number>()
      for (let i = 0; i < 100; i++) {
        results.add(expr.evaluate(context))
      }

      // Should have generated multiple different values
      expect(results.size).toBeGreaterThan(50)
    })

    test('works with property expressions', () => {
      const expr = new Random(new Property('max'))

      const result = expr.evaluate({
        feature_name: 'test',
        properties: { max: 50 }
      })

      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThan(50)
    })

    test('handles negative max as 0', () => {
      const expr = new Random(new Constant(-100))
      const context = { feature_name: 'test', properties: {} }

      // Math.floor(Math.random() * -100) will give negative or 0
      const result = expr.evaluate(context)
      expect(result).toBeLessThanOrEqual(0)
      expect(result).toBeGreaterThan(-100)
    })

    test('handles decimal max by flooring', () => {
      const expr = new Random(new Constant(10.7))
      const context = { feature_name: 'test', properties: {} }

      for (let i = 0; i < 20; i++) {
        const result = expr.evaluate(context)
        expect(Number.isInteger(result)).toBe(true)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThan(11)
      }
    })

    test('handles string max by converting to number', () => {
      const expr = new Random(new Constant('50'))
      const context = { feature_name: 'test', properties: {} }

      const result = expr.evaluate(context)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThan(50)
    })

    test('returns NaN for NaN max', () => {
      const expr = new Random(new Constant('not a number'))
      const context = { feature_name: 'test', properties: {} }
      // Math.random() * NaN = NaN
      expect(Number.isNaN(expr.evaluate(context))).toBe(true)
    })

    test('returns 0 for null max', () => {
      const expr = new Random(new Constant(null))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(0)
    })

    test('returns 0 for undefined max', () => {
      const expr = new Random(new Constant(undefined))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(0)
    })

    test('generates uniform distribution', () => {
      const expr = new Random(new Constant(10))
      const context = { feature_name: 'test', properties: {} }

      const counts = new Array(10).fill(0)
      const iterations = 10000

      for (let i = 0; i < iterations; i++) {
        const result = expr.evaluate(context)
        counts[result]++
      }

      // Each bucket should have roughly 10% of results (±5%)
      const expected = iterations / 10
      for (const count of counts) {
        expect(count).toBeGreaterThan(expected * 0.7)
        expect(count).toBeLessThan(expected * 1.3)
      }
    })
  })

  describe('value', () => {
    test('returns object notation', () => {
      const expr = new Random(new Constant(100))
      expect(expr.value()).toEqual({
        Random: 100
      })
    })

    test('preserves nested expression structure', () => {
      const expr = new Random(new Property('max'))
      expect(expr.value()).toEqual({
        Random: { Property: 'max' }
      })
    })
  })

  describe('equals', () => {
    test('returns true for same argument', () => {
      const expr1 = new Random(new Constant(100))
      const expr2 = new Random(new Constant(100))
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different arguments', () => {
      const expr1 = new Random(new Constant(100))
      const expr2 = new Random(new Constant(200))
      expect(expr1.equals(expr2)).toBe(false)
    })

    test('returns false for non-Random values', () => {
      const expr = new Random(new Constant(100))
      expect(expr.equals(100)).toBe(false)
      expect(expr.equals({ Random: 100 })).toBe(false)
    })
  })
})
