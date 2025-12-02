/**
 * Discriminated union representing a cache lookup result.
 * When hit=true, value is present; when hit=false, value is omitted.
 */
export type CacheGetResult<T = unknown> = { hit: true; value: T } | { hit: false }

/**
 * Generic cache backend interface used by the Cache adapter.
 * Implementations can ignore TTL if unsupported.
 */
export interface ICache {
  get: <T = unknown>(key: string) => Promise<CacheGetResult<T>>
  getMulti: (keys: string[]) => Promise<Record<string, unknown>>
  set: (key: string, value: unknown, ttlSeconds?: number) => Promise<void>
  delete: (key: string) => Promise<void>
}

export interface CacheOptions {
  ttlSeconds?: number
  prefix?: string
  writeThrough?: boolean
}
