# How to Create a New Package

Use this playbook whenever you add a package to the monorepo. Following these steps keeps builds, tests, and documentation aligned across workspaces.

## 1. Scaffold the Package Directory

```bash
mkdir -p packages/your-package-name/src
```

Copy over any shared assets (README, LICENSE, etc.) from an existing package such as `packages/flipper/`.

## 2. package.json

Create `packages/your-package-name/package.json`:

```json
{
  "name": "@flippercloud/your-package-name",
  "description": "Brief description of your package",
  "version": "0.0.1",
  "author": "Jonathan Hoyt",
  "license": "MIT",
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/esm/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/esm/index.d.ts",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    }
  },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "bun run build:esm && bun run build:cjs",
    "build:esm": "tsc --module esnext --outDir dist/esm && tsc-esm-fix --target dist/esm --ext .js",
    "build:cjs": "tsc --module commonjs --moduleResolution node --outDir dist/cjs",
    "test": "NODE_OPTIONS='--localstorage-file=/tmp/jest.db' node --experimental-vm-modules --no-warnings=ExperimentalWarning ../../node_modules/jest/bin/jest.js",
    "test:watch": "NODE_OPTIONS='--localstorage-file=/tmp/jest.db' node --experimental-vm-modules --no-warnings=ExperimentalWarning ../../node_modules/jest/bin/jest.js --watch",
    "test:coverage": "NODE_OPTIONS='--localstorage-file=/tmp/jest.db' node --experimental-vm-modules --no-warnings=ExperimentalWarning ../../node_modules/jest/bin/jest.js --coverage",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,md}\"",
    "clean": "node -e \"try { require('fs').rmSync('dist', { recursive: true, force: true }); require('fs').rmSync('coverage', { recursive: true, force: true }); } catch (e) {}\"",
    "prepublishOnly": "bun run clean && bun run build && bun test"
  },
  "dependencies": {
    "@flippercloud/flipper": "workspace:*"
  },
  "devDependencies": {
    "tsc-esm-fix": "^2.20.26"
  },
  "engines": {
    "node": ">=18.0.0",
    "bun": ">=1.3.2"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

Adjust the scripts and dependencies as needed for your package. Keep both `build:esm` and `build:cjs` targets so imports work in any environment.

## 3. tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist/esm",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

If you emit both ESM and CJS builds, point `build:cjs` at a custom `tsconfig.cjs.json` or override CLI flags as shown above.

## 4. jest.config.ts

```ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: [['default', { verbose: false }]],
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  testTimeout: 5000,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
}

export default config
```

## 5. ESLint Config

Copy over the shared configuration:

```bash
cp packages/flipper/eslint.config.js packages/your-package-name/
```

## 6. Source Layout

```
packages/your-package-name/
├── README.md
├── eslint.config.js
├── jest.config.ts
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── index.test.ts
│   └── ...
└── dist/ (generated)
```

Place tests next to the modules they verify and export public types from `src/index.ts`.

## 7. Install Dependencies

Run the install from the repository root so Bun wires up the workspace correctly.

```bash
bun install
```

## 8. Validate the Package

```bash
bun run build -w @flippercloud/your-package-name
bun run test -w @flippercloud/your-package-name
```

If you added new scripts (lint, type-check, etc.) make sure they succeed as well:

```bash
bun run lint -w @flippercloud/your-package-name
bun run type-check -w @flippercloud/your-package-name
```

## 9. Document the Package

- Publish a package-specific README describing usage and API.
- Update [Workspace command reference](../reference/workspace-commands.md) if you add new scripts.
- Mention the package in the release notes when you publish.

## 10. Prepare for Publish

Before releasing, run the prepublish script locally:

```bash
bun run prepublishOnly -w @flippercloud/your-package-name
```

This ensures builds, tests, and lint checks all pass prior to pushing to the registry.
