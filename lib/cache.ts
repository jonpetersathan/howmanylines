import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';

// Configuration
// Configuration
const DEFAULT_TTL = 24 * 60 * 60; // Default 24 hours

const REDIS_URL = process.env.REDIS_URL;

// Interfaces
interface CacheService {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
}

// Memory Cache Implementation
class MemoryCacheImpl implements CacheService {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private cache: LRUCache<string, any>;

    constructor() {
        this.cache = new LRUCache({
            max: 100, // Max 100 items in memory
            ttl: DEFAULT_TTL * 1000,
        });
    }

    async get<T>(key: string): Promise<T | null> {
        return (this.cache.get(key) as T) || null;
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        this.cache.set(key, value, { ttl: ttl ? ttl * 1000 : undefined });
    }
}

// Redis Cache Implementation
class RedisCacheImpl implements CacheService {
    private redis: Redis;

    constructor(url: string) {
        this.redis = new Redis(url);
    }

    async get<T>(key: string): Promise<T | null> {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttl || DEFAULT_TTL);
    }
}

// Factory
let cacheService: CacheService;

if (process.env.CACHE_DISABLED === 'true') {
    // Caching disabled
    cacheService = {
        get: async () => null,
        set: async () => { },
    };
} else if (REDIS_URL) {
    console.log('Using Redis Cache');
    cacheService = new RedisCacheImpl(REDIS_URL);
} else {
    console.log('Using Memory Cache');
    cacheService = new MemoryCacheImpl();
}

export const cache = cacheService;
