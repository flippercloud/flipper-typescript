import MemoryInstrumenter from './MemoryInstrumenter'

describe('MemoryInstrumenter', () => {
  let instrumenter: MemoryInstrumenter

  beforeEach(() => {
    instrumenter = new MemoryInstrumenter()
  })

  describe('instrument', () => {
    it('executes the function and records the event', () => {
      const result = instrumenter.instrument('test.operation', { feature_name: 'test' }, (payload) => {
        payload.result = 'done'
        return 'result'
      })

      expect(result).toBe('result')
      expect(instrumenter.events.length).toBe(1)

      const event = instrumenter.events[0]
      expect(event).toBeDefined()
      expect(event!.name).toBe('test.operation')
      expect(event!.payload.feature_name).toBe('test')
      expect(event!.payload.result).toBe('done')
      expect(event!.result).toBe('result')
    })

    it('passes payload to the function', async () => {
      const payload = { feature_name: 'test_feature', operation: 'enable' }
      await instrumenter.instrument('test', payload, (p) => {
        expect(p.feature_name).toBe('test_feature')
        expect(p.operation).toBe('enable')
      })
    })

    it('copies payload to prevent external modifications', async () => {
      const payload: { feature_name: string; result?: unknown } = { feature_name: 'test' }
      await instrumenter.instrument('test', payload, (p) => {
        p.result = 'modified'
      })

      // Original payload should not be modified
      expect(payload.result).toBeUndefined()
      // But recorded event should have the modification
      expect(instrumenter.events[0]?.payload.result).toBe('modified')
    })

    it('records exception information when function throws', async () => {
      const error = new Error('test error')

      await expect(async () => {
        await instrumenter.instrument('test', { feature_name: 'test' }, () => {
          throw error
        })
      }).rejects.toThrow('test error')

      expect(instrumenter.events.length).toBe(1)
      expect(instrumenter.events[0]!.name).toBe('test')
      expect(instrumenter.events[0]!.payload.exception).toEqual(['Error', 'test error'])
      expect(instrumenter.events[0]!.payload.exception_object).toBe(error)
      expect(instrumenter.events[0]!.result).toBeUndefined()
    })

    it('records event even when function throws', async () => {
      try {
        await instrumenter.instrument('test', {}, () => {
          throw new Error('boom')
        })
      } catch {
        // Expected
      }

      expect(instrumenter.events.length).toBe(1)
    })

    it('handles multiple calls', async () => {
      await instrumenter.instrument('op1', {}, () => 1)
      await instrumenter.instrument('op2', {}, () => 2)
      await instrumenter.instrument('op3', {}, () => 3)

      expect(instrumenter.events.length).toBe(3)
      expect(instrumenter.events[0]!.result).toBe(1)
      expect(instrumenter.events[1]!.result).toBe(2)
      expect(instrumenter.events[2]!.result).toBe(3)
    })
  })

  describe('eventsByName', () => {
    beforeEach(async () => {
      await instrumenter.instrument('op1', {}, () => 1)
      await instrumenter.instrument('op2', {}, () => 2)
      await instrumenter.instrument('op1', {}, () => 3)
    })

    it('returns all events with matching name', () => {
      const events = instrumenter.eventsByName('op1')
      expect(events.length).toBe(2)
      expect(events[0]!.result).toBe(1)
      expect(events[1]!.result).toBe(3)
    })

    it('returns empty array for non-existent name', () => {
      const events = instrumenter.eventsByName('non-existent')
      expect(events).toEqual([])
    })
  })

  describe('eventByName', () => {
    beforeEach(async () => {
      await instrumenter.instrument('op1', {}, () => 1)
      await instrumenter.instrument('op2', {}, () => 2)
      await instrumenter.instrument('op1', {}, () => 3)
    })

    it('returns first event with matching name', () => {
      const event = instrumenter.eventByName('op1')
      expect(event).toBeDefined()
      expect(event?.result).toBe(1)
    })

    it('returns undefined for non-existent name', () => {
      const event = instrumenter.eventByName('non-existent')
      expect(event).toBeUndefined()
    })
  })

  describe('count', () => {
    beforeEach(async () => {
      await instrumenter.instrument('op1', {}, () => 1)
      await instrumenter.instrument('op2', {}, () => 2)
      await instrumenter.instrument('op1', {}, () => 3)
    })

    it('returns total count without arguments', () => {
      expect(instrumenter.count()).toBe(3)
    })

    it('returns count for specific name', () => {
      expect(instrumenter.count('op1')).toBe(2)
      expect(instrumenter.count('op2')).toBe(1)
    })

    it('returns 0 for non-existent name', () => {
      expect(instrumenter.count('non-existent')).toBe(0)
    })
  })

  describe('reset', () => {
    it('clears all events', async () => {
      await instrumenter.instrument('op1', {}, () => 1)
      await instrumenter.instrument('op2', {}, () => 2)
      expect(instrumenter.count()).toBe(2)

      instrumenter.reset()

      expect(instrumenter.count()).toBe(0)
      expect(instrumenter.events).toEqual([])
    })
  })
})
