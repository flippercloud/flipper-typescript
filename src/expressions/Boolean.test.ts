import BooleanExpression from './Boolean'
import Constant from './Constant'
import Property from './Property'
import { buildExpression } from './index'

describe('Boolean', () => {
  describe('constructor', () => {
    test('accepts expression argument', () => {
      const expr = new BooleanExpression(new Constant(1))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('accepts expression object via buildExpression', () => {
      const expr = buildExpression({
        Boolean: { Constant: 1 }
      }) as BooleanExpression
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })
  })

  describe('evaluate', () => {
    test('converts truthy number to true', () => {
      const expr = new BooleanExpression(new Constant(1))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('converts 0 to false', () => {
      const expr = new BooleanExpression(new Constant(0))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('converts truthy string to true', () => {
      const expr = new BooleanExpression(new Constant('hello'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('converts empty string to false', () => {
      const expr = new BooleanExpression(new Constant(''))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('converts true to true', () => {
      const expr = new BooleanExpression(new Constant(true))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('converts false to false', () => {
      const expr = new BooleanExpression(new Constant(false))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('converts null to false', () => {
      const expr = new BooleanExpression(new Constant(null))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('converts undefined to false', () => {
      const expr = new BooleanExpression(new Constant(undefined))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(false)
    })

    test('works with property expressions', () => {
      const expr = new BooleanExpression(new Property('active'))

      expect(expr.evaluate({
        feature_name: 'test',
        properties: { active: 1 }
      })).toBe(true)

      expect(expr.evaluate({
        feature_name: 'test',
        properties: { active: 0 }
      })).toBe(false)

      expect(expr.evaluate({
        feature_name: 'test',
        properties: { active: 'yes' }
      })).toBe(true)

      expect(expr.evaluate({
        feature_name: 'test',
        properties: { active: '' }
      })).toBe(false)
    })

    test('converts array to true', () => {
      const expr = new BooleanExpression(new Constant([1, 2, 3]))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('converts empty array to true', () => {
      const expr = new BooleanExpression(new Constant([]))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('converts object to true', () => {
      const expr = new BooleanExpression(new Constant({ key: 'value' }))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })

    test('converts negative numbers to true', () => {
      const expr = new BooleanExpression(new Constant(-1))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(true)
    })
  })

  describe('value', () => {
    test('returns object notation', () => {
      const expr = new BooleanExpression(new Constant(1))
      expect(expr.value()).toEqual({
        Boolean: 1
      })
    })

    test('preserves nested expression structure', () => {
      const expr = new BooleanExpression(new Property('active'))
      expect(expr.value()).toEqual({
        Boolean: { Property: 'active' }
      })
    })
  })

  describe('equals', () => {
    test('returns true for same argument', () => {
      const expr1 = new BooleanExpression(new Constant(1))
      const expr2 = new BooleanExpression(new Constant(1))
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different arguments', () => {
      const expr1 = new BooleanExpression(new Constant(1))
      const expr2 = new BooleanExpression(new Constant(0))
      expect(expr1.equals(expr2)).toBe(false)
    })

    test('returns false for non-Boolean values', () => {
      const expr = new BooleanExpression(new Constant(1))
      expect(expr.equals(true)).toBe(false)
      expect(expr.equals({ Boolean: 1 })).toBe(false)
    })
  })
})
