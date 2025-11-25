# Documentation Upkeep Checklist

Use this checklist whenever you introduce, modify, or remove functionality. It keeps the documentation aligned with the codebase.

## Before Opening a PR

- [ ] Identify which docs are impacted (guides, references, how-tos, README, examples).
- [ ] Update or create the relevant pages under `docs/`.
- [ ] Note breaking changes, migration steps, or new capabilities in the release notes draft.
- [ ] Ensure code snippets compile (add or update tests/examples when possible).

## During Review

- Flag the docs diff in your PR description so reviewers know where to focus.
- Ask for at least one reviewer who is familiar with the doc section you edited.
- Confirm that links between pages remain valid (run `npm run lint:links` if introduced in the future).

## Before Merging

- [ ] Tick the documentation checkbox in the PR template.
- [ ] Verify CI executed the relevant tests/examples for any runnable snippets.
- [ ] If documentation work is deferred, create a follow-up issue tagged `docs` and link it in the PR.

## Writing Tips

- Prefer task-based headings ("Enable percentage rollout") over conceptual ones.
- Keep sections short and scannable; use tables for structured data.
- Include copy-paste ready commands.
- Reference related pages using relative links (e.g., `../reference/workspace-commands.md`).

For questions or larger documentation strategy conversations, start a thread in `#flipper-docs` or open a GitHub Discussion.
