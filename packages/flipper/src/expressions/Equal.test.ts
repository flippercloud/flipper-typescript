import Equal from './Equal'
import Constant from './Constant'
import Property from './Property'
import { buildExpression } from './index'

describe('Equal', () => {
  describe('constructor', () => {
    test('accepts two expression arguments', () => {
      const expr = new Equal(
        new Constant(5),
        new Constant(5)
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('accepts expression objects via buildExpression', () => {
      const expr = buildExpression({
        Equal: [{ Constant: 5 }, { Constant: 5 }]
      }) as Equal
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })
  })

  describe('evaluate', () => {
    test('returns true when numbers are equal', () => {
      const expr = new Equal(new Constant(5), new Constant(5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false when numbers are not equal', () => {
      const expr = new Equal(new Constant(5), new Constant(10))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns true when strings are equal', () => {
      const expr = new Equal(new Constant('hello'), new Constant('hello'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false when strings are not equal', () => {
      const expr = new Equal(new Constant('hello'), new Constant('world'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns true when booleans are equal', () => {
      const expr = new Equal(new Constant(true), new Constant(true))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false when booleans are not equal', () => {
      const expr = new Equal(new Constant(true), new Constant(false))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns false when comparing null to value', () => {
      const expr = new Equal(new Constant(null), new Constant(5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns false when comparing undefined to value', () => {
      const expr = new Equal(new Constant(undefined), new Constant(5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('works with property expressions', () => {
      const expr = new Equal(
        new Property('plan'),
        new Constant('enterprise')
      )

      expect(expr.evaluate({
        feature_name: 'test',
        properties: { plan: 'enterprise' }
      })).toBe(true)

      expect(expr.evaluate({
        feature_name: 'test',
        properties: { plan: 'basic' }
      })).toBe(false)
    })

    test('compares two properties', () => {
      const expr = new Equal(
        new Property('value1'),
        new Property('value2')
      )

      expect(expr.evaluate({
        feature_name: 'test',
        properties: { value1: 'same', value2: 'same' }
      })).toBe(true)

      expect(expr.evaluate({
        feature_name: 'test',
        properties: { value1: 'different', value2: 'values' }
      })).toBe(false)
    })

    test('returns false when comparing different types', () => {
      const expr = new Equal(new Constant(5), new Constant('5'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns false when comparing 0 to false', () => {
      const expr = new Equal(new Constant(0), new Constant(false))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })
  })

  describe('value', () => {
    test('returns object notation', () => {
      const expr = new Equal(
        new Constant(5),
        new Constant(10)
      )
      expect(expr.value()).toEqual({
        Equal: [5, 10]
      })
    })

    test('preserves nested expression structure', () => {
      const expr = new Equal(
        new Property('plan'),
        new Constant('enterprise')
      )
      expect(expr.value()).toEqual({
        Equal: [
          { Property: 'plan' },
          'enterprise'
        ]
      })
    })
  })

  describe('equals', () => {
    test('returns true for same arguments', () => {
      const expr1 = new Equal(new Constant(5), new Constant(10))
      const expr2 = new Equal(new Constant(5), new Constant(10))
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different arguments', () => {
      const expr1 = new Equal(new Constant(5), new Constant(10))
      const expr2 = new Equal(new Constant(10), new Constant(5))
      expect(expr1.equals(expr2)).toBe(false)
    })

    test('returns false for non-Equal values', () => {
      const expr = new Equal(new Constant(5), new Constant(10))
      expect(expr.equals(true)).toBe(false)
      expect(expr.equals({ Equal: [5, 10] })).toBe(false)
    })
  })
})
