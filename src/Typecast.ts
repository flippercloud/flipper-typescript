class Typecast {
  static  truthMap = {
    'true': true,
    '1': true
  }

  static toBoolean(value) {
    return !!this.truthMap[value]
  }

  static toSet(value) {
    if(value instanceof Set) { return value }
    return new Set(value)
  }

  static toNumber(value) {
    return parseInt(value, 10)
  }
}

export default Typecast
