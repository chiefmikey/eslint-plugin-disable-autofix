/**
 * Logger utility for the ESLint plugin
 * Provides consistent logging with prefixes and debug mode support
 */

const PREFIX = '[eslint-plugin-disable-autofix]';

/**
 * Logger interface
 */
export interface Logger {
  /**
   * Log a debug message (only when debug mode is enabled)
   */
  debug(message: string): void;
  
  /**
   * Log a warning message
   */
  warn(message: string, error?: unknown): void;
  
  /**
   * Log an error message
   */
  error(message: string, error?: unknown): void;
  
  /**
   * Log an informational message
   */
  info(message: string): void;
}

/**
 * Logger implementation with debug mode support
 */
export const logger: Logger = {
  /**
   * Log a debug message (only when debug mode is enabled)
   * @param message - The message to log
   */
  debug(message: string): void {
    if (process.env.DEBUG === '1') {
      console.log(`${PREFIX} ${message}`);
    }
  },
  
  /**
   * Log a warning message
   * @param message - The warning message
   * @param error - Optional error object
   */
  warn(message: string, error?: unknown): void {
    console.warn(`${PREFIX} ${message}`, error ?? '');
  },
  
  /**
   * Log an error message
   * @param message - The error message
   * @param error - Optional error object
   */
  error(message: string, error?: unknown): void {
    console.error(`${PREFIX} ${message}`, error ?? '');
  },
  
  /**
   * Log an informational message
   * @param message - The informational message
   */
  info(message: string): void {
    console.info(`${PREFIX} ${message}`);
  }
};

/**
 * Create a scoped logger with a specific context prefix
 * @param context - The context to add to log messages
 * @returns A logger with the given context
 */
export function createScopedLogger(context: string): Logger {
  return {
    debug: (message: string) => logger.debug(`[${context}] ${message}`),
    warn: (message: string, error?: unknown) => logger.warn(`[${context}] ${message}`, error),
    error: (message: string, error?: unknown) => logger.error(`[${context}] ${message}`, error),
    info: (message: string) => logger.info(`[${context}] ${message}`)
  };
}

/**
 * Enable debug mode
 */
export function enableDebugMode(): void {
  process.env.DEBUG = '1';
}

/**
 * Disable debug mode
 */
export function disableDebugMode(): void {
  delete process.env.DEBUG;
}
