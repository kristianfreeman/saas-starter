/**
 * In-memory cache implementation
 * For production, consider using Redis or similar
 */
class MemoryCache<T = any> {
  private cache: Map<string, { value: T; expires: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(cleanupIntervalMs: number = 60000) {
    // Run cleanup every minute by default
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }
  
  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  /**
   * Set value in cache
   */
  set(key: string, value: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }
  
  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expires < now) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Destroy cache and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Global cache instances
const cacheInstances = new Map<string, MemoryCache>();

/**
 * Get or create a cache instance
 */
export function getCache<T = any>(namespace: string = 'default'): MemoryCache<T> {
  if (!cacheInstances.has(namespace)) {
    cacheInstances.set(namespace, new MemoryCache<T>());
  }
  return cacheInstances.get(namespace) as MemoryCache<T>;
}

/**
 * Cache decorator for async functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    ttl?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
    namespace?: string;
  } = {}
): T {
  const { 
    ttl = 300, 
    keyGenerator = (...args) => JSON.stringify(args),
    namespace = 'function-cache'
  } = options;
  
  const cache = getCache(namespace);
  
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // Check cache first
    const cachedValue = cache.get(key);
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    // Call function and cache result
    const result = await fn(...args);
    cache.set(key, result, ttl);
    
    return result;
  }) as T;
}

/**
 * Session storage cache for client-side
 */
export class SessionCache {
  constructor(private prefix: string = 'app_cache_') {}
  
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = sessionStorage.getItem(this.prefix + key);
      if (!item) return null;
      
      const { value, expires } = JSON.parse(item);
      
      if (expires && expires < Date.now()) {
        sessionStorage.removeItem(this.prefix + key);
        return null;
      }
      
      return value;
    } catch {
      return null;
    }
  }
  
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    if (typeof window === 'undefined') return;
    
    try {
      const item = {
        value,
        expires: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null
      };
      
      sessionStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (e) {
      // Handle quota exceeded
      console.warn('SessionStorage quota exceeded', e);
    }
  }
  
  delete(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.prefix + key);
  }
  
  clear(): void {
    if (typeof window === 'undefined') return;
    
    // Only clear items with our prefix
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

/**
 * Database query cache
 */
export const dbCache = getCache('database');

/**
 * API response cache
 */
export const apiCache = getCache('api');

/**
 * User permissions cache
 */
export const permissionsCache = getCache('permissions');

/**
 * Cached database query helper
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const cached = dbCache.get(key);
  if (cached !== null) {
    return cached as T;
  }
  
  const result = await queryFn();
  dbCache.set(key, result, ttl);
  
  return result;
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  for (const cache of cacheInstances.values()) {
    cache.clear();
  }
}

/**
 * Destroy all caches
 */
export function destroyAllCaches(): void {
  for (const cache of cacheInstances.values()) {
    cache.destroy();
  }
  cacheInstances.clear();
}