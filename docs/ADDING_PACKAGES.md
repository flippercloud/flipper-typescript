# Adding a New Package Template

This guide helps you create a new package in the monorepo.

## Quick Start

### 1. Create Package Directory

```bash
mkdir -p packages/your-package-name/src
```

### 2. Create package.json

Create `packages/your-package-name/package.json`:

```json
{
  "name": "@flippercloud/your-package-name",
  "description": "Brief description of your package",
  "version": "0.0.1",
  "author": "Jonathan Hoyt",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "test": "node --experimental-vm-modules ../../node_modules/jest/bin/jest.js",
    "test:watch": "bun test -- --watch",
    "test:coverage": "bun test -- --coverage",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,md}\"",
    "clean": "node -e \"try { require('fs').rmSync('dist', {recursive:true, force:true}); require('fs').rmSync('coverage', {recursive:true, force:true}); } catch(e) {}\"",
    "prepublishOnly": "bun run clean && bun run build && bun test"
  },
  "dependencies": {
    "@flippercloud/flipper": "workspace:*"
  },
  "devDependencies": {},
  "engines": {
    "node": ">=18.0.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### 3. Create tsconfig.json

Create `packages/your-package-name/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 4. Create jest.config.ts

Create `packages/your-package-name/jest.config.ts`:

```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
    }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
}

export default config
```

### 5. Copy ESLint Config

```bash
cp packages/flipper/eslint.config.js packages/your-package-name/
```

### 6. Create README.md

Create `packages/your-package-name/README.md` with package-specific documentation.

### 7. Create Source Files

Create your source files in `packages/your-package-name/src/`:

- `src/index.ts` - Main entry point
- `src/index.test.ts` - Tests
- Additional files as needed

### 8. Install Dependencies

From the repository root:

```bash
bun install
```

### 9. Build and Test

```bash
bun run build -w @flippercloud/your-package-name
bun run test -w @flippercloud/your-package-name
```

## Example Package Structure

```
packages/your-package-name/
├── README.md
├── eslint.config.js
├── jest.config.ts
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── index.test.ts
    └── ... (additional source files)
```

## Tips

- **Dependencies**: Use `workspace:*` for internal package dependencies
- **Naming**: Follow the `@flippercloud/` scoping convention
- **Testing**: Write tests alongside your code with `.test.ts` suffix
- **Types**: Export all public types from your main `index.ts`
- **Documentation**: Keep the README up to date with usage examples

## Common Packages to Add

- `@flippercloud/redis` - Redis adapter
- `@flippercloud/sequelize` - Sequelize adapter
