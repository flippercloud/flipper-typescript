# @flippercloud/flipper

## 1.0.2

### Patch Changes

- 4c3298f: Update README.md for each package to standardize on same structure and style as @flippercloud/flipper-sequelize README.md

## 1.0.1

### Fixed

- Ruby parity: gate precedence now matches Ruby (boolean → expression → actor → percentage of actors → percentage of time → group).
- Ruby parity: expressions now evaluate against actor `flipperProperties` (instead of losing properties due to pre-wrapping).
- Ruby parity: percentage-of-actors bucketing now matches Ruby semantics (CRC32 + scaling factor) and supports up to 3 decimal places.
- `disableExpression()` now disables only the expression gate (no longer clears unrelated gate values).
- Memory adapter: disabling numeric gates (percentage-of-actors / percentage-of-time) no longer clears other gate values.
- Ruby parity: actor/group gates treat missing/invalid actor ids as closed (no more literal `'undefined'` string checks).

## 1.0.0

Initial release of Flipper feature flags for TypeScript/JavaScript.

### Features

- Feature flag evaluation engine
- Support for actors, groups, percentages, and expressions
- Memory adapter for development
- TypeScript support with full type safety
