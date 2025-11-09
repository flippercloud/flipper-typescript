import LessThan from './LessThan'
import Constant from './Constant'
import Property from './Property'
import { buildExpression } from './index'

describe('LessThan', () => {
  describe('constructor', () => {
    test('accepts two expression arguments', () => {
      const expr = new LessThan(
        new Constant(5),
        new Constant(10)
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('accepts expression objects via buildExpression', () => {
      const expr = buildExpression({
        LessThan: [{ Constant: 5 }, { Constant: 10 }]
      }) as LessThan
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })
  })

  describe('evaluate', () => {
    test('returns true when left is less than right', () => {
      const expr = new LessThan(new Constant(5), new Constant(10))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false when left equals right', () => {
      const expr = new LessThan(new Constant(5), new Constant(5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns false when left is greater than right', () => {
      const expr = new LessThan(new Constant(10), new Constant(5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('works with negative numbers', () => {
      const expr = new LessThan(new Constant(-10), new Constant(-5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('works with decimal numbers', () => {
      const expr = new LessThan(new Constant(5.4), new Constant(5.5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false when comparing null', () => {
      const expr = new LessThan(new Constant(null), new Constant(5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('works with property expressions', () => {
      const expr = new LessThan(
        new Property('account_age_days'),
        new Constant(30)
      )

      expect(expr.evaluate({
        feature_name: 'test',
        properties: { account_age_days: 15 }
      })).toBe(true)

      expect(expr.evaluate({
        feature_name: 'test',
        properties: { account_age_days: 45 }
      })).toBe(false)
    })
  })

  describe('value', () => {
    test('returns object notation', () => {
      const expr = new LessThan(
        new Constant(5),
        new Constant(10)
      )
      expect(expr.value()).toEqual({
        LessThan: [5, 10]
      })
    })
  })

  describe('equals', () => {
    test('returns true for same arguments', () => {
      const expr1 = new LessThan(new Constant(5), new Constant(10))
      const expr2 = new LessThan(new Constant(5), new Constant(10))
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different arguments', () => {
      const expr1 = new LessThan(new Constant(5), new Constant(10))
      const expr2 = new LessThan(new Constant(10), new Constant(5))
      expect(expr1.equals(expr2)).toBe(false)
    })
  })
})
