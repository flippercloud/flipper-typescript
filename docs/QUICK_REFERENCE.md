# Monorepo Quick Reference

## Common Commands

### From Repository Root

```bash
# Install all dependencies
bun install

# Build all packages
bun run build

# Test all packages
bun test

# Test with coverage
bun run test:coverage

# Lint all packages
bun run lint

# Fix linting issues
bun run lint:fix

# Type check all packages
bun run type-check

# Format all code
bun run format

# Clean all build artifacts
bun run clean
```

### Working with Specific Packages

```bash
# Build a specific package
bun run build -w @flippercloud/flipper

# Test a specific package
bun run test -w @flippercloud/flipper

# Watch tests in a package
bun run test:watch -w @flippercloud/flipper

# Lint a specific package
bun run lint -w @flippercloud/flipper
```

### Package Management

```bash
# Add a dependency to a specific package
bun install <package> -w @flippercloud/flipper

# Add a dev dependency to a specific package
bun install -D <package> -w @flippercloud/flipper

# Add a workspace dependency (use another package in the monorepo)
# In the package.json, add:
# "dependencies": { "@flippercloud/flipper": "workspace:*" }
```

## Directory Structure

```
flipper-typescript/
├── packages/                      # All packages live here
│   ├── flipper/                  # @flippercloud/flipper
│   │   ├── src/                  # Source code
│   │   ├── dist/                 # Built output (gitignored)
│   │   ├── coverage/             # Test coverage (gitignored)
│   │   ├── package.json          # Package config
│   │   ├── tsconfig.json         # TS config (extends base)
│   │   ├── jest.config.ts        # Jest config
│   │   └── eslint.config.js      # ESLint config
│   └── (future packages...)
├── docs/                          # Documentation
├── package.json                   # Monorepo root config
├── tsconfig.base.json            # Shared TypeScript config
├── eslint.config.js              # Root ESLint config
├── .prettierrc.json              # Prettier config
└── .gitignore                    # Git ignore rules
```

## Package Naming Convention

- Main package: `@flippercloud/flipper`
- Future packages: `@flippercloud/redis`, `@flippercloud/sequelize`, etc.
- All packages use the `@flippercloud/` scope

## Key Features

✅ **bun workspaces** - Native monorepo support
✅ **Shared configuration** - Base configs extended by packages
✅ **Scoped packages** - Professional namespace
✅ **Independent versioning** - Each package versions separately
✅ **Efficient installs** - Single node_modules at root
✅ **Cross-package dependencies** - Use `workspace:*` protocol

## Adding New Packages

See `docs/ADDING_PACKAGES.md` for detailed instructions.

Quick version:
1. Create `packages/your-package/`
2. Copy structure from `packages/flipper/`
3. Update package.json with new name
4. Run `bun install` from root

## Publishing Packages

```bash
# From within a package directory
cd packages/your-package
bun publish
```

Each package publishes independently to bun.

## Useful Package Manager Features

```bash
# List all workspaces
bun ls --workspaces

# Run a command in all workspaces
bun run <script> --workspaces

# Run only if the script exists
bun run <script> --workspaces --if-present
```

## Troubleshooting

### "Module not found" errors
```bash
bun install  # Re-install from root
```

### Build issues
```bash
bun run clean  # Clean all build artifacts
bun run build  # Rebuild everything
```

### Test issues
```bash
# Make sure you built first
bun run build
bun test
```

## Related Documentation

- [README.md](../README.md) - Main documentation
- [ADDING_PACKAGES.md](./ADDING_PACKAGES.md) - Guide for new packages
- [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) - Migration details
