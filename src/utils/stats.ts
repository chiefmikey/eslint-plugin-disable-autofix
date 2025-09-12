import { performance } from 'node:perf_hooks';
import { logger } from './logger';

/**
 * Interface for rule statistics
 */
interface RuleStats {
  /** Number of times this rule has been processed */
  count: number;
  /** Total time spent processing this rule in milliseconds */
  processingTime: number;
  /** Timestamp when this rule was last processed */
  lastProcessed: number;
  /** Number of times this rule encountered errors */
  errors: number;
  /** Average processing time per rule in milliseconds */
  avgProcessingTime: number;
  /** Number of times this rule was fixed */
  fixCount: number;
  /** Number of times the cache was hit for this rule */
  cacheHits: number;
}

/**
 * Summary of statistics for all rules
 */
interface StatsSummary {
  /** Total number of rule instances processed */
  totalRules: number;
  /** Number of unique rule types processed */
  uniqueRules: number;
  /** Total time spent processing all rules */
  totalProcessingTime: number;
  /** Human readable total processing time */
  totalProcessingTimeFormatted: string;
  /** Total number of errors encountered */
  errorCount: number;
  /** Total number of cache hits */
  cacheHits: number;
  /** Cache hit rate percentage */
  cacheHitRate: number;
  /** Total number of fixes prevented */
  fixesDisabled: number;
  /** Start time of stats collection */
  startTime: number;
  /** Duration stats have been collected for */
  uptime: number;
}

/**
 * Full statistics object
 */
interface FullStats {
  /** Summary statistics */
  summary: StatsSummary;
  /** Top rules by usage count */
  topRules: Array<RuleStats & { ruleId: string }>;
  /** Slowest rules by processing time */
  slowestRules: Array<RuleStats & { ruleId: string }>;
  /** Rules with the most errors */
  errorRules: Array<RuleStats & { ruleId: string }>;
  /** Rules with most fixes prevented */
  mostFixed: Array<RuleStats & { ruleId: string }>;
}

/**
 * Options for the statistics tracker
 */
interface StatsOptions {
  /** Whether to track detailed timing information */
  trackTiming?: boolean;
  /** Whether to track cache performance */
  trackCache?: boolean;
  /** Whether to track fix counts */
  trackFixes?: boolean;
  /** How often to log stats in milliseconds (0 to disable) */
  logInterval?: number;
}

/**
 * Tracks statistics for rules processed by the plugin
 */
export class RuleStatistics {
  private readonly stats: {
    totalRules: number;
    processedRules: Map<string, RuleStats>;
    errors: Record<string, number>;
    totalProcessingTime: number;
    startTime: number;
    cacheHits: number;
    fixesDisabled: number;
  };

  private readonly options: Required<StatsOptions>;
  private logIntervalId: NodeJS.Timeout | null = null;

  /**
   * Create a new statistics tracker
   * @param options - Configuration options
   */
  constructor(options: StatsOptions = {}) {
    this.options = {
      trackTiming: options.trackTiming ?? true,
      trackCache: options.trackCache ?? true,
      trackFixes: options.trackFixes ?? true,
      logInterval: options.logInterval ?? 0,
    };

    this.stats = {
      totalRules: 0,
      processedRules: new Map(),
      errors: {},
      totalProcessingTime: 0,
      startTime: Date.now(),
      cacheHits: 0,
      fixesDisabled: 0,
    };

    // Set up periodic logging if enabled
    if (this.options.logInterval > 0) {
      this.logIntervalId = setInterval(() => {
        this.logStats();
      }, this.options.logInterval);
    }
  }

  /**
   * Clean up resources when the stats tracker is no longer needed
   */
  dispose(): void {
    if (this.logIntervalId) {
      clearInterval(this.logIntervalId);
      this.logIntervalId = null;
    }
  }

  /**
   * Track a rule being processed
   * @param ruleId - The ID of the rule being processed
   * @param processingTime - Optional processing time in milliseconds
   */
  trackRule(ruleId: string, processingTime?: number): void {
    this.stats.totalRules++;
    
    const ruleStats = this.stats.processedRules.get(ruleId) || {
      count: 0,
      processingTime: 0,
      lastProcessed: Date.now(),
      errors: 0,
      avgProcessingTime: 0,
      fixCount: 0,
      cacheHits: 0,
    };
    
    ruleStats.count++;
    ruleStats.lastProcessed = Date.now();
    
    if (this.options.trackTiming && processingTime !== undefined) {
      ruleStats.processingTime += processingTime;
      ruleStats.avgProcessingTime = ruleStats.processingTime / ruleStats.count;
      this.stats.totalProcessingTime += processingTime;
    }
    
    this.stats.processedRules.set(ruleId, ruleStats);
  }

