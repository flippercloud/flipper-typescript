import StringExpression from './String'
import Constant from './Constant'
import Property from './Property'
import { buildExpression } from './index'

describe('String', () => {
  describe('constructor', () => {
    test('accepts expression argument', () => {
      const expr = new StringExpression(new Constant(42))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe('42')
    })

    test('accepts expression object via buildExpression', () => {
      const expr = buildExpression({
        String: { Constant: 42 },
      }) as StringExpression
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe('42')
    })
  })

  describe('evaluate', () => {
    test('converts number to string', () => {
      const expr = new StringExpression(new Constant(42))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe('42')
    })

    test('converts 0 to "0"', () => {
      const expr = new StringExpression(new Constant(0))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe('0')
    })

    test('converts negative number to string', () => {
      const expr = new StringExpression(new Constant(-42))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe('-42')
    })

    test('converts decimal to string', () => {
      const expr = new StringExpression(new Constant(3.14))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe('3.14')
    })

    test('keeps string as string', () => {
      const expr = new StringExpression(new Constant('hello'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe('hello')
    })

    test('keeps empty string as empty string', () => {
      const expr = new StringExpression(new Constant(''))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe('')
    })

    test('converts true to "true"', () => {
      const expr = new StringExpression(new Constant(true))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe('true')
    })

    test('converts false to "false"', () => {
      const expr = new StringExpression(new Constant(false))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe('false')
    })

    test('converts null to empty string', () => {
      const expr = new StringExpression(new Constant(null))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe('')
    })

    test('converts undefined to empty string', () => {
      const expr = new StringExpression(new Constant(undefined))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe('')
    })

    test('works with property expressions', () => {
      const expr = new StringExpression(new Property('plan'))

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { plan: 'enterprise' },
        })
      ).toBe('enterprise')

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { plan: 123 },
        })
      ).toBe('123')

      expect(
        expr.evaluate({
          feature_name: 'test',
          properties: { plan: true },
        })
      ).toBe('true')
    })

    test('converts arrays to empty string', () => {
      const expr = new StringExpression(new Constant([1, 2, 3]))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe('')
    })

    test('converts objects to empty string', () => {
      const expr = new StringExpression(new Constant({ key: 'value' }))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe('')
    })
  })

  describe('value', () => {
    test('returns object notation', () => {
      const expr = new StringExpression(new Constant(42))
      expect(expr.value()).toEqual({
        String: 42,
      })
    })

    test('preserves nested expression structure', () => {
      const expr = new StringExpression(new Property('name'))
      expect(expr.value()).toEqual({
        String: { Property: 'name' },
      })
    })
  })

  describe('equals', () => {
    test('returns true for same argument', () => {
      const expr1 = new StringExpression(new Constant(42))
      const expr2 = new StringExpression(new Constant(42))
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different arguments', () => {
      const expr1 = new StringExpression(new Constant(42))
      const expr2 = new StringExpression(new Constant(43))
      expect(expr1.equals(expr2)).toBe(false)
    })

    test('returns false for non-String values', () => {
      const expr = new StringExpression(new Constant(42))
      expect(expr.equals('42')).toBe(false)
      expect(expr.equals({ String: 42 })).toBe(false)
    })
  })
})
