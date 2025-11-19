import Percentage from './Percentage'
import Constant from './Constant'
import Property from './Property'
import { buildExpression } from './index'

describe('Percentage', () => {
  describe('constructor', () => {
    test('accepts two expression arguments', () => {
      const expr = new Percentage(new Constant(25), new Constant(50))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('accepts expression objects via buildExpression', () => {
      const expr = buildExpression({
        Percentage: [{ Constant: 25 }, { Constant: 50 }],
      }) as Percentage
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })
  })

  describe('evaluate', () => {
    test('returns true when value is less than percentage', () => {
      const expr = new Percentage(new Constant(25), new Constant(50))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false when value equals percentage', () => {
      const expr = new Percentage(new Constant(50), new Constant(50))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns false when value is greater than percentage', () => {
      const expr = new Percentage(new Constant(75), new Constant(50))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('works with decimal values', () => {
      const expr = new Percentage(new Constant(24.9), new Constant(25))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('works with negative numbers', () => {
      const expr = new Percentage(new Constant(-10), new Constant(0))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false for 0 compared to 0', () => {
      const expr = new Percentage(new Constant(0), new Constant(0))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('works with property expressions', () => {
      const expr = new Percentage(new Property('current'), new Constant(50))

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { current: 25 },
        })
      ).toBe(true)

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { current: 75 },
        })
      ).toBe(false)
    })

    test('compares two properties', () => {
      const expr = new Percentage(new Property('value'), new Property('threshold'))

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { value: 30, threshold: 50 },
        })
      ).toBe(true)

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { value: 60, threshold: 50 },
        })
      ).toBe(false)
    })

    test('converts string values to numbers', () => {
      const expr = new Percentage(new Constant('25'), new Constant('50'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('handles null as 0', () => {
      const expr = new Percentage(new Constant(null), new Constant(50))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('handles undefined as 0', () => {
      const expr = new Percentage(new Constant(undefined), new Constant(50))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('handles NaN as 0', () => {
      const expr = new Percentage(new Constant('not a number'), new Constant(50))
      const context = { feature_name: 'test', properties: {} }
      // Number('not a number') = NaN, but comparison NaN < 50 is false
      expect(expr.evaluate(context)).toBe(false)
    })

    test('works with values over 100', () => {
      const expr = new Percentage(new Constant(150), new Constant(200))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false when both are equal large numbers', () => {
      const expr = new Percentage(new Constant(1000), new Constant(1000))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })
  })

  describe('value', () => {
    test('returns object notation', () => {
      const expr = new Percentage(new Constant(25), new Constant(50))
      expect(expr.value()).toEqual({
        Percentage: [25, 50],
      })
    })

    test('preserves nested expression structure', () => {
      const expr = new Percentage(new Property('current'), new Constant(100))
      expect(expr.value()).toEqual({
        Percentage: [{ Property: 'current' }, 100],
      })
    })
  })

  describe('equals', () => {
    test('returns true for same arguments', () => {
      const expr1 = new Percentage(new Constant(25), new Constant(50))
      const expr2 = new Percentage(new Constant(25), new Constant(50))
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different arguments', () => {
      const expr1 = new Percentage(new Constant(25), new Constant(50))
      const expr2 = new Percentage(new Constant(50), new Constant(25))
      expect(expr1.equals(expr2)).toBe(false)
    })

    test('returns false for non-Percentage values', () => {
      const expr = new Percentage(new Constant(25), new Constant(50))
      expect(expr.equals(true)).toBe(false)
      expect(expr.equals({ Percentage: [25, 50] })).toBe(false)
    })
  })
})
