# GitHub Actions Workflows

This project includes comprehensive CI/CD workflows for automated testing, building, and deployment.

## Available Workflows

### 1. CI/CD Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual dispatch with custom parameters

**Jobs:**
- **Lint & Type Check** - ESLint and TypeScript validation
- **Test Suite** - Runs tests across Node.js 18, 20, and 21
- **Build Package** - Builds the package for distribution
- **Security Audit** - Runs npm audit and Snyk security scans
- **Publish to NPM** - Automatically publishes to NPM on main branch pushes
- **PR Gate Check** - Final validation for pull requests

**Manual Parameters:**
- Node.js version (18, 20, 21)
- Enable/disable tests, linting, and build steps

### 2. Manual Testing (`manual-test.yml`)

**Triggers:**
- Manual dispatch only

**Test Types:**
- `all` - Run all tests with coverage and build
- `unit` - Run unit tests only
- `integration` - Run integration tests
- `coverage` - Run tests with coverage report
- `performance` - Run performance tests

**Parameters:**
- Test type selection
- Node.js version (18, 20, 21)
- ESLint version (default: latest)

### 3. Release Management (`release.yml`)

**Triggers:**
- Git tags (v*)
- Manual dispatch for version bumping

**Features:**
- Automatic NPM publishing on tag push
- GitHub release creation
- Version bumping with changelog updates
- Pull request creation for version bumps

## Workflow Usage

### Running Manual Tests

1. Go to **Actions** tab in GitHub
2. Select **Manual Testing** workflow
3. Click **Run workflow**
4. Choose your parameters:
   - Test type (all, unit, integration, coverage, performance)
   - Node.js version (18, 20, 21)
   - ESLint version (optional)

### Running Full CI Pipeline

1. Go to **Actions** tab in GitHub
2. Select **CI/CD Pipeline** workflow
3. Click **Run workflow**
4. Choose your parameters:
   - Node.js version (18, 20, 21)
   - Enable/disable specific steps

### Creating Releases

#### Automatic Release (Recommended)
1. Create and push a git tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. The workflow will automatically:
   - Build the package
   - Run all tests
   - Publish to NPM
   - Create a GitHub release

#### Manual Version Bump
1. Go to **Actions** tab in GitHub
2. Select **Release Management** workflow
3. Click **Run workflow**
4. Choose version type (patch, minor, major)
5. A pull request will be created for review

## PR Gate Requirements

All pull requests must pass:

- ✅ **Linting** - ESLint passes without errors
- ✅ **Type Checking** - TypeScript compilation succeeds
- ✅ **Tests** - All tests pass across Node.js 18, 20, 21
- ✅ **Build** - Package builds successfully
- ✅ **Security** - No high-severity vulnerabilities

## Local Development

### Running Tests Locally

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run with coverage
npm run test:coverage

# Run in CI mode
npm run test:ci

# Run in watch mode
npm run test:watch

# Debug tests
npm run test:debug
```

### Running Linting

```bash
# Check for linting errors
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Type checking
npm run type-check

# Full validation
npm run validate
```

## Workflow Status

- 🟢 **Green** - All checks passed, ready to merge
- 🟡 **Yellow** - Some checks pending
- 🔴 **Red** - Checks failed, needs attention

## Troubleshooting

### Common Issues

1. **Tests failing on Node.js 18**
   - Check if any dependencies require newer Node.js features
   - Update test configuration if needed

2. **Build failures**
   - Ensure all dependencies are installed
   - Check TypeScript compilation errors

3. **Linting failures**
   - Run `npm run lint:fix` to auto-fix issues
   - Check ESLint configuration

4. **Security audit failures**
   - Update vulnerable dependencies
   - Check Snyk scan results

### Getting Help

- Check the **Actions** tab for detailed logs
- Review the **Checks** tab on pull requests
- Contact maintainers for workflow issues
