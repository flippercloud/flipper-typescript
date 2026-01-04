# Gate precedence parity plan (Ruby ↔ TypeScript)

**Project:** `flipper-typescript` (workspace root: `flippercloud/`)

**Goal:** Bring the TypeScript port’s gate precedence + gate semantics into parity with Ruby, following a strict **red → green → refactor** loop.

**Canonical reference:**
- Ruby semantics audit: `../FLIPPER_RUBY_GATE_PRECEDENCE_AUDIT.md`
- Ruby source anchors:
  - `flipper/lib/flipper/feature.rb`
  - `flipper/lib/flipper/gates/*.rb`
  - `flipper/lib/flipper/gate_values.rb`
  - `flipper/lib/flipper/typecast.rb`
- TypeScript anchors:
  - `packages/flipper/src/Feature.ts`
  - `packages/flipper/src/*Gate.ts`
  - `packages/flipper/src/GateValues.ts`
  - `packages/flipper/src/Typecast.ts`

---

## Guiding rules (non-negotiable)

1. **Write failing test(s) first** for each behavioral gap.
   - The PR should show: test fails on current main (or pre-fix commit), then passes after the fix.
2. **One behavior per commit chunk** when practical.
   - Keep the loop tight: Red (tests) → Green (minimal fix) → Refactor (cleanups).
3. **Treat Ruby as canonical** unless we explicitly document an intentional divergence.

---

## Current known gaps (from audit comparison)

These are the mismatches we intend to close, in this recommended order.

### Gap A — Gate evaluation order differs (✅ completed)

**Ruby gate order (highest precedence to lowest):**
`boolean → expression → actor → percentage_of_actors → percentage_of_time → group`

**TypeScript today:**
`boolean → expression → actor → group → percentageOfActors → percentageOfTime`

**Risk:** changes which gate “wins” (short-circuit), changes instrumentation `gate_name`, can change outcomes.

### Gap B — Expression gate cannot see actor properties (✅ completed)

`Feature.isEnabled()` currently wraps the `thing` using `ActorGate.wrap()` before evaluating gates, so `ExpressionGate` receives an `ActorType` wrapper that does **not** expose `flipperProperties`.

**Risk:** expressions that depend on actor properties are effectively evaluated as “no actor” (properties `{}`), diverging from Ruby.

### Gap C — Percentage-of-actors hashing semantics differ (✅ completed)

Ruby:
- supports up to 3 decimal places (scaling factor)
- hashes `feature_name + sorted_join(actor_ids_passed)`

TypeScript:
- hashes `featureName + actorId` (single actor)
- uses integer `% 100` logic; no scaling factor / decimals

**Risk:** rollout membership differs from Ruby; decimals are dropped.

### Gap D — `disableExpression()` clears all gates (✅ completed)

TypeScript `Feature.disableExpression()` calls `adapter.clear(this)` which clears *everything*.

Ruby disables only the expression gate.

### Gap E — Typecasting numbers differs (floats) (✅ completed)

Ruby `Typecast.to_number` parses floats from strings.

TypeScript `Typecast.toNumber` uses `parseInt`, which truncates decimals.

### Gap F — `'undefined'` string checks in gates (✅ completed)

`ActorGate.isOpen` and `GroupGate.isOpen` compare `context.thing === 'undefined'` (string), likely unintended.

### Additional parity fix discovered during execution (✅ completed)

**Numeric gate disabling cleared unrelated gate values** in `MemoryAdapter.disable()` for `number` dataType.

Ruby only disables the specific percentage gate; it does not clear actor/group/other state.

---

## Red → Green → Refactor worklist

Each item below must follow the loop.

### 1) Gate precedence ordering parity (Gap A)

**RED (tests):** Add a test that asserts the *winning gate* matches Ruby ordering.

Suggested tests (Jest):
- When both Group and PercentageOfActors would match, the earlier Ruby gate should win.
- When Actor is enabled and PercentageOfActors is enabled, Actor should win (this is the reported bug symptom).

Implementation notes for tests:
- Use `MemoryAdapter` (or existing test adapter helpers).
- Prefer asserting via instrumentation payload (`gate_name`) if that’s stable, otherwise create scenarios where only precedence changes the outcome.

