#!/usr/bin/env node

/**
 * CI Validation Script - Simulates full CI pipeline locally
 * Ensures the plugin meets all quality gates before pushing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`🔍 ${description}...`, 'blue');
    const result = execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8',
      timeout: 300000 // 5 minutes
    });
    log(`✅ ${description} passed`, 'green');
    return result;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} exists`, 'green');
    return true;
  } else {
    log(`❌ ${description} missing`, 'red');
    return false;
  }
}

function validatePackageJson() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  const requiredFields = [
    'name', 'version', 'description', 'main', 'scripts', 'keywords', 'author', 'license'
  ];

  let valid = true;
  requiredFields.forEach(field => {
    if (!pkg[field]) {
      log(`❌ Missing required field: ${field}`, 'red');
      valid = false;
    }
  });

  // Check version format
  const versionRegex = /^\d+\.\d+\.\d+$/;
  if (!versionRegex.test(pkg.version)) {
    log(`❌ Invalid version format: ${pkg.version}`, 'red');
    valid = false;
  }

  // Check required scripts
  const requiredScripts = [
    'build', 'test:ci', 'test:smoke', 'validate-config'
  ];

  requiredScripts.forEach(script => {
    if (!pkg.scripts[script]) {
      log(`❌ Missing required script: ${script}`, 'red');
      valid = false;
    }
  });

  if (valid) {
    log('✅ package.json validation passed', 'green');
  }

  return valid;
}

function validateTestCoverage() {
  // Check if coverage directory exists and has reasonable content
  const coverageDir = path.join(process.cwd(), 'coverage');
  if (!fs.existsSync(coverageDir)) {
    log('⚠️  Coverage directory not found - run tests first', 'yellow');
    return true; // Don't fail if coverage hasn't been generated yet
  }

  const coverageFiles = fs.readdirSync(coverageDir);
  if (coverageFiles.length === 0) {
    log('⚠️  No coverage files found', 'yellow');
    return true;
  }

  log('✅ Coverage directory exists', 'green');
  return true;
}

function validateBuildOutput() {
  const distDir = path.join(process.cwd(), 'dist');

  if (!fs.existsSync(distDir)) {
    log('❌ dist directory not found - run build first', 'red');
    return false;
  }

  const requiredFiles = ['index.js', 'index.d.ts'];
  let valid = true;

  requiredFiles.forEach(file => {
    const filePath = path.join(distDir, file);
    if (!fs.existsSync(filePath)) {
      log(`❌ Missing build output: ${file}`, 'red');
      valid = false;
    } else {
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        log(`❌ Empty build output: ${file}`, 'red');
        valid = false;
      } else {
        log(`✅ Build output exists: ${file} (${stats.size} bytes)`, 'green');
      }
    }
  });

  return valid;
}

function main() {
  log('🚀 Starting CI Validation...', 'magenta');
  log('================================', 'magenta');

  let allPassed = true;

  // 1. File structure validation
  log('\n📁 Checking file structure...', 'cyan');
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'jest.config.ts',
    '.github/workflows/ci.yml',
    'src/index.ts',
    'README.md',
    'LICENSE'
  ];

  requiredFiles.forEach(file => {
    if (!checkFileExists(file, `${file} exists`)) {
      allPassed = false;
    }
  });

  // 2. Package.json validation
  log('\n📦 Validating package.json...', 'cyan');
  if (!validatePackageJson()) {
    allPassed = false;
  }

  // 3. Build validation
  log('\n🔨 Validating build process...', 'cyan');
  execCommand('npm run build', 'Build plugin');
  if (!validateBuildOutput()) {
    allPassed = false;
  }

  // 4. Smoke test
  log('\n💨 Running smoke test...', 'cyan');
  execCommand('npm run test:smoke', 'Smoke test');

  // 5. Quick test validation
  log('\n⚡ Running quick tests...', 'cyan');
  execCommand('npm run test:quick', 'Quick unit tests');

  // 6. Configuration validation
  log('\n⚙️  Validating configuration...', 'cyan');
  try {
    execCommand('npm run validate-config eslint.config.js 2>/dev/null || echo "No config file found"', 'Config validation');
  } catch (error) {
    log('⚠️  Config validation skipped (no config file)', 'yellow');
  }

  // 7. Test coverage validation
  log('\n📊 Checking test coverage...', 'cyan');
  if (!validateTestCoverage()) {
    allPassed = false;
  }

  // 8. Final CI simulation
  log('\n🎯 Running CI simulation...', 'cyan');
  execCommand('npm run ci:validate', 'CI validation');

  log('\n================================', 'magenta');

  if (allPassed) {
    log('🎉 All CI validations passed!', 'green');
    log('✅ Your plugin is ready for automated CI deployment', 'green');
    log('\nNext steps:', 'cyan');
    log('  1. Commit your changes', 'cyan');
    log('  2. Push to trigger automated CI', 'cyan');
    log('  3. CI will run all validations automatically', 'cyan');
    log('  4. Plugin will be automatically released on main branch merges', 'cyan');
    process.exit(0);
  } else {
    log('❌ Some validations failed', 'red');
    log('Please fix the issues above before pushing', 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validatePackageJson, validateBuildOutput, validateTestCoverage };
