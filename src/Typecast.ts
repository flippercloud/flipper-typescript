class Typecast {
  public static toBoolean(value: unknown): boolean {
    if (value === true || value === 1 || value === 'true' || value === '1') {
      return true
    }
    return false
  }

  public static toSet(value: unknown): Set<string> {
    if (value instanceof Set) {
      return new Set(Array.from(value).map(String))
    }
    if (Array.isArray(value)) {
      return new Set(value.map(String))
    }
    return new Set()
  }

  public static toNumber(value: unknown): number {
    if (typeof value === 'number') { return value }
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }
}

export default Typecast
