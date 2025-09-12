import type { Rule } from 'eslint';
import Ajv from 'ajv';
import { logger } from './logger';

/**
 * Result of rule configuration validation
 */
interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Validation errors, if any */
  errors: string[];
}

/**
 * Validates rule configuration against the schema defined in the rule's meta property
 * @param rule - The ESLint rule module
 * @param config - The rule configuration to validate
 * @returns Result of the validation
 */
export function validateRuleConfig(
  rule: Rule.RuleModule,
  config: unknown,
): ValidationResult {
  if (!rule.meta?.schema) {
    // No schema defined, so any config is valid
    return { valid: true, errors: [] };
  }

  try {
    const ajv = new Ajv({
      allErrors: true,
      verbose: true,
    });

    let schema: Record<string, unknown>;

    if (Array.isArray(rule.meta.schema)) {
      schema = {
        type: 'array',
        items: rule.meta.schema,
      };
    } else {
      schema = rule.meta.schema as Record<string, unknown>;
    }

    const validate = ajv.compile(schema);
    const isValid = !!validate(config);

    return {
      valid: isValid,
      errors: isValid
        ? []
        : (validate.errors?.map(
            (err) =>
              `${(err as any).dataPath || ''} ${err.message ?? 'is invalid'}`,
          ) ?? []),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      valid: false,
      errors: [`Failed to validate: ${errorMessage}`],
    };
  }
}

/**
 * Convert string severity to numeric value
 * @param severity - String severity (error|warn|off)
 * @returns Numeric severity (2|1|0)
 */
function severityToNumber(severity: string): number {
  if (severity === 'error') return 2;
  if (severity === 'warn') return 1;
  return 0;
}

/**
 * Converts a rule severity string or array to a standard format
 * @param severity - ESLint rule severity configuration
 * @returns Normalized rule configuration [severity, options]
 */
export function normalizeRuleConfig(
  severity: string | [string, ...unknown[]] | number | [number, ...unknown[]],
): [number, ...unknown[]] {
  // Handle string severity
  if (typeof severity === 'string') {
    return [severityToNumber(severity)];
  }

  // Handle numeric severity
  if (typeof severity === 'number') {
    return [severity];
  }

  // Handle array configuration
  if (Array.isArray(severity)) {
    const [first, ...rest] = severity;

    if (typeof first === 'string') {
      return [severityToNumber(first), ...rest];
    }

    return [first, ...rest];
  }

  // Default to 'off'
  return [0];
}

/**
 * Creates a mock ESLint rule for testing
 * @param options - Rule options
 * @returns A mock ESLint rule
 */
export function createMockRule(options: {
  meta?: Partial<Rule.RuleMetaData>;
  create?: (context: Rule.RuleContext) => Rule.RuleListener;
}): Rule.RuleModule {
  const defaultCreate = () => ({});

  return {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Mock rule for testing',
      },
      ...options.meta,
    },
    create: options.create ?? defaultCreate,
  };
}

/**
 * Creates a test fixture for an ESLint plugin
 * @param ruleNames - List of rule names to include
 * @returns A mock ESLint plugin
 */
export function createMockPlugin(ruleNames: string[]): {
  rules: Record<string, Rule.RuleModule>;
} {
  const rules: Record<string, Rule.RuleModule> = {};

  for (const name of ruleNames) {
    rules[name] = createMockRule({
      meta: {
        fixable: 'code', // All rules are fixable by default for testing
        docs: {
          description: `Mock rule: ${name}`,
        },
      },
    });
  }

  return { rules };
}

/**
 * Gets ESLint version information
 */
export function getESLintVersionInfo(): {
  major: number;
  full: string;
  isFlat: boolean;
  isLegacy: boolean;
} {
  try {
    // Try to dynamically import ESLint package.json
    const eslintPkg = require('eslint/package.json');
    const version = eslintPkg.version;
    const [major] = version.split('.');
    const majorNum = parseInt(major, 10);

    return {
      major: majorNum,
      full: version,
      isFlat: majorNum >= 8,
      isLegacy: majorNum < 8,
    };
  } catch (error) {
    logger.warn('Failed to determine ESLint version', error);
    return {
      major: 0,
      full: 'unknown',
      isFlat: false,
      isLegacy: true,
    };
  }
}
