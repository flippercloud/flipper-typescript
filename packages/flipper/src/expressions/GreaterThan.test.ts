import GreaterThan from './GreaterThan'
import Constant from './Constant'
import Property from './Property'
import { buildExpression } from './index'

describe('GreaterThan', () => {
  describe('constructor', () => {
    test('accepts two expression arguments', () => {
      const expr = new GreaterThan(new Constant(10), new Constant(5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('accepts expression objects via buildExpression', () => {
      const expr = buildExpression({
        GreaterThan: [{ Constant: 10 }, { Constant: 5 }],
      }) as GreaterThan
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })
  })

  describe('evaluate', () => {
    test('returns true when left is greater than right', () => {
      const expr = new GreaterThan(new Constant(10), new Constant(5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false when left equals right', () => {
      const expr = new GreaterThan(new Constant(5), new Constant(5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns false when left is less than right', () => {
      const expr = new GreaterThan(new Constant(5), new Constant(10))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('works with negative numbers', () => {
      const expr = new GreaterThan(new Constant(-5), new Constant(-10))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('works with decimal numbers', () => {
      const expr = new GreaterThan(new Constant(5.5), new Constant(5.4))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false when comparing null', () => {
      const expr = new GreaterThan(new Constant(null), new Constant(5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns false when comparing strings', () => {
      const expr = new GreaterThan(new Constant('b'), new Constant('a'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('works with property expressions', () => {
      const expr = new GreaterThan(new Property('account_age_days'), new Constant(30))

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { account_age_days: 45 },
        })
      ).toBe(true)

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { account_age_days: 15 },
        })
      ).toBe(false)
    })

    test('compares two properties', () => {
      const expr = new GreaterThan(new Property('value1'), new Property('value2'))

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { value1: 100, value2: 50 },
        })
      ).toBe(true)

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { value1: 50, value2: 100 },
        })
      ).toBe(false)
    })
  })

  describe('value', () => {
    test('returns object notation', () => {
      const expr = new GreaterThan(new Constant(10), new Constant(5))
      expect(expr.value()).toEqual({
        GreaterThan: [10, 5],
      })
    })

    test('preserves nested expression structure', () => {
      const expr = new GreaterThan(new Property('age'), new Constant(18))
      expect(expr.value()).toEqual({
        GreaterThan: [{ Property: 'age' }, 18],
      })
    })
  })

  describe('equals', () => {
    test('returns true for same arguments', () => {
      const expr1 = new GreaterThan(new Constant(10), new Constant(5))
      const expr2 = new GreaterThan(new Constant(10), new Constant(5))
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different arguments', () => {
      const expr1 = new GreaterThan(new Constant(10), new Constant(5))
      const expr2 = new GreaterThan(new Constant(5), new Constant(10))
      expect(expr1.equals(expr2)).toBe(false)
    })

    test('returns false for non-GreaterThan values', () => {
      const expr = new GreaterThan(new Constant(10), new Constant(5))
      expect(expr.equals(true)).toBe(false)
    })
  })
})
