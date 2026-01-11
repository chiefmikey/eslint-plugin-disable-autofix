/**
 * Test results processor for eslint-plugin-disable-autofix CI
 * Provides comprehensive reporting and analysis
 */

class TestResultsProcessor {
  constructor(globalConfig, options = {}) {
    this.globalConfig = globalConfig;
    this.options = {
      outputDir: 'test-results',
      detailedOutput: true,
      performanceThresholds: {
        slowTest: 5000, // 5 seconds
        verySlowTest: 15000, // 15 seconds
      },
      coverageThresholds: {
        branches: 90,
        functions: 95,
        lines: 95,
        statements: 95,
      },
      ...options,
    };

    this.results = {
      summary: {},
      performance: {},
      coverage: {},
      failures: [],
      warnings: [],
    };
  }

  onTestResult(test, testResult, aggregatedResult) {
    this._processTestResult(test, testResult);
    return testResult;
  }

  onRunComplete(contexts, results) {
    this._processRunComplete(results);
    this._generateReports(results);
    this._validateCIRequirements(results);

    return results;
  }

  _processTestResult(test, testResult) {
    const testPath = test.path;
    const duration = testResult.duration || 0;

    // Track performance
    if (duration > this.options.performanceThresholds.verySlowTest) {
      this.results.warnings.push({
        type: 'VERY_SLOW_TEST',
        test: testPath,
        duration,
        threshold: this.options.performanceThresholds.verySlowTest,
      });
    } else if (duration > this.options.performanceThresholds.slowTest) {
      this.results.warnings.push({
        type: 'SLOW_TEST',
        test: testPath,
        duration,
        threshold: this.options.performanceThresholds.slowTest,
      });
    }

    // Track failures
    testResult.testResults.forEach(testCase => {
      if (testCase.status === 'failed') {
        this.results.failures.push({
          test: testPath,
          testCase: testCase.title,
          error: testCase.failureMessages.join('\n'),
          duration: testCase.duration,
        });
      }
    });

    // Track test categories
    const category = this._getTestCategory(testPath);
    if (!this.results.performance[category]) {
      this.results.performance[category] = [];
    }
    this.results.performance[category].push({
      path: testPath,
      duration,
      status: testResult.numFailingTests === 0 ? 'passed' : 'failed',
    });
  }

  _processRunComplete(results) {
    this.results.summary = {
      totalTests: results.numTotalTests,
      passedTests: results.numPassedTests,
      failedTests: results.numFailedTests,
      pendingTests: results.numPendingTests,
      totalTestSuites: results.numTotalTestSuites,
      passedTestSuites: results.numPassedTestSuites,
      failedTestSuites: results.numFailedTestSuites,
      runtime: results.runtime || 0,
      coverage: results.coverageMap ? this._processCoverage(results.coverageMap) : null,
    };
  }

  _processCoverage(coverageMap) {
    const coverage = {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    };

    coverageMap.files().forEach(filePath => {
      const fileCoverage = coverageMap.fileCoverageFor(filePath);
      const summary = fileCoverage.toSummary();

      coverage.branches += summary.branches.pct;
      coverage.functions += summary.functions.pct;
      coverage.lines += summary.lines.pct;
      coverage.statements += summary.statements.pct;
    });

    // Average across files
    const fileCount = coverageMap.files().length;
    if (fileCount > 0) {
      coverage.branches /= fileCount;
      coverage.functions /= fileCount;
      coverage.lines /= fileCount;
      coverage.statements /= fileCount;
    }

    return coverage;
  }

  _getTestCategory(testPath) {
    const path = testPath.toLowerCase();

    if (path.includes('integration')) return 'integration';
    if (path.includes('performance') || path.includes('perf')) return 'performance';
    if (path.includes('cross-platform') || path.includes('platform')) return 'cross-platform';
    if (path.includes('error') || path.includes('recovery')) return 'error-handling';
    if (path.includes('validation') || path.includes('validator')) return 'validation';
    if (path.includes('plugin-scopes') || path.includes('scopes')) return 'plugin-scopes';
    if (path.includes('config-syntax') || path.includes('syntax')) return 'config-syntax';
    if (path.includes('rule-types') || path.includes('rule')) return 'rule-types';
    if (path.includes('cach') || path.includes('memory')) return 'caching';

    return 'unit';
  }

  _generateReports(results) {
    const fs = require('fs');
    const path = require('path');

    // Create output directory
    const outputDir = this.options.outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate summary report
    const summaryReport = {
      timestamp: new Date().toISOString(),
      ...this.results.summary,
      warnings: this.results.warnings,
      failures: this.results.failures.length,
      performance: this._analyzePerformance(),
      coverage: this.results.summary.coverage,
    };

    fs.writeFileSync(
      path.join(outputDir, 'test-summary.json'),
      JSON.stringify(summaryReport, null, 2)
    );

    // Generate detailed performance report
    const performanceReport = {
      timestamp: new Date().toISOString(),
      categories: this.results.performance,
      analysis: this._analyzePerformance(),
    };

    fs.writeFileSync(
      path.join(outputDir, 'performance-report.json'),
      JSON.stringify(performanceReport, null, 2)
    );

    // Generate failure report
    if (this.results.failures.length > 0) {
      fs.writeFileSync(
        path.join(outputDir, 'failures.json'),
        JSON.stringify(this.results.failures, null, 2)
      );
    }

    // Console output for CI
    this._outputToConsole(results);
  }

