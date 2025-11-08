import Now from './Now'
import { buildExpression } from './index'

describe('Now', () => {
  describe('constructor', () => {
    test('accepts no arguments', () => {
      const expr = new Now()
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)
      expect(typeof result).toBe('number')
    })

    test('accepts expression object via buildExpression', () => {
      const expr = buildExpression({ Now: [] }) as Now
      const context = { feature_name: 'test', properties: {} }
      expect(typeof expr.evaluate(context)).toBe('number')
    })
  })

  describe('evaluate', () => {
    test('returns a number', () => {
      const expr = new Now()
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)
      expect(typeof result).toBe('number')
    })

    test('returns current Unix timestamp in seconds', () => {
      const expr = new Now()
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)

      // Should be a reasonable timestamp (after 2020)
      expect(result).toBeGreaterThan(1577836800) // Jan 1, 2020
      expect(result).toBeLessThan(2147483647) // Jan 19, 2038 (32-bit limit)
    })

    test('returns timestamp without milliseconds', () => {
      const expr = new Now()
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)

      // Should be an integer (no decimal places)
      expect(Number.isInteger(result)).toBe(true)
    })

    test('returns approximately current time', () => {
      const expr = new Now()
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)

      const expected = Math.floor(Date.now() / 1000)
      // Should be within 1 second
      expect(Math.abs(result - expected)).toBeLessThanOrEqual(1)
    })

    test('returns different values when called multiple times with delay', async () => {
      const expr = new Now()
      const context = { feature_name: 'test', properties: {} }

      const result1 = expr.evaluate(context)

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1100))

      const result2 = expr.evaluate(context)

      // Should have advanced by at least 1 second
      expect(result2).toBeGreaterThanOrEqual(result1 + 1)
    })

    test('does not use properties from context', () => {
      const expr = new Now()

      const result1 = expr.evaluate({
        feature_name: 'test',
        properties: { timestamp: 123456 }
      })

      const result2 = expr.evaluate({
        feature_name: 'test',
        properties: {}
      })

      // Should return similar values regardless of properties
      expect(Math.abs(result1 - result2)).toBeLessThanOrEqual(1)
    })
  })

  describe('value', () => {
    test('returns object notation with empty array', () => {
      const expr = new Now()
      expect(expr.value()).toEqual({
        Now: []
      })
    })
  })

  describe('equals', () => {
    test('returns true for another Now instance', () => {
      const expr1 = new Now()
      const expr2 = new Now()
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for non-Now values', () => {
      const expr = new Now()
      expect(expr.equals(123456)).toBe(false)
      expect(expr.equals({ Now: [] })).toBe(false)
      expect(expr.equals(null)).toBe(false)
    })
  })
})
