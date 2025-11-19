import NotEqual from './NotEqual'
import Constant from './Constant'
import Property from './Property'
import { buildExpression } from './index'

describe('NotEqual', () => {
  describe('constructor', () => {
    test('accepts two expression arguments', () => {
      const expr = new NotEqual(new Constant(5), new Constant(10))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('accepts expression objects via buildExpression', () => {
      const expr = buildExpression({
        NotEqual: [{ Constant: 5 }, { Constant: 10 }],
      }) as NotEqual
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })
  })

  describe('evaluate', () => {
    test('returns false when numbers are equal', () => {
      const expr = new NotEqual(new Constant(5), new Constant(5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns true when numbers are not equal', () => {
      const expr = new NotEqual(new Constant(5), new Constant(10))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false when strings are equal', () => {
      const expr = new NotEqual(new Constant('hello'), new Constant('hello'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns true when strings are not equal', () => {
      const expr = new NotEqual(new Constant('hello'), new Constant('world'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false when booleans are equal', () => {
      const expr = new NotEqual(new Constant(true), new Constant(true))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns true when booleans are not equal', () => {
      const expr = new NotEqual(new Constant(true), new Constant(false))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false when comparing null to value', () => {
      const expr = new NotEqual(new Constant(null), new Constant(5))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('works with property expressions', () => {
      const expr = new NotEqual(new Property('plan'), new Constant('enterprise'))

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { plan: 'basic' },
        })
      ).toBe(true)

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { plan: 'enterprise' },
        })
      ).toBe(false)
    })

    test('returns true when comparing different types', () => {
      const expr = new NotEqual(new Constant(5), new Constant('5'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })
  })

  describe('value', () => {
    test('returns object notation', () => {
      const expr = new NotEqual(new Constant(5), new Constant(10))
      expect(expr.value()).toEqual({
        NotEqual: [5, 10],
      })
    })
  })

  describe('equals', () => {
    test('returns true for same arguments', () => {
      const expr1 = new NotEqual(new Constant(5), new Constant(10))
      const expr2 = new NotEqual(new Constant(5), new Constant(10))
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different arguments', () => {
      const expr1 = new NotEqual(new Constant(5), new Constant(10))
      const expr2 = new NotEqual(new Constant(10), new Constant(5))
      expect(expr1.equals(expr2)).toBe(false)
    })
  })
})
