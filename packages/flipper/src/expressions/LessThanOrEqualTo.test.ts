import LessThanOrEqualTo from './LessThanOrEqualTo'
import Constant from './Constant'
import Property from './Property'
import { buildExpression } from './index'

describe('LessThanOrEqualTo', () => {
  describe('constructor', () => {
    test('accepts two expression arguments', () => {
      const expr = new LessThanOrEqualTo(new Constant(5), new Constant(10))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('accepts expression objects via buildExpression', () => {
      const expr = buildExpression({
        LessThanOrEqualTo: [{ Constant: 5 }, { Constant: 5 }],
      }) as LessThanOrEqualTo
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })
  })

  describe('evaluate', () => {
    test('returns true when left is less than right', () => {
      const expr = new LessThanOrEqualTo(new Constant(5), new Constant(10))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns true when left equals right', () => {
      const expr = new LessThanOrEqualTo(new Constant(5), new Constant(5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false when left is greater than right', () => {
      const expr = new LessThanOrEqualTo(new Constant(10), new Constant(5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('works with negative numbers', () => {
      const expr = new LessThanOrEqualTo(new Constant(-5), new Constant(-5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('works with decimal numbers', () => {
      const expr = new LessThanOrEqualTo(new Constant(5.5), new Constant(5.5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false when comparing null', () => {
      const expr = new LessThanOrEqualTo(new Constant(null), new Constant(5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('works with property expressions', () => {
      const expr = new LessThanOrEqualTo(new Property('account_age_days'), new Constant(30))

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { account_age_days: 30 },
        })
      ).toBe(true)

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { account_age_days: 15 },
        })
      ).toBe(true)

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { account_age_days: 45 },
        })
      ).toBe(false)
    })
  })

  describe('value', () => {
    test('returns object notation', () => {
      const expr = new LessThanOrEqualTo(new Constant(5), new Constant(10))
      expect(expr.value()).toEqual({
        LessThanOrEqualTo: [5, 10],
      })
    })
  })

  describe('equals', () => {
    test('returns true for same arguments', () => {
      const expr1 = new LessThanOrEqualTo(new Constant(5), new Constant(10))
      const expr2 = new LessThanOrEqualTo(new Constant(5), new Constant(10))
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different arguments', () => {
      const expr1 = new LessThanOrEqualTo(new Constant(5), new Constant(10))
      const expr2 = new LessThanOrEqualTo(new Constant(10), new Constant(5))
      expect(expr1.equals(expr2)).toBe(false)
    })
  })
})
