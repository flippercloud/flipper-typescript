import Duration from './Duration'
import Constant from './Constant'
import Property from './Property'
import { buildExpression } from './index'

describe('Duration', () => {
  describe('constructor', () => {
    test('accepts two expression arguments', () => {
      const expr = new Duration(
        new Constant(5),
        new Constant('minutes')
      )
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(300)
    })

    test('accepts expression objects via buildExpression', () => {
      const expr = buildExpression({
        Duration: [{ Constant: 5 }, { Constant: 'minutes' }]
      }) as Duration
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(300)
    })
  })

  describe('evaluate', () => {
    test('converts seconds', () => {
      const expr = new Duration(new Constant(30), new Constant('second'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(30)
    })

    test('converts seconds with plural', () => {
      const expr = new Duration(new Constant(30), new Constant('seconds'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(30)
    })

    test('converts minutes', () => {
      const expr = new Duration(new Constant(5), new Constant('minute'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(300)
    })

    test('converts minutes with plural', () => {
      const expr = new Duration(new Constant(5), new Constant('minutes'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(300)
    })

    test('converts hours', () => {
      const expr = new Duration(new Constant(2), new Constant('hour'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(7200)
    })

    test('converts hours with plural', () => {
      const expr = new Duration(new Constant(2), new Constant('hours'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(7200)
    })

    test('converts days', () => {
      const expr = new Duration(new Constant(1), new Constant('day'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(86400)
    })

    test('converts days with plural', () => {
      const expr = new Duration(new Constant(7), new Constant('days'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(604800)
    })

    test('converts weeks', () => {
      const expr = new Duration(new Constant(1), new Constant('week'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(604800)
    })

    test('converts weeks with plural', () => {
      const expr = new Duration(new Constant(2), new Constant('weeks'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(1209600)
    })

    test('converts months', () => {
      const expr = new Duration(new Constant(1), new Constant('month'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(2629746)
    })

    test('converts months with plural', () => {
      const expr = new Duration(new Constant(3), new Constant('months'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(7889238)
    })

    test('converts years', () => {
      const expr = new Duration(new Constant(1), new Constant('year'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(31556952)
    })

    test('converts years with plural', () => {
      const expr = new Duration(new Constant(2), new Constant('years'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(63113904)
    })

    test('handles decimal values', () => {
      const expr = new Duration(new Constant(1.5), new Constant('hours'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(5400)
    })

    test('handles zero duration', () => {
      const expr = new Duration(new Constant(0), new Constant('days'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(0)
    })

    test('handles negative duration', () => {
      const expr = new Duration(new Constant(-5), new Constant('minutes'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(-300)
    })

    test('handles case-insensitive units', () => {
      const units = ['SECOND', 'Second', 'SECONDS', 'Seconds']
      const context = { feature_name: 'test', properties: {} }

      for (const unit of units) {
        const expr = new Duration(new Constant(10), new Constant(unit))
        expect(expr.evaluate(context)).toBe(10)
      }
    })

    test('works with property expressions', () => {
      const expr = new Duration(
        new Property('duration'),
        new Constant('minutes')
      )

      const result = expr.evaluate({
        feature_name: 'test',
        properties: { duration: 30 }
      })

      expect(result).toBe(1800)
    })

    test('works with property for unit', () => {
      const expr = new Duration(
        new Constant(5),
        new Property('time_unit')
      )

      const result = expr.evaluate({
        feature_name: 'test',
        properties: { time_unit: 'hours' }
      })

      expect(result).toBe(18000)
    })

    test('throws error for invalid unit', () => {
      const expr = new Duration(new Constant(5), new Constant('fortnights'))
      const context = { feature_name: 'test', properties: {} }

      expect(() => expr.evaluate(context)).toThrow(/Duration unit fortnight must be one of/)
    })

    test('throws error for NaN scalar', () => {
      const expr = new Duration(new Constant('not a number'), new Constant('seconds'))
      const context = { feature_name: 'test', properties: {} }

      expect(() => expr.evaluate(context)).toThrow(/Duration value must be a number/)
    })

    test('returns 0 for null scalar', () => {
      const expr = new Duration(new Constant(null), new Constant('seconds'))
      const context = { feature_name: 'test', properties: {} }

      // Number(null) = 0, which is a valid number
      expect(expr.evaluate(context)).toBe(0)
    })

    test('converts string numbers', () => {
      const expr = new Duration(new Constant('10'), new Constant('minutes'))
      const context = { feature_name: 'test', properties: {} }
      expect(expr.evaluate(context)).toBe(600)
    })

    test('calculates complex durations', () => {
      const testCases = [
        { scalar: 1, unit: 'second', expected: 1 },
        { scalar: 1, unit: 'minute', expected: 60 },
        { scalar: 1, unit: 'hour', expected: 3600 },
        { scalar: 1, unit: 'day', expected: 86400 },
        { scalar: 1, unit: 'week', expected: 604800 },
        { scalar: 24, unit: 'hour', expected: 86400 },
        { scalar: 60, unit: 'minute', expected: 3600 },
        { scalar: 48, unit: 'hour', expected: 172800 }
      ]

      const context = { feature_name: 'test', properties: {} }

      for (const { scalar, unit, expected } of testCases) {
        const expr = new Duration(new Constant(scalar), new Constant(unit))
        expect(expr.evaluate(context)).toBe(expected)
      }
    })
  })

  describe('value', () => {
    test('returns object notation', () => {
      const expr = new Duration(
        new Constant(5),
        new Constant('minutes')
      )
      expect(expr.value()).toEqual({
        Duration: [5, 'minutes']
      })
    })

    test('preserves nested expression structure', () => {
      const expr = new Duration(
        new Property('duration'),
        new Constant('hours')
      )
      expect(expr.value()).toEqual({
        Duration: [
          { Property: 'duration' },
          'hours'
        ]
      })
    })
  })

  describe('equals', () => {
    test('returns true for same arguments', () => {
      const expr1 = new Duration(new Constant(5), new Constant('minutes'))
      const expr2 = new Duration(new Constant(5), new Constant('minutes'))
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different scalar', () => {
      const expr1 = new Duration(new Constant(5), new Constant('minutes'))
      const expr2 = new Duration(new Constant(10), new Constant('minutes'))
      expect(expr1.equals(expr2)).toBe(false)
    })

    test('returns false for different unit', () => {
      const expr1 = new Duration(new Constant(5), new Constant('minutes'))
      const expr2 = new Duration(new Constant(5), new Constant('hours'))
      expect(expr1.equals(expr2)).toBe(false)
    })

    test('returns false for non-Duration values', () => {
      const expr = new Duration(new Constant(5), new Constant('minutes'))
      expect(expr.equals(300)).toBe(false)
      expect(expr.equals({ Duration: [5, 'minutes'] })).toBe(false)
    })
  })
})
