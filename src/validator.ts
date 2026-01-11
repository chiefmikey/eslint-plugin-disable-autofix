import type { Linter } from 'eslint';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RuleConfiguration {
  ruleName: string;
  severity: Linter.RuleSeverity;
  options?: any[];
}

/**
 * Validates ESLint configuration for disable-autofix rules
 */
export class ConfigurationValidator {
  private readonly validSeverities: Linter.RuleSeverity[] = [0, 1, 2, 'off', 'warn', 'error'];
  private readonly disableAutofixPrefix = 'disable-autofix/';

  /**
   * Validates a complete ESLint configuration
   */
  validateConfig(config: Linter.Config): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!config.rules) {
      result.warnings.push('No rules found in configuration');
      return result;
    }

    const rules = config.rules;
    const processedRules = new Set<string>();

    for (const [ruleName, ruleConfig] of Object.entries(rules)) {
      if (ruleName.startsWith(this.disableAutofixPrefix)) {
        const originalRuleName = ruleName.slice(this.disableAutofixPrefix.length);
        const validation = this.validateDisableAutofixRule(originalRuleName, ruleConfig);

        if (!validation.valid) {
          result.valid = false;
          result.errors.push(...validation.errors);
        }
        result.warnings.push(...validation.warnings);

        processedRules.add(originalRuleName);
      } else if (processedRules.has(ruleName)) {
        // This is the original rule that was disabled for the autofix version
        const validation = this.validateOriginalRule(ruleName, ruleConfig);
        result.warnings.push(...validation.warnings);
      }
    }

    return result;
  }

  /**
   * Validates a single disable-autofix rule configuration
   */
  validateDisableAutofixRule(originalRuleName: string, ruleConfig: Linter.RuleEntry): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check rule name format
    if (!originalRuleName || typeof originalRuleName !== 'string') {
      result.valid = false;
      result.errors.push(`Invalid rule name: ${originalRuleName}`);
      return result;
    }

    // Parse severity and options
    const parsed = this.parseRuleEntry(ruleConfig);
    if (!parsed.valid) {
      result.valid = false;
      result.errors.push(...parsed.errors);
      return result;
    }

    // disable-autofix rules should typically be warnings or errors, not disabled
    if (parsed.severity === 0 || parsed.severity === 'off') {
      result.warnings.push(`disable-autofix rule '${originalRuleName}' is disabled, which defeats the purpose`);
    }

    return result;
  }

  /**
   * Validates the original rule when it's disabled for autofix
   */
  validateOriginalRule(ruleName: string, ruleConfig: Linter.RuleEntry): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    const parsed = this.parseRuleEntry(ruleConfig);
    if (!parsed.valid) {
      result.errors.push(...parsed.errors);
      return result;
    }

    // Original rules should be disabled when using disable-autofix version
    if (parsed.severity !== 0 && parsed.severity !== 'off') {
      result.warnings.push(
        `Original rule '${ruleName}' should be disabled ('off' or 0) when using disable-autofix version`
      );
    }

    return result;
  }

  /**
   * Parses a rule entry into severity and options
   */
  private parseRuleEntry(ruleEntry: Linter.RuleEntry): {
    valid: boolean;
    errors: string[];
    severity?: Linter.RuleSeverity;
    options?: any[];
  } {
    const errors: string[] = [];

    if (Array.isArray(ruleEntry)) {
      if (ruleEntry.length === 0) {
        errors.push('Rule entry array is empty');
        return { valid: false, errors };
      }

      const [severity, ...options] = ruleEntry;
      if (!this.validSeverities.includes(severity)) {
        errors.push(`Invalid severity: ${severity}`);
        return { valid: false, errors };
      }

      return {
        valid: true,
        errors: [],
        severity,
        options
      };
    } else {
      if (!this.validSeverities.includes(ruleEntry)) {
        errors.push(`Invalid severity: ${ruleEntry}`);
        return { valid: false, errors };
      }

      return {
        valid: true,
        errors: [],
        severity: ruleEntry,
        options: []
      };
    }
  }

  /**
   * Validates rule compatibility between original and disable-autofix versions
   */
  validateRuleCompatibility(originalRule: RuleConfiguration, disableAutofixRule: RuleConfiguration): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (originalRule.ruleName !== disableAutofixRule.ruleName) {
      result.valid = false;
      result.errors.push('Rule names do not match');
      return result;
    }

    // Both rules should have the same options for consistency
    if (JSON.stringify(originalRule.options || []) !== JSON.stringify(disableAutofixRule.options || [])) {
      result.warnings.push(
        `Rule options differ between original and disable-autofix versions of '${originalRule.ruleName}'`
      );
    }

    return result;
  }
}

// Export singleton instance
export const configValidator = new ConfigurationValidator();
