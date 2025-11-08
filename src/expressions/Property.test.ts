import Property from './Property'
import Constant from './Constant'
import { buildExpression } from './index'

describe('Property', () => {
  describe('constructor', () => {
    test('accepts expression argument', () => {
      const expr = new Property(new Constant('plan'))
      const context = { feature_name: 'test', properties: { plan: 'enterprise' } }
      expect(expr.evaluate(context)).toBe('enterprise')
    })

    test('accepts string directly via buildExpression', () => {
      const expr = buildExpression({ Property: 'plan' }) as Property
      const context = { feature_name: 'test', properties: { plan: 'enterprise' } }
      expect(expr.evaluate(context)).toBe('enterprise')
    })

    test('accepts expression object via buildExpression', () => {
      const expr = buildExpression({
        Property: { Constant: 'plan' }
      }) as Property
      const context = { feature_name: 'test', properties: { plan: 'enterprise' } }
      expect(expr.evaluate(context)).toBe('enterprise')
    })
  })

  describe('evaluate', () => {
    test('accesses string property', () => {
      const expr = new Property(new Constant('name'))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { name: 'Alice' }
      })
      expect(result).toBe('Alice')
    })

    test('accesses number property', () => {
      const expr = new Property(new Constant('age'))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { age: 30 }
      })
      expect(result).toBe(30)
    })

    test('accesses boolean property', () => {
      const expr = new Property(new Constant('admin'))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { admin: true }
      })
      expect(result).toBe(true)
    })

    test('accesses array property', () => {
      const expr = new Property(new Constant('tags'))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { tags: ['tag1', 'tag2', 'tag3'] }
      })
      expect(result).toEqual(['tag1', 'tag2', 'tag3'])
    })

    test('accesses object property', () => {
      const expr = new Property(new Constant('metadata'))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { metadata: { key: 'value' } }
      })
      expect(result).toEqual({ key: 'value' })
    })

    test('returns undefined for missing property', () => {
      const expr = new Property(new Constant('missing'))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: {}
      })
      expect(result).toBeUndefined()
    })

    test('returns undefined for property not in properties object', () => {
      const expr = new Property(new Constant('other'))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { name: 'Alice' }
      })
      expect(result).toBeUndefined()
    })

    test('accesses property with snake_case name', () => {
      const expr = new Property(new Constant('account_age_days'))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { account_age_days: 45 }
      })
      expect(result).toBe(45)
    })

    test('accesses property with camelCase name', () => {
      const expr = new Property(new Constant('accountAgeDays'))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { accountAgeDays: 45 }
      })
      expect(result).toBe(45)
    })

    test('accesses property with hyphenated name', () => {
      const expr = new Property(new Constant('account-age'))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { 'account-age': 45 }
      })
      expect(result).toBe(45)
    })

    test('accesses property with numeric name', () => {
      const expr = new Property(new Constant(123))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { '123': 'numeric key' }
      })
      expect(result).toBe('numeric key')
    })

    test('can access property that is null', () => {
      const expr = new Property(new Constant('value'))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { value: null }
      })
      expect(result).toBeNull()
    })

    test('can access property that is 0', () => {
      const expr = new Property(new Constant('count'))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { count: 0 }
      })
      expect(result).toBe(0)
    })

    test('can access property that is false', () => {
      const expr = new Property(new Constant('active'))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { active: false }
      })
      expect(result).toBe(false)
    })

    test('can access property that is empty string', () => {
      const expr = new Property(new Constant('name'))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { name: '' }
      })
      expect(result).toBe('')
    })

    test('handles empty property name as empty string key', () => {
      const expr = new Property(new Constant(''))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { '': 'empty key value' }
      })
      expect(result).toBe('empty key value')
    })

    test('uses property name from nested expression', () => {
      const keyExpr = new Property(new Constant('key_name'))
      const expr = new Property(keyExpr)

      const result = expr.evaluate({
        feature_name: 'test',
        properties: {
          key_name: 'actual_key',
          actual_key: 'nested value'
        }
      })

      expect(result).toBe('nested value')
    })

    test('does not access feature_name', () => {
      const expr = new Property(new Constant('feature_name'))
      const result = expr.evaluate({
        feature_name: 'my_feature',
        properties: {}
      })
      // Should not access feature_name from context, only from properties
      expect(result).toBeUndefined()
    })

    test('can access feature_name if it is in properties', () => {
      const expr = new Property(new Constant('feature_name'))
      const result = expr.evaluate({
        feature_name: 'my_feature',
        properties: { feature_name: 'copied_feature_name' }
      })
      expect(result).toBe('copied_feature_name')
    })

    test('handles special characters in property names', () => {
      const specialNames = ['prop.with.dots', 'prop[with]brackets', 'prop:with:colons', 'prop with spaces']

      const properties: Record<string, string> = {}
      specialNames.forEach(name => {
        properties[name] = `value for ${name}`
      })

      specialNames.forEach(name => {
        const expr = new Property(new Constant(name))
        const result = expr.evaluate({
          feature_name: 'test',
          properties
        })
        expect(result).toBe(`value for ${name}`)
      })
    })

    test('handles unicode property names', () => {
      const expr = new Property(new Constant('😀'))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { '😀': 'emoji value' }
      })
      expect(result).toBe('emoji value')
    })

    test('accesses deeply nested data when stored as property', () => {
      const expr = new Property(new Constant('user'))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: {
          user: {
            name: 'Alice',
            age: 30,
            roles: ['admin', 'user']
          }
        }
      })
      expect(result).toEqual({
        name: 'Alice',
        age: 30,
        roles: ['admin', 'user']
      })
    })

    test('property name conversion handles non-string types', () => {
      const expr = new Property(new Constant(true))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: { 'true': 'boolean key' }
      })
      // Boolean true doesn't convert to 'true' with typeof check in Property.ts
      // It will be an empty string, so property won't be found
      expect(result).toBeUndefined()
    })

    test('handles null property name', () => {
      const expr = new Property(new Constant(null))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: {}
      })
      // null converts to empty string
      expect(result).toBeUndefined()
    })

    test('handles undefined property name', () => {
      const expr = new Property(new Constant(undefined))
      const result = expr.evaluate({
        feature_name: 'test',
        properties: {}
      })
      // undefined converts to empty string
      expect(result).toBeUndefined()
    })
  })

  describe('value', () => {
    test('returns object notation with string', () => {
      const expr = new Property(new Constant('plan'))
      expect(expr.value()).toEqual({
        Property: 'plan'
      })
    })

    test('returns object notation with nested expression', () => {
      const expr = new Property(new Property('key'))
      expect(expr.value()).toEqual({
        Property: { Property: 'key' }
      })
    })

    test('returns object notation with number', () => {
      const expr = new Property(new Constant(123))
      expect(expr.value()).toEqual({
        Property: 123
      })
    })
  })

  describe('equals', () => {
    test('returns true for same property name', () => {
      const expr1 = new Property(new Constant('plan'))
      const expr2 = new Property(new Constant('plan'))
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different property names', () => {
      const expr1 = new Property(new Constant('plan'))
      const expr2 = new Property(new Constant('role'))
      expect(expr1.equals(expr2)).toBe(false)
    })

    test('returns false for non-Property values', () => {
      const expr = new Property(new Constant('plan'))
      expect(expr.equals('plan')).toBe(false)
      expect(expr.equals({ Property: 'plan' })).toBe(false)
    })

    test('returns true for nested expression equality', () => {
      const expr1 = new Property(new Property('key'))
      const expr2 = new Property(new Property('key'))
      expect(expr1.equals(expr2)).toBe(true)
    })

    test('returns false for different nested expressions', () => {
      const expr1 = new Property(new Property('key1'))
      const expr2 = new Property(new Property('key2'))
      expect(expr1.equals(expr2)).toBe(false)
    })
  })
})
