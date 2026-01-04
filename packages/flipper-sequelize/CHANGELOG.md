# @flippercloud/flipper-sequelize

## 1.0.1 (2025-12-31)

### Fixes

- Normalize percentage gate storage to snake_case and read both snake_case/camelCase, keeping rollouts set by Ruby and TypeScript in sync and visible in the UI.
- Added regression coverage to ensure Sequelize reads existing snake_case gates and writes the canonical form going forward.

## 1.0.0

Initial release of Sequelize adapter for Flipper feature flags.

### Features

- Sequelize adapter for relational databases
- Support for SQLite, PostgreSQL, MySQL, and other Sequelize-supported databases
- Full feature flag management through database
