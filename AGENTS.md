# AGENTS.md

Flipper TypeScript is a monorepo using Bun workspaces. This document contains build steps, test commands, and conventions for coding agents working on this project.

## Setup commands

- Install dependencies: `bun install`
- Build all packages: `bun run build`
- Build specific package: `bun run build --filter @flippercloud/flipper`
- Run dev server: N/A (library project)
- Run tests: `bun test`
- Run tests for specific package: `bun run test --filter @flippercloud/flipper`
- Watch tests: `bun run test:watch --filter @flippercloud/flipper`
- Test with coverage: `bun run test:coverage`
- Type check: `bun run type-check`
- Lint code: `bun run lint`
- Fix linting: `bun run lint:fix`
- Format code: `bun run format`
- Clean build artifacts: `bun run clean`

## Project structure

```
flipper-typescript/
├── packages/
│   └── flipper/                  # @flippercloud/flipper
│       ├── src/                  # Source code
│       ├── __tests__/            # Test files
│       ├── package.json
│       ├── tsconfig.json
│       ├── jest.config.ts
│       └── eslint.config.js
├── docs/                         # Documentation
├── package.json                  # Root workspace config
├── tsconfig.base.json           # Base TypeScript config
├── eslint.config.js             # Root ESLint config
└── .prettierrc.json             # Code formatting rules
```

## Code style

- TypeScript with strict mode enabled
- Use type annotations for all function parameters and return types
- Single quotes for strings
- No semicolons
- Functional patterns preferred
- Follow ESLint config in `eslint.config.js`
- Use Prettier for formatting (`.prettierrc.json`)

## Testing instructions

- Run all tests: `bun test`
- Run tests for a specific package: `bun run test --filter @flippercloud/flipper`
- Watch tests: `bun run test:watch --filter @flippercloud/flipper`
- Run tests with coverage: `bun run test:coverage`
- Run specific test: `bun run test --filter @flippercloud/flipper -- --testNamePattern="test name"`
- Always run the full test suite before committing: `bun test`
- Write tests in `__tests__/` directories alongside source code
- Aim for good test coverage for new functionality
- Use Jest for testing (configured in `jest.config.ts`)

## Linting and type checking

- Lint all packages: `bun run lint`
- Lint specific package: `bun run lint --filter @flippercloud/flipper`
- Fix linting issues: `bun run lint:fix`
- Type check all: `bun run type-check`
- Format code: `bun run format`
- All code must pass linting before commit

## Key concepts for agents

This is a feature flag library with these core concepts:

- **Features**: Named flags that can be toggled on/off
- **Actors**: Entities (users, etc.) that features can be enabled/disabled for
- **Gates**: Rules determining feature enablement:
  - Boolean: enabled for all or none
  - Actor: enabled for specific actors
  - Group: enabled for actor groups
  - Percentage: enabled for % of actors or time
- **Adapters**: Storage backends for feature state
- **Expressions**: Advanced targeting logic

See [README.md](./README.md) and [docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md) for more details.

## Monorepo conventions

- **Workspaces**: This monorepo uses Bun workspaces (`--filter` flag to run in specific packages)
- **Package naming**: All packages use `@flippercloud/` scope (e.g., `@flippercloud/flipper`)
- **Internal dependencies**: Use `workspace:*` protocol for cross-package dependencies (e.g., in an adapter package: `"@flippercloud/flipper": "workspace:*"`)
  - During development: imports use the local version automatically via symlinks
  - When published: bun converts `workspace:*` to the actual published version (e.g., `^1.0.0`)
- **Configuration**: Base configs in root; packages extend them
- **Independent versioning**: Each package versions separately

## Creating a new package

When adding a new package (e.g., adapters, exporters):

1. See [docs/ADDING_PACKAGES.md](./docs/ADDING_PACKAGES.md) for the complete template and structure
2. Use the template in that file as your starting point
3. For adapter packages that depend on flipper, use `"@flippercloud/flipper": "workspace:*"` in dependencies
4. After creating the package structure, run `bun install` from the root to register the workspace
- Verify with `bun ls --workspaces` to see all packages

## PR instructions

- Title format: `[package-name] Brief description` (e.g., `[flipper] Add expression gate support`)
- Base PRs on the `main` branch
- Include two required sections in the PR body with these exact headings:
  ```
  ## Why?
  Explain the problem that needs solved or feature that needs added

  ## How?
  Describe the implementation approach and any key changes
  ```
- Reference the related issue in the PR body
- Always run `bun test` and `bun run lint` before committing
- Ensure all CI checks pass
