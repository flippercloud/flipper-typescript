import NumberExpression from './Number'
import Constant from './Constant'
import Property from './Property'
import { buildExpression } from './index'

describe('Number', () => {
  describe('constructor', () => {
    test('accepts expression argument', () => {
      const expr = new NumberExpression(new Constant('42'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(42)
    })

    test('accepts expression object via buildExpression', () => {
      const expr = buildExpression({
        Number: { Constant: '42' }
      }) as NumberExpression
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(42)
    })
  })

  describe('evaluate', () => {
    test('converts string to number', () => {
      const expr = new NumberExpression(new Constant('42'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(42)
    })

    test('converts "0" to 0', () => {
      const expr = new NumberExpression(new Constant('0'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(0)
    })

    test('converts negative string to number', () => {
      const expr = new NumberExpression(new Constant('-42'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(-42)
    })

    test('converts decimal string to number', () => {
      const expr = new NumberExpression(new Constant('3.14'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(3.14)
    })

    test('keeps number as number', () => {
      const expr = new NumberExpression(new Constant(42))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(42)
    })

    test('keeps 0 as 0', () => {
      const expr = new NumberExpression(new Constant(0))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(0)
    })

    test('converts true to 1', () => {
      const expr = new NumberExpression(new Constant(true))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(1)
    })

    test('converts false to 0', () => {
      const expr = new NumberExpression(new Constant(false))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(0)
    })

    test('converts null to 0', () => {
      const expr = new NumberExpression(new Constant(null))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(0)
    })

    test('converts undefined to 0', () => {
      const expr = new NumberExpression(new Constant(undefined))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(0)
    })

    test('converts invalid string to 0', () => {
      const expr = new NumberExpression(new Constant('not a number'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(0)
    })

    test('converts empty string to 0', () => {
      const expr = new NumberExpression(new Constant(''))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(0)
    })

    test('works with property expressions', () => {
      const expr = new NumberExpression(new Property('age'))

      expect(expr.evaluate({
        feature_name: 'test',
        properties: { age: '30' }
      })).toBe(30)

      expect(expr.evaluate({
        feature_name: 'test',
        properties: { age: 30 }
      })).toBe(30)

      expect(expr.evaluate({
        feature_name: 'test',
        properties: { age: true }
      })).toBe(1)
    })

    test('handles scientific notation', () => {
      const expr = new NumberExpression(new Constant('1e3'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(1000)
    })

    test('handles hexadecimal strings', () => {
      const expr = new NumberExpression(new Constant('0xff'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(255)
    })

    test('converts array to 0', () => {
      const expr = new NumberExpression(new Constant([1, 2, 3]))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(0)
    })

    test('converts object to 0', () => {
      const expr = new NumberExpression(new Constant({ key: 'value' }))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(0)
    })
  })

  describe('value', () => {
    test('returns object notation', () => {
      const expr = new NumberExpression(new Constant('42'))
      expect(expr.value()).toEqual({
        Number: '42'
      })
    })

    test('preserves nested expression structure', () => {
      const expr = new NumberExpression(new Property('age'))
      expect(expr.value()).toEqual({
        Number: { Property: 'age' }
      })
    })
  })

  describe('equals', () => {
    test('returns true for same argument', () => {
      const expr1 = new NumberExpression(new Constant('42'))
      const expr2 = new NumberExpression(new Constant('42'))
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different arguments', () => {
      const expr1 = new NumberExpression(new Constant('42'))
      const expr2 = new NumberExpression(new Constant('43'))
      expect(expr1.equals(expr2)).toBe(false)
    })

    test('returns false for non-Number values', () => {
      const expr = new NumberExpression(new Constant('42'))
      expect(expr.equals(42)).toBe(false)
      expect(expr.equals({ Number: '42' })).toBe(false)
    })
  })
})
