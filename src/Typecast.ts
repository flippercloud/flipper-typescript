class Typecast {
  public static toBoolean(value) {
    return !!this.truthMap[value]
  }

  public static toSet(value) {
    if (value instanceof Set) { return value }
    return new Set(value)
  }

  public static toNumber(value) {
    return parseInt(value, 10)
  }

  private static truthMap = {
    true: true,
    1: true,
  }
}

export default Typecast
