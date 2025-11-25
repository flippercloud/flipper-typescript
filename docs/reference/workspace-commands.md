# Workspace Command Reference

Use these commands from the repository root unless noted otherwise.

## Install Dependencies

```bash
bun install
```

## Build Packages

```bash
# Build every workspace serially
bun run build

# Build a single workspace
bun run build -w @flippercloud/flipper
```

The build script delegates to each workspace's `build` command using `bun --workspaces run` under the hood.

## Test Packages

```bash
# Run package-level tests invoked by the repo script
bun run test

# Run coverage for the same set of packages
bun run test:coverage

# Target an individual workspace
bun run test -w @flippercloud/flipper
```

> **Note:** The top-level `test` script currently executes `@flippercloud/flipper` and `@flippercloud/flipper-sequelize`. When you add new packages, update the script so CI exercises them too.

## Lint, Type-Check, and Format

```bash
bun run lint
bun run lint:fix
bun run type-check
bun run format
bun run format:check
```

Each command runs across all workspaces, ensuring shared standards.

## Clean Artifacts

```bash
bun run clean
```

This removes `dist/` and `coverage/` directories from every workspace.

## Workspace Utilities

```bash
# List all workspaces declared in package.json
bun ls --workspaces

# Run a script across every workspace that defines it
bun run <script> --workspaces --if-present
```

## Troubleshooting

| Issue | Try |
| --- | --- |
| Missing modules | `bun install` |
| Stale build output | `bun run clean && bun run build` |
| Hanging tests | Ensure you built first, then run `bun run test -w <pkg>` |

## Related Guides

- [Getting started guide](../guides/getting-started.md)
- [Create a new package](../how-to/create-package.md)
- [Documentation upkeep checklist](../contributing/documentation.md)
