# @flippercloud/flipper-cloud

## 0.0.1

Initial release of Flipper Cloud adapter for TypeScript/JavaScript.

### Features

- **HttpAdapter** - Direct HTTP communication with Flipper Cloud API
  - Full CRUD operations for features and gates
  - ETag-based caching for efficient `getAll` operations
  - Configurable timeouts and custom headers
  - Read-only mode support
  - Error handling with detailed messages

- **Poller** - Background synchronization mechanism
  - Configurable polling interval (minimum 10 seconds)
  - Automatic jitter to prevent thundering herd
  - Graceful error handling and recovery
  - Manual sync support

- **Cloud Integration** - High-level `FlipperCloud` function
  - Automatic setup with dual-write pattern
  - Local adapter for low-latency reads (Memory, Redis, Sequelize, etc.)
  - Background sync keeps local cache up-to-date
  - Initial sync before starting poller
  - Read-only mode for worker processes

- **Ruby Interoperability** - Compatible with Ruby Flipper Cloud adapter
  - Same HTTP API contract
  - Same ETag caching behavior
  - Same dual-write pattern

### Documentation

- Complete adapter guide in `docs/adapters/cloud.md`
- Quick start examples
- Configuration options reference
- Architecture diagrams
- Best practices for production deployments
