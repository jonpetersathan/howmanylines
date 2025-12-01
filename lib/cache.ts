import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';

// Configuration
const CACHE_TTL_SECONDS = process.env.CACHE_TTL_SECONDS
    ? parseInt(process.env.CACHE_TTL_SECONDS, 10)
    : 24 * 60 * 60; // Default 24 hours

const REDIS_URL = process.env.REDIS_URL;

// Interfaces
interface CacheService {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
}

// Memory Cache Implementation
class MemoryCacheImpl implements CacheService {
    private cache: LRUCache<string, any>;

    constructor() {
        this.cache = new LRUCache({
            max: 100, // Max 100 items in memory
            ttl: CACHE_TTL_SECONDS * 1000,
        });
    }

    async get<T>(key: string): Promise<T | null> {
        return (this.cache.get(key) as T) || null;
    }

    async set<T>(key: string, value: T): Promise<void> {
        this.cache.set(key, value);
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

    async set<T>(key: string, value: T): Promise<void> {
        await this.redis.set(key, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS);
    }
}

// Factory
let cacheService: CacheService;

if (CACHE_TTL_SECONDS === 0) {
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
