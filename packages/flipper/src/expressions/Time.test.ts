import Time from './Time'
import Constant from './Constant'
import Property from './Property'
import { buildExpression } from './index'

describe('Time', () => {
  describe('constructor', () => {
    test('accepts expression argument', () => {
      const expr = new Time(new Constant('2024-01-01T00:00:00Z'))
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)
      expect(typeof result).toBe('number')
    })

    test('accepts expression object via buildExpression', () => {
      const expr = buildExpression({
        Time: { Constant: '2024-01-01T00:00:00Z' }
      }) as Time
      const context = { feature_name: 'test', properties: {} }
      expect(typeof expr.evaluate(context)).toBe('number')
    })
  })

  describe('evaluate', () => {
    test('parses ISO 8601 date string', () => {
      const expr = new Time(new Constant('2024-01-01T00:00:00Z'))
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)

      // Jan 1, 2024 00:00:00 UTC
      expect(result).toBe(1704067200)
    })

    test('parses date string with timezone', () => {
      const expr = new Time(new Constant('2024-01-01T00:00:00+00:00'))
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)

      expect(result).toBe(1704067200)
    })

    test('parses date-only string', () => {
      const expr = new Time(new Constant('2024-01-01'))
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)

      // Should parse to midnight UTC
      expect(result).toBe(1704067200)
    })

    test('parses date with time but no timezone', () => {
      const expr = new Time(new Constant('2024-01-01T12:30:00'))
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)

      // Should be greater than midnight
      expect(result).toBeGreaterThan(1704067200)
    })

    test('returns timestamp in seconds not milliseconds', () => {
      const expr = new Time(new Constant('2024-01-01T00:00:00Z'))
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)

      expect(Number.isInteger(result)).toBe(true)
      // Unix timestamp in seconds should be around 10 digits
      expect(result.toString().length).toBe(10)
    })

    test('handles numeric timestamp strings as milliseconds', () => {
      const expr = new Time(new Constant('1704067200000'))
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)

      // new Date() interprets pure numeric strings as milliseconds
      // 1704067200000 ms / 1000 = 1704067200 seconds
      expect(result).toBe(1704067200)
    })

    test('works with property expressions', () => {
      const expr = new Time(new Property('created_at'))

      const result = expr.evaluate({
        feature_name: 'test',
        properties: { created_at: '2024-01-01T00:00:00Z' }
      })

      expect(result).toBe(1704067200)
    })

    test('handles various date formats', () => {
      const formats = [
        '2024-01-15',
        '2024-01-15T10:30:00Z',
        '2024-01-15T10:30:00.000Z',
        'January 15, 2024',
        '15 Jan 2024',
        '01/15/2024'
      ]

      const context = { feature_name: 'test', properties: {} }

      for (const format of formats) {
        const expr = new Time(new Constant(format))
        const result = expr.evaluate(context)
        expect(typeof result).toBe('number')
        expect(result).toBeGreaterThan(0)
      }
    })

    test('handles empty string as Invalid Date (NaN)', () => {
      const expr = new Time(new Constant(''))
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)

      // Invalid date becomes NaN timestamp
      expect(Number.isNaN(result)).toBe(true)
    })

    test('handles invalid date string as NaN', () => {
      const expr = new Time(new Constant('not a date'))
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)

      expect(Number.isNaN(result)).toBe(true)
    })

    test('handles null as Invalid Date', () => {
      const expr = new Time(new Constant(null))
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)

      expect(Number.isNaN(result)).toBe(true)
    })

    test('converts numeric values to date', () => {
      // Note: Time.ts converts value to string first, so numbers become strings
      // String('1704067200000') is passed to new Date()
      const expr = new Time(new Constant(1704067200000))
      const context = { feature_name: 'test', properties: {} }
      const result = expr.evaluate(context)

      // Should convert milliseconds to seconds
      expect(result).toBe(1704067200)
    })

    test('parses dates in different years', () => {
      const dates = [
        { date: '2020-01-01T00:00:00Z', expected: 1577836800 },
        { date: '2021-01-01T00:00:00Z', expected: 1609459200 },
        { date: '2022-01-01T00:00:00Z', expected: 1640995200 },
        { date: '2023-01-01T00:00:00Z', expected: 1672531200 },
        { date: '2024-01-01T00:00:00Z', expected: 1704067200 }
      ]

      const context = { feature_name: 'test', properties: {} }

      for (const { date, expected } of dates) {
        const expr = new Time(new Constant(date))
        const result = expr.evaluate(context)
        expect(result).toBe(expected)
      }
    })
  })

  describe('value', () => {
    test('returns object notation', () => {
      const expr = new Time(new Constant('2024-01-01T00:00:00Z'))
      expect(expr.value()).toEqual({
        Time: '2024-01-01T00:00:00Z'
      })
    })

    test('preserves nested expression structure', () => {
      const expr = new Time(new Property('timestamp'))
      expect(expr.value()).toEqual({
        Time: { Property: 'timestamp' }
      })
    })
  })

  describe('equals', () => {
    test('returns true for same argument', () => {
      const expr1 = new Time(new Constant('2024-01-01T00:00:00Z'))
      const expr2 = new Time(new Constant('2024-01-01T00:00:00Z'))
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different arguments', () => {
      const expr1 = new Time(new Constant('2024-01-01T00:00:00Z'))
      const expr2 = new Time(new Constant('2024-01-02T00:00:00Z'))
      expect(expr1.equals(expr2)).toBe(false)
    })

    test('returns false for non-Time values', () => {
      const expr = new Time(new Constant('2024-01-01T00:00:00Z'))
      expect(expr.equals(1704067200)).toBe(false)
      expect(expr.equals({ Time: '2024-01-01T00:00:00Z' })).toBe(false)
    })
  })
})
