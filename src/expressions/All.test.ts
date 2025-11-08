import All from './All'
import Constant from './Constant'
import Property from './Property'
import { buildExpression } from './index'

describe('All', () => {
  describe('constructor', () => {
    test('accepts multiple expression arguments', () => {
      const expr = new All(
        new Constant(true),
        new Constant(true),
        new Constant(true)
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('accepts expression objects via buildExpression', () => {
      const expr = buildExpression({
        All: [{ Constant: true }, { Constant: true }]
      }) as All
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })
  })

  describe('evaluate', () => {
    test('returns true if all arguments are truthy', () => {
      const expr = new All(
        new Constant(true),
        new Constant(true),
        new Constant(true)
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns false if any argument is falsy', () => {
      const expr = new All(
        new Constant(true),
        new Constant(false),
        new Constant(true)
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns false if first argument is falsy', () => {
      const expr = new All(
        new Constant(false),
        new Constant(true),
        new Constant(true)
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('works with property expressions', () => {
      const expr = new All(
        new Property('admin'),
        new Property('beta_user')
      )

      expect(expr.evaluate({
        feature_name: 'test',
        properties: { admin: true, beta_user: true }
      })).toBe(true)

      expect(expr.evaluate({
        feature_name: 'test',
        properties: { admin: true, beta_user: false }
      })).toBe(false)
    })

    test('works with nested All', () => {
      const expr = new All(
        new All(new Constant(true), new Constant(true)),
        new Constant(true)
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('short-circuits on first falsy value', () => {
      const expr = new All(
        new Constant(true),
        new Constant(false),
        new Constant(true)
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('handles zero as falsy', () => {
      const expr = new All(
        new Constant(1),
        new Constant(0),
        new Constant(1)
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('handles empty string as falsy', () => {
      const expr = new All(
        new Constant('hello'),
        new Constant(''),
        new Constant('world')
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('handles null and undefined as falsy', () => {
      const expr = new All(
        new Constant(true),
        new Constant(null),
        new Constant(true)
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('returns true for all non-zero numbers', () => {
      const expr = new All(
        new Constant(1),
        new Constant(2),
        new Constant(3)
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('returns true for all non-empty strings', () => {
      const expr = new All(
        new Constant('a'),
        new Constant('b'),
        new Constant('c')
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })
  })

  describe('value', () => {
    test('returns object notation', () => {
      const expr = new All(
        new Constant(true),
        new Constant(false)
      )
      expect(expr.value()).toEqual({
        All: [
          true,
          false
        ]
      })
    })

    test('preserves nested expression structure', () => {
      const expr = new All(
        new Property('admin'),
        new Constant(true)
      )
      expect(expr.value()).toEqual({
        All: [
          { Property: 'admin' },
          true
        ]
      })
    })
  })

  describe('equals', () => {
    test('returns true for same arguments', () => {
      const expr1 = new All(
        new Constant(true),
        new Constant(false)
      )
      const expr2 = new All(
        new Constant(true),
        new Constant(false)
      )
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different arguments', () => {
      const expr1 = new All(
        new Constant(true),
        new Constant(false)
      )
      const expr2 = new All(
        new Constant(false),
        new Constant(true)
      )
      expect(expr1.equals(expr2)).toBe(false)
    })

    test('returns false for different number of arguments', () => {
      const expr1 = new All(
        new Constant(true),
        new Constant(false)
      )
      const expr2 = new All(
        new Constant(true),
        new Constant(false),
        new Constant(true)
      )
      expect(expr1.equals(expr2)).toBe(false)
    })

    test('returns false for non-All values', () => {
      const expr = new All(
        new Constant(true),
        new Constant(false)
      )
      expect(expr.equals(true)).toBe(false)
      expect(expr.equals({ All: [true, false] })).toBe(false)
    })
  })
})