  _analyzePerformance() {
    const analysis = {
      totalDuration: 0,
      averageDuration: 0,
      slowestCategory: null,
      fastestCategory: null,
      slowTests: [],
      verySlowTests: [],
    };

    let totalTests = 0;
    const categoryStats = {};

    Object.entries(this.results.performance).forEach(([category, tests]) => {
      const categoryDuration = tests.reduce((sum, test) => sum + test.duration, 0);
      const categoryCount = tests.length;

      categoryStats[category] = {
        totalDuration: categoryDuration,
        averageDuration: categoryDuration / categoryCount,
        testCount: categoryCount,
      };

      totalTests += categoryCount;
      analysis.totalDuration += categoryDuration;

      // Track slowest/fastest categories
      if (!analysis.slowestCategory ||
          categoryStats[category].averageDuration > categoryStats[analysis.slowestCategory].averageDuration) {
        analysis.slowestCategory = category;
      }

      if (!analysis.fastestCategory ||
          categoryStats[category].averageDuration < categoryStats[analysis.fastestCategory].averageDuration) {
        analysis.fastestCategory = category;
      }
    });

    analysis.averageDuration = analysis.totalDuration / totalTests;

    // Identify slow tests
    analysis.slowTests = this.results.warnings.filter(w => w.type === 'SLOW_TEST');
    analysis.verySlowTests = this.results.warnings.filter(w => w.type === 'VERY_SLOW_TEST');

    return {
      ...analysis,
      categoryStats,
    };
  }

  _validateCIRequirements(results) {
    const errors = [];
    const warnings = [];

    // Check coverage thresholds
    if (results.coverageMap) {
      const coverage = this.results.summary.coverage;

      Object.entries(this.options.coverageThresholds).forEach(([metric, threshold]) => {
        const actual = coverage[metric];
        if (actual < threshold) {
          errors.push(`Coverage for ${metric} is ${actual.toFixed(1)}%, below threshold of ${threshold}%`);
        }
      });
    }

    // Check for too many slow tests
    const slowTestPercentage = (this.results.warnings.filter(w => w.type === 'SLOW_TEST').length / results.numTotalTests) * 100;
    if (slowTestPercentage > 10) {
      warnings.push(`Slow test percentage is ${slowTestPercentage.toFixed(1)}%, consider optimizing`);
    }

    // Check for test failures
    if (results.numFailedTests > 0) {
      errors.push(`${results.numFailedTests} test(s) failed - CI should not pass`);
    }

    // Output validation results
    if (errors.length > 0) {
      console.error('\n❌ CI Requirements Failed:');
      errors.forEach(error => console.error(`  • ${error}`));
      process.exitCode = 1;
    }

    if (warnings.length > 0) {
      console.warn('\n⚠️  CI Warnings:');
      warnings.forEach(warning => console.warn(`  • ${warning}`));
    }

    if (errors.length === 0) {
      console.log('\n✅ All CI requirements met');
    }
  }

  _outputToConsole(results) {
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${results.numTotalTests}`);
    console.log(`Passed: ${results.numPassedTests}`);
    console.log(`Failed: ${results.numFailedTests}`);
    console.log(`Pending: ${results.numPendingTests}`);
    console.log(`Runtime: ${(results.runtime / 1000).toFixed(2)}s`);

    if (this.results.summary.coverage) {
      console.log('\n📈 Coverage Summary');
      console.log('='.repeat(30));
      const cov = this.results.summary.coverage;
      console.log(`Branches: ${cov.branches.toFixed(1)}%`);
      console.log(`Functions: ${cov.functions.toFixed(1)}%`);
      console.log(`Lines: ${cov.lines.toFixed(1)}%`);
      console.log(`Statements: ${cov.statements.toFixed(1)}%`);
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  Performance Warnings');
      console.log('='.repeat(30));
      this.results.warnings.forEach(warning => {
        console.log(`${warning.type}: ${warning.test} (${warning.duration}ms)`);
      });
    }

    if (this.results.failures.length > 0) {
      console.log('\n❌ Test Failures');
      console.log('='.repeat(20));
      this.results.failures.slice(0, 5).forEach(failure => {
        console.log(`${failure.test}: ${failure.testCase}`);
      });

      if (this.results.failures.length > 5) {
        console.log(`... and ${this.results.failures.length - 5} more failures`);
      }
    }
  }
}

module.exports = TestResultsProcessor;