  /**
   * Track a cache hit for a rule
   * @param ruleId - The ID of the rule that had a cache hit
   */
  trackCacheHit(ruleId: string): void {
    if (!this.options.trackCache) return;
    
    this.stats.cacheHits++;
    
    const ruleStats = this.stats.processedRules.get(ruleId);
    if (ruleStats) {
      ruleStats.cacheHits++;
    }
  }

  /**
   * Track a fix being disabled for a rule
   * @param ruleId - The ID of the rule where a fix was disabled
   */
  trackDisabledFix(ruleId: string): void {
    if (!this.options.trackFixes) return;
    
    this.stats.fixesDisabled++;
    
    const ruleStats = this.stats.processedRules.get(ruleId);
    if (ruleStats) {
      ruleStats.fixCount++;
    }
  }

  /**
   * Track an error for a rule
   * @param ruleId - The ID of the rule that had an error
   */
  trackError(ruleId: string): void {
    this.stats.errors[ruleId] = (this.stats.errors[ruleId] ?? 0) + 1;
    
    const ruleStats = this.stats.processedRules.get(ruleId);
    if (ruleStats) {
      ruleStats.errors++;
    }
  }

  /**
   * Log current statistics to the console
   */
  logStats(): void {
    const summary = this.getSummary();
    logger.info(`
Stats Summary:
  Rules processed: ${summary.totalRules} (${summary.uniqueRules} unique)
  Processing time: ${summary.totalProcessingTimeFormatted}
  Cache hit rate: ${summary.cacheHitRate.toFixed(2)}%
  Fixes disabled: ${summary.fixesDisabled}
  Uptime: ${Math.round(summary.uptime / 1000)}s
`);
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.stats.totalRules = 0;
    this.stats.processedRules.clear();
    this.stats.errors = {};
    this.stats.totalProcessingTime = 0;
    this.stats.startTime = Date.now();
    this.stats.cacheHits = 0;
    this.stats.fixesDisabled = 0;
  }

  /**
   * Get a summary of the statistics
   */
  getSummary(): StatsSummary {
    const now = Date.now();
    return {
      totalRules: this.stats.totalRules,
      uniqueRules: this.stats.processedRules.size,
      totalProcessingTime: this.stats.totalProcessingTime,
      totalProcessingTimeFormatted: `${this.stats.totalProcessingTime.toFixed(2)}ms`,
      errorCount: Object.keys(this.stats.errors).length,
      cacheHits: this.stats.cacheHits,
      cacheHitRate: this.stats.totalRules === 0 ? 0 : (this.stats.cacheHits / this.stats.totalRules) * 100,
      fixesDisabled: this.stats.fixesDisabled,
      startTime: this.stats.startTime,
      uptime: now - this.stats.startTime,
    };
  }

  /**
   * Get the full statistics
   */
  getStats(): FullStats {
    const processedRules = Array.from(this.stats.processedRules.entries())
      .map(([ruleId, stats]) => ({
        ruleId,
        ...stats,
      }));
    
    const topRules = [...processedRules]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const slowestRules = [...processedRules]
      .filter(rule => rule.processingTime > 0)
      .sort((a, b) => b.processingTime - a.processingTime)
      .slice(0, 10);
    
    const errorRules = [...processedRules]
      .filter(rule => rule.errors > 0)
      .sort((a, b) => b.errors - a.errors)
      .slice(0, 10);
    
    const mostFixed = [...processedRules]
      .filter(rule => rule.fixCount > 0)
      .sort((a, b) => b.fixCount - a.fixCount)
      .slice(0, 10);
    
    return {
      summary: this.getSummary(),
      topRules,
      slowestRules,
      errorRules,
      mostFixed,
    };
  }
}

/**
 * Utility for measuring performance
 * @param fn - Function to measure
 * @param label - Label for the measurement
 * @returns Result of the function
 */
export function measurePerformance<T>(fn: () => T, label: string): T {
  if (!process.env.DEBUG) {
    return fn();
  }
  
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;
  
  logger.debug(`${label}: ${duration.toFixed(2)}ms`);
  return result;
}
