const Sequencer = require('@jest/test-sequencer').default;

/**
 * Custom test sequencer for eslint-plugin-disable-autofix
 * Orders tests to ensure reliable CI execution
 */
class CustomSequencer extends Sequencer {
  /**
   * Sort tests for optimal execution order
   * 1. Unit tests first (fast, isolated)
   * 2. Integration tests (slower, depend on setup)
   * 3. Performance tests (require stable environment)
   * 4. Cross-platform tests (may be platform-specific)
   * 5. Error recovery tests (stress tests)
   */
  sort(tests) {
    const testOrder = {
      'unit': 1,
      'integration': 2,
      'performance': 3,
      'caching': 4,
      'validation': 5,
      'cross-platform': 6,
      'error': 7,
      'plugin-scopes': 8,
      'config-syntax': 9,
      'rule-types': 10,
    };

    return tests.sort((a, b) => {
      const getPriority = (test) => {
        const path = test.path.toLowerCase();

        // Extract test category from filename
        if (path.includes('unit') || path.includes('basic')) return testOrder.unit;
        if (path.includes('integration')) return testOrder.integration;
        if (path.includes('performance') || path.includes('perf')) return testOrder.performance;
        if (path.includes('cach') || path.includes('memory')) return testOrder.caching;
        if (path.includes('validation') || path.includes('validator')) return testOrder.validation;
        if (path.includes('cross-platform') || path.includes('platform')) return testOrder['cross-platform'];
        if (path.includes('error') || path.includes('recovery')) return testOrder.error;
        if (path.includes('plugin-scopes') || path.includes('scopes')) return testOrder['plugin-scopes'];
        if (path.includes('config-syntax') || path.includes('syntax')) return testOrder['config-syntax'];
        if (path.includes('rule-types') || path.includes('rule')) return testOrder['rule-types'];

        // Default to unit tests
        return testOrder.unit;
      };

      const priorityA = getPriority(a);
      const priorityB = getPriority(b);

      // Sort by priority first
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Then by path for consistent ordering
      return a.path.localeCompare(b.path);
    });
  }

  /**
   * Cache test results for faster re-runs
   */
  cacheTests(tests) {
    const cache = {};

    tests.forEach(test => {
      const key = this._getCacheKey(test);
      cache[key] = {
        path: test.path,
        duration: test.duration || 0,
        lastRun: Date.now(),
      };
    });

    try {
      require('fs').writeFileSync(
        '.jest-test-cache.json',
        JSON.stringify(cache, null, 2)
      );
    } catch (error) {
      // Ignore cache write errors
    }

    return super.cacheTests(tests);
  }

  /**
   * Check if tests can be skipped based on cache
   */
  shouldRunTest(test) {
    if (process.env.SKIP_CACHE) {
      return true;
    }

    try {
      const cache = JSON.parse(
        require('fs').readFileSync('.jest-test-cache.json', 'utf8')
      );

      const key = this._getCacheKey(test);
      const cached = cache[key];

      if (cached) {
        // Skip if test passed recently and file hasn't changed
        const stat = require('fs').statSync(test.path);
        return cached.lastRun < stat.mtime.getTime();
      }
    } catch (error) {
      // Ignore cache read errors
    }

    return true;
  }

  _getCacheKey(test) {
    const crypto = require('crypto');
    const fs = require('fs');

    try {
      const content = fs.readFileSync(test.path, 'utf8');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      return test.path;
    }
  }
}

module.exports = CustomSequencer;
