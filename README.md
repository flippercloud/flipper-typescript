[![Flipper Mark](https://raw.githubusercontent.com/flippercloud/flipper/main/docs/images/banner.jpg)](https://www.flippercloud.io)

[Website](https://flippercloud.io?utm_source=oss&utm_medium=readme&utm_campaign=website_link) | [Documentation](https://flippercloud.io/docs?utm_source=oss&utm_medium=readme&utm_campaign=docs_link) | [Chat](https://chat.flippercloud.io/join/xjHq-aJsA-BeZH) | [Twitter](https://twitter.com/flipper_cloud) | [Ruby.social](https://ruby.social/@flipper)

# Flipper TypeScript

> Beautiful, performant feature flags for TypeScript and JavaScript.

Flipper gives you control over who has access to features in your app.

- Enable or disable features for everyone, specific actors, groups of actors, a percentage of actors, or a percentage of time.
- Configure your feature flags programmatically or export/import feature state.
- Use expressions for advanced feature targeting logic.
- Performant in-memory adapter with support for custom storage adapters.
- Adapter wrappers for memoization, read-only mode, strict mode, dual-write, and operation logging.

Control your software &mdash; don't let it control you.

## Installation

Install the package:

```bash
bun add @flippercloud/flipper
```

## Getting Started

Use `flipper.isFeatureEnabled()` in your app to check if a feature is enabled.

```typescript
import { Flipper, MemoryAdapter } from '@flippercloud/flipper';

const adapter = new MemoryAdapter();
const flipper = new Flipper(adapter);

// Check if search is enabled
if (await flipper.isFeatureEnabled('search', currentUser)) {
  console.log('Search away!');
} else {
  console.log('No search for you!');
}
```

All features are disabled by default, so you'll need to explicitly enable them.

```typescript
// Enable a feature for everyone
await flipper.enable('search');

// Enable a feature for a specific actor
await flipper.enableActor('search', currentUser);

// Enable a feature for a group of actors
await flipper.enableGroup('search', 'admin');

// Enable a feature for a percentage of actors
await flipper.enablePercentageOfActors('search', 25);
```

Read more about [getting started with Flipper](docs/QUICK_REFERENCE.md) and see the [Quick Reference](docs/QUICK_REFERENCE.md) for the full API.

## Contributing

For development setup and scripts, see the [Quick Reference](docs/QUICK_REFERENCE.md).

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Run the tests (`bun test`)
4. Commit your changes (`git commit -am 'Added some feature'`)
5. Push to the branch (`git push origin my-new-feature`)
6. Create new Pull Request

## Brought To You By

| pic | @mention | area |
| --- | -------- | ---- |
| ![@jonmagic](https://avatars.githubusercontent.com/u/623?s=64) | [@jonmagic](https://github.com/jonmagic) | TypeScript implementation |
