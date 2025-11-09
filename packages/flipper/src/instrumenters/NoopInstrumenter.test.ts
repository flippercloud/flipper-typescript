import NoopInstrumenter from './NoopInstrumenter'

describe('NoopInstrumenter', () => {
  let instrumenter: NoopInstrumenter

  beforeEach(() => {
    instrumenter = new NoopInstrumenter()
  })

  describe('instrument', () => {
    it('executes the function', () => {
      const result = instrumenter.instrument('test', {}, () => 'result')
      expect(result).toBe('result')
    })

    it('passes payload to the function', () => {
      const payload = { feature_name: 'test_feature' }
      void instrumenter.instrument('test', payload, (p) => {
        expect(p).toBe(payload)
      })
    })

    it('returns the result of the function', () => {
      const result = instrumenter.instrument('test', {}, () => 42)
      expect(result).toBe(42)
    })

    it('allows function to modify payload', () => {
      const payload: { feature_name: string; result?: string } = { feature_name: 'test' }
      void instrumenter.instrument('test', payload, (p) => {
        p.result = 'modified'
      })
      expect(payload.result).toBe('modified')
    })

    it('handles functions that return objects', () => {
      const result = instrumenter.instrument('test', {}, () => ({ key: 'value' }))
      expect(result).toEqual({ key: 'value' })
    })

    it('handles functions that return undefined', () => {
      const result = instrumenter.instrument('test', {}, () => undefined)
      expect(result).toBeUndefined()
    })

    it('propagates errors from the function', () => {
      expect(() => {
        void instrumenter.instrument('test', {}, () => {
          throw new Error('test error')
        })
      }).toThrow('test error')
    })
  })
})
