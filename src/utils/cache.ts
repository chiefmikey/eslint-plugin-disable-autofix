import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import type { Rule } from 'eslint';

// Import logger from a dedicated module
import { logger } from './logger';

/**
 * Interface for serializable rule cache entry
 * This avoids trying to serialize functions directly
 */
interface SerializableRuleCache {
  meta?: {
    type?: string;
    docs?: {
      description?: string;
      url?: string;
    };
    schema?: unknown;
    messages?: Record<string, string>;
    deprecated?: boolean | { replacedBy?: string[] };
    // The fixable property is intentionally removed
  };
  // Store rule source hash for invalidation
  sourceHash: string;
  timestamp: number;
}

/**
 * Maps a Rule.RuleModule to a serializable format
 * @param rule - The ESLint rule to serialize
 * @returns A serializable version of the rule
 */
function serializeRule(rule: Rule.RuleModule): SerializableRuleCache {
  return {
    meta: rule.meta
      ? {
          type: rule.meta.type,
          docs: rule.meta.docs,
          schema: rule.meta.schema,
          messages: rule.meta.messages,
          deprecated:
            typeof rule.meta.deprecated === 'boolean'
              ? rule.meta.deprecated
              : rule.meta.deprecated
                ? {
                    replacedBy: (rule.meta.deprecated as any)?.replacedBy || [],
                  }
                : undefined,
          // Specifically omit the fixable property
        }
      : undefined,
    // Store a hash of the stringified rule for cache invalidation
    sourceHash: createHash('sha256')
      .update(
        JSON.stringify(rule, (_key, value) =>
          typeof value === 'function' ? value.toString() : value,
        ),
      )
      .digest('hex'),
    timestamp: Date.now(),
  };
}

/**
 * Persistent cache for storing rule metadata and invalidation info
 * Uses file system for persistence between sessions
 */
export class PersistentCache {
  private readonly cacheDir: string;
  private readonly cacheFile: string;
  private readonly cache: Map<string, SerializableRuleCache>;
  private readonly memoryCache: Map<string, Rule.RuleModule>;
  private dirty = false;
  private readonly ttl: number;

  /**
   * Create a new persistent cache
   * @param options - Cache options
   * @param options.ttl - Time to live in milliseconds (default: 1 hour)
   */
  constructor(options?: { ttl?: number }) {
    this.cache = new Map();
    this.memoryCache = new Map();
    this.ttl = options?.ttl ?? 3600000; // 1 hour default TTL

    this.cacheDir = path.join(os.homedir(), '.eslint-plugin-disable-autofix');
    this.cacheFile = path.join(this.cacheDir, 'rule-cache.json');
    this.initialize();
  }

  /**
   * Initialize the cache, loading from disk if available
   */
  private initialize(): void {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
        return;
      }

      if (fs.existsSync(this.cacheFile)) {
        const rawData = fs.readFileSync(this.cacheFile, 'utf8');
        const cacheData = JSON.parse(rawData) as Record<
          string,
          SerializableRuleCache
        >;

        // Load cache and perform invalidation by TTL
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;

        Object.entries(cacheData).forEach(([key, value]) => {
          // Skip entries that are older than TTL
          if (now - value.timestamp > this.ttl) {
            expiredEntries++;
            return;
          }

          this.cache.set(key, value);
          validEntries++;
        });

        logger.debug(
          `Cache loaded: ${validEntries} valid entries, ${expiredEntries} expired entries`,
        );
      }
    } catch (error) {
      logger.debug(
        `Failed to initialize cache: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Reset cache on error to avoid using corrupted data
      this.cache.clear();
    }
  }

  /**
   * Get a rule from the cache
   * @param key - The rule key to retrieve
   * @returns The cached rule or null if not found/expired
   */
  get(key: string): Rule.RuleModule | null {
    const cacheKey = this.getCacheKey(key);

    // First check in-memory cache for already processed rules
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey) || null;
    }

    // Cache miss - will be handled by the caller
    return null;
  }

  /**
   * Set a rule in the cache
   * @param key - The rule key
   * @param rule - The rule module to cache
   */
  set(key: string, rule: Rule.RuleModule): void {
    const cacheKey = this.getCacheKey(key);

    // Store the rule in memory for this session
    this.memoryCache.set(cacheKey, rule);

    // Store serializable metadata for persistent cache
    this.cache.set(cacheKey, serializeRule(rule));
    this.dirty = true;
  }

  /**
   * Check if a rule is in the cache and valid
   * @param key - The rule key to check
   * @returns True if the rule is in the cache and not expired
   */
  has(key: string): boolean {
    const cacheKey = this.getCacheKey(key);
    return this.memoryCache.has(cacheKey) || this.cache.has(cacheKey);
  }

  /**
   * Generate a cache key from a rule path
   * @param rulePath - Path or identifier for the rule
   * @returns A unique hash for this rule
   */
  private getCacheKey(rulePath: string): string {
    return createHash('md5').update(rulePath).digest('hex');
  }

  /**
   * Save the cache to disk
   */
  save(): void {
    if (!this.dirty) {
      return;
    }

    try {
      const cacheData: Record<string, SerializableRuleCache> = {};
      this.cache.forEach((value, key) => {
        cacheData[key] = value;
      });

      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }

      fs.writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2));
      this.dirty = false;
      logger.debug(`Cache saved: ${this.cache.size} entries`);
    } catch (error) {
      logger.warn(
        'Failed to save cache',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Clear the cache
   */
  public clear(): void {
    this.cache.clear();
    this.memoryCache.clear();
    this.dirty = true;

    try {
      if (fs.existsSync(this.cacheFile)) {
        fs.unlinkSync(this.cacheFile);
        logger.debug('Cache file deleted');
      }
    } catch (error) {
      logger.warn(
        'Failed to delete cache file',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    size: number;
    memorySize: number;
    dirty: boolean;
  } {
    return {
      size: this.cache.size,
      memorySize: this.memoryCache.size,
      dirty: this.dirty,
    };
  }
}
