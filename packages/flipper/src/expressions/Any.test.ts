import Any from './Any'
import Constant from './Constant'
import Property from './Property'
import { buildExpression } from './index'

describe('Any', () => {
  describe('constructor', () => {
    test('accepts multiple expression arguments', () => {
      const expr = new Any(new Constant(true), new Constant(false), new Constant(true))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('accepts expression objects via buildExpression', () => {
      const expr = buildExpression({
        Any: [{ Constant: true }, { Constant: false }],
      }) as Any
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })
  })

  describe('evaluate', () => {
    test('returns true if any argument is truthy', () => {
      const expr = new Any(new Constant(false), new Constant(false), new Constant(true))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false if all arguments are falsy', () => {
      const expr = new Any(new Constant(false), new Constant(false), new Constant(false))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns true if first argument is truthy', () => {
      const expr = new Any(new Constant(true), new Constant(false), new Constant(false))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('works with property expressions', () => {
      const expr = new Any(new Property('admin'), new Property('beta_user'))

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { admin: false, beta_user: true },
        })
      ).toBe(true)

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { admin: false, beta_user: false },
        })
      ).toBe(false)
    })

    test('works with nested Any', () => {
      const expr = new Any(new Any(new Constant(false), new Constant(false)), new Constant(true))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('short-circuits on first truthy value', () => {
      const expr = new Any(new Constant(true), new Constant(true), new Constant(true))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('handles zero as falsy', () => {
      const expr = new Any(new Constant(0), new Constant(0), new Constant(1))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('handles empty string as falsy', () => {
      const expr = new Any(new Constant(''), new Constant(''), new Constant('hello'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('handles null and undefined as falsy', () => {
      const expr = new Any(new Constant(null), new Constant(undefined), new Constant(true))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })
  })

  describe('value', () => {
    test('returns object notation', () => {
      const expr = new Any(new Constant(true), new Constant(false))
      expect(expr.value()).toEqual({
        Any: [true, false],
      })
    })

    test('preserves nested expression structure', () => {
      const expr = new Any(new Property('admin'), new Constant(true))
      expect(expr.value()).toEqual({
        Any: [{ Property: 'admin' }, true],
      })
    })
  })

  describe('equals', () => {
    test('returns true for same arguments', () => {
      const expr1 = new Any(new Constant(true), new Constant(false))
      const expr2 = new Any(new Constant(true), new Constant(false))
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different arguments', () => {
      const expr1 = new Any(new Constant(true), new Constant(false))
      const expr2 = new Any(new Constant(false), new Constant(true))
      expect(expr1.equals(expr2)).toBe(false)
    })

    test('returns false for different number of arguments', () => {
      const expr1 = new Any(new Constant(true), new Constant(false))
      const expr2 = new Any(new Constant(true), new Constant(false), new Constant(true))
      expect(expr1.equals(expr2)).toBe(false)
    })

    test('returns false for non-Any values', () => {
      const expr = new Any(new Constant(true), new Constant(false))
      expect(expr.equals(true)).toBe(false)
      expect(expr.equals({ Any: [true, false] })).toBe(false)
    })
  })
})
