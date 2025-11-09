import Constant from './Constant'
import type { EvaluationContext } from './types'

describe('Constant', () => {
  describe('constructor', () => {
    test('stores the value', () => {
      const constant = new Constant(42)
      expect(constant.evaluate({} as EvaluationContext)).toBe(42)
    })

    test('works with strings', () => {
      const constant = new Constant('hello')
      expect(constant.evaluate({} as EvaluationContext)).toBe('hello')
    })

    test('works with booleans', () => {
      const constant = new Constant(true)
      expect(constant.evaluate({} as EvaluationContext)).toBe(true)
    })

    test('works with null', () => {
      const constant = new Constant(null)
      expect(constant.evaluate({} as EvaluationContext)).toBe(null)
    })

    test('works with numbers', () => {
      const constant = new Constant(3.14)
      expect(constant.evaluate({} as EvaluationContext)).toBe(3.14)
    })
  })

  describe('evaluate', () => {
    test('returns the constant value regardless of context', () => {
      const constant = new Constant('test')
      const context1 = { feature_name: 'feature1', properties: { foo: 'bar' } }
      const context2 = { feature_name: 'feature2', properties: { baz: 'qux' } }

      expect(constant.evaluate(context1)).toBe('test')
      expect(constant.evaluate(context2)).toBe('test')
    })

    test('works with zero', () => {
      const constant = new Constant(0)
      expect(constant.evaluate({} as EvaluationContext)).toBe(0)
    })

    test('works with empty string', () => {
      const constant = new Constant('')
      expect(constant.evaluate({} as EvaluationContext)).toBe('')
    })

    test('works with false', () => {
      const constant = new Constant(false)
      expect(constant.evaluate({} as EvaluationContext)).toBe(false)
    })
  })

  describe('value', () => {
    test('returns primitive value directly', () => {
      const constant = new Constant(true)
      expect(constant.value()).toBe(true)
    })

    test('returns string value directly', () => {
      const constant = new Constant('hello')
      expect(constant.value()).toBe('hello')
    })

    test('returns number value directly', () => {
      const constant = new Constant(42)
      expect(constant.value()).toBe(42)
    })

    test('returns null value directly', () => {
      const constant = new Constant(null)
      expect(constant.value()).toBe(null)
    })

    test('returns false value directly', () => {
      const constant = new Constant(false)
      expect(constant.value()).toBe(false)
    })
  })

  describe('equals', () => {
    test('returns true for same value', () => {
      const c1 = new Constant(42)
      const c2 = new Constant(42)
      expect(c1.equals(c2)).toBe(true)
    })

    test('returns false for different values', () => {
      const c1 = new Constant(42)
      const c2 = new Constant(43)
      expect(c1.equals(c2)).toBe(false)
    })

    test('returns false for different types', () => {
      const c1 = new Constant('42')
      const c2 = new Constant(42)
      expect(c1.equals(c2)).toBe(false)
    })

    test('returns false for non-Constant values', () => {
      const constant = new Constant(42)
      expect(constant.equals(42)).toBe(false)
      expect(constant.equals({ value: 42 })).toBe(false)
      expect(constant.equals(null)).toBe(false)
    })

    test('returns true for null values', () => {
      const c1 = new Constant(null)
      const c2 = new Constant(null)
      expect(c1.equals(c2)).toBe(true)
    })

    test('returns true for boolean values', () => {
      const c1 = new Constant(true)
      const c2 = new Constant(true)
      expect(c1.equals(c2)).toBe(true)

      const c3 = new Constant(false)
      const c4 = new Constant(false)
      expect(c3.equals(c4)).toBe(true)
    })

    test('returns false for true vs false', () => {
      const c1 = new Constant(true)
      const c2 = new Constant(false)
      expect(c1.equals(c2)).toBe(false)
    })
  })
})
