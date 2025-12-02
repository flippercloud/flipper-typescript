import type { ICache, CacheGetResult } from './types'

// Simple in-memory cache with TTL support. Suitable for single-process apps.
export default class MemoryCache implements ICache {
  private store = new Map<string, { value: unknown; expiresAt?: number }>()

  async get<T = unknown>(key: string): Promise<CacheGetResult<T>> {
    await Promise.resolve()
    const entry = this.store.get(key)
    if (!entry) return { hit: false }
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return { hit: false }
    }
    return { hit: true, value: entry.value as T }
  }

  async getMulti(keys: string[]): Promise<Record<string, unknown>> {
    await Promise.resolve()
    const result: Record<string, unknown> = {}
    for (const key of keys) {
      const entry = this.store.get(key)
      if (!entry) continue
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.store.delete(key)
        continue
      }
      result[key] = entry.value
    }
    return result
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined
    this.store.set(key, { value, expiresAt })
    await Promise.resolve()
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
    await Promise.resolve()
  }
}