**GREEN (minimal fix):** Reorder `Feature.gates` in `packages/flipper/src/Feature.ts` to:
`BooleanGate, ExpressionGate, ActorGate, PercentageOfActorsGate, PercentageOfTimeGate, GroupGate`

**REFACTOR:** Ensure any other code that assumes the old order is updated (docs/comments).

### 2) Expression uses actor properties parity (Gap B)

**RED (tests):**
- Given an expression `{ Property: 'admin' }` and an actor with `flipperProperties: { admin: true }`, `feature.isEnabled(actor)` should be true.
- Also verify the negative case (`admin: false`) is false.

**GREEN (minimal fix):**
- Adjust `Feature.isEnabled()` and/or `ExpressionGate.isOpen()` so expression evaluation can access actor properties.

Possible approaches (pick one and lock with tests):
- Don’t pre-wrap the `thing` as `ActorType` for all gates; let each gate decide how to wrap.
- Or, update `ExpressionGate.isOpen()` to unwrap `ActorType` (`(context.thing as ActorType).thing`) when present.

**REFACTOR:** Align `FeatureCheckContext` shape with Ruby’s concept (“actors array” vs “single thing”) if we decide to expand later.

### 3) Percentage-of-actors parity (Gap C)

**RED (tests):**
- Add tests that verify hashing matches Ruby for a set of known inputs.
  - Example: feature name + actor id → expected bucket result.
- Add at least one float percentage test (e.g. 12.5) to ensure decimals are supported.

**GREEN (minimal fix):**
- Implement scaling factor logic in TS gate.
- Decide how to handle multi-actor Ruby semantics:
  - Option A (parity): expand TS `isEnabled` to accept multiple actors (breaking API? likely not desired).
  - Option B (documented divergence): match Ruby for single-actor calls, and explicitly document multi-actor behavior as not supported in TS.

**REFACTOR:** Extract hashing logic to a small pure function with unit tests.

### 4) Disable expression without clearing other gates (Gap D)

**RED (tests):**
- Configure a feature with:
  - actor enabled
  - expression enabled
- Call `disableExpression()`.
- Assert:
  - expression is cleared/disabled
  - actor enablement still remains

**GREEN (minimal fix):**
- Implement expression-only clearing via adapter operations consistent with TS adapter storage format.

**REFACTOR:** Ensure docs/JSDoc match behavior.

### 5) Typecast float support (Gap E)

**RED (tests):**
- `Typecast.toNumber('12.5')` should equal `12.5`.
- Ensure integer strings still parse correctly.

**GREEN (minimal fix):**
- Use `parseFloat` when the string contains a `.` (mirroring Ruby).

**REFACTOR:** Ensure `GateValues` stays consistent and tests cover the main gates.

### 6) Remove `'undefined'` string checks (Gap F)

**RED (tests):**
- Add regression tests ensuring `ActorGate` and `GroupGate` treat an actor with a missing/invalid `flipperId` as "no actor" (Ruby parity).

**GREEN (minimal fix):**
- Remove string comparisons and require a valid actor id before evaluating actor/group gate logic.

**REFACTOR:** Simplify logic to be consistent across gates.

---

## Acceptance criteria

We consider this effort complete when:

- Gate evaluation order in TypeScript matches Ruby ordering.
- Actor enablement correctly takes precedence over percentage-of-actors (and is covered by a test).
- Expression evaluation respects actor properties (covered by tests).
- `disableExpression()` only disables expression (covered by tests).
- Percentage-of-actors hashing behavior matches Ruby *at least* for single-actor usage; multi-actor parity is either implemented or explicitly documented.
- Typecasting behavior matches Ruby for integers and floats.

---

## Notes / open questions

- **Multi-actor semantics:** Ruby supports `enabled?(*actors)` and percentage-of-actors uses a combined hash of actor IDs. TypeScript currently models `isEnabled(thing?: unknown)` as a single “thing”. If we keep TS as single-actor, we should explicitly document this divergence and ensure the hashing behavior is still Ruby-compatible for the common single-actor case.
