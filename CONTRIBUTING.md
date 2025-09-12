# Contributing to eslint-plugin-disable-autofix

Thank you for your interest in contributing to eslint-plugin-disable-autofix! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issue Guidelines](#issue-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Release Process](#release-process)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 14.17.0 or higher
- npm 7 or higher
- Git

### Development Setup

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/eslint-plugin-disable-autofix.git
   cd eslint-plugin-disable-autofix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Development

### Project Structure

```
eslint-plugin-disable-autofix/
├── src/                    # Source code
│   ├── index.ts           # Main plugin file
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility modules
├── tests/                 # Test files
│   ├── v8/               # ESLint v8 tests
│   ├── v9/               # ESLint v9 tests
│   └── benchmark.test.ts # Performance tests
├── benchmark/             # Benchmark files
├── .github/              # GitHub workflows
└── docs/                 # Documentation
```

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Run tests and linting**
   ```bash
   npm run validate
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific ESLint version tests
npm run gh-test-v8  # ESLint v8
npm run gh-test-v9  # ESLint v9

# Run benchmarks
npm run benchmark

# Run linting
npm run lint

# Run type checking
npx tsc --noEmit
```

### Test Structure

- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: Test plugin functionality with ESLint
- **Performance Tests**: Benchmark plugin performance
- **Compatibility Tests**: Test with different ESLint versions

### Writing Tests

1. **Unit Tests**: Add tests in the appropriate test file
2. **Integration Tests**: Add tests in `tests/v8/` or `tests/v9/`
3. **Performance Tests**: Add benchmarks in `benchmark/`

Example test:

```typescript
import { describe, expect, it } from '@jest/globals';
import { disableFix } from '../src/index';

describe('disableFix', () => {
  it('should remove fixable property from rule meta', () => {
    const rule = {
      meta: { fixable: 'code' },
      create: () => ({})
    };

    const result = disableFix(rule);
    expect(result.meta.fixable).toBeUndefined();
  });
});
```

## Submitting Changes

### Commit Guidelines

Use conventional commits:

```
feat: add new performance mode option
fix: resolve plugin loading error
docs: update README with new examples
test: add tests for error recovery
perf: optimize rule processing
```

### Pull Request Process

1. **Create a pull request**
   - Use a descriptive title
   - Reference any related issues
   - Provide a clear description

2. **Ensure all checks pass**
   - Tests pass
   - Linting passes
   - Type checking passes
   - Build succeeds

3. **Request review**
   - Assign reviewers
   - Respond to feedback
   - Make requested changes

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Tests pass
- [ ] New tests added
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Issue Guidelines

### Reporting Bugs

Use the bug report template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Environment:**
- Node.js version:
- ESLint version:
- Plugin version:
- OS:

**Additional context**
Add any other context about the problem here.
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
A clear description of any alternative solutions.

**Additional context**
Add any other context or screenshots about the feature request.
```

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Update version**
   ```bash
   npm version patch|minor|major
   ```

2. **Update changelog**
   - Add entry to CHANGELOG.md
   - Include all changes since last release

3. **Create release**
   - Push tags: `git push --tags`
   - Create GitHub release
   - Publish to npm: `npm run publish`

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Release notes prepared
- [ ] Published to npm

## Development Tips

### Debugging

Enable debug mode:

```bash
DEBUG=1 npm test
```

### Performance Profiling

Run benchmarks:

```bash
npm run benchmark
```

### TypeScript

Use TypeScript for better development experience:

```bash
npx tsc --watch
```

## Getting Help

- 📖 [Documentation](https://github.com/chiefmikey/eslint-plugin-disable-autofix#readme)
- 🐛 [Report Issues](https://github.com/chiefmikey/eslint-plugin-disable-autofix/issues)
- 💬 [Discussions](https://github.com/chiefmikey/eslint-plugin-disable-autofix/discussions)
- 📧 [Email Support](mailto:wolfe@mikl.io)

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing to eslint-plugin-disable-autofix! 🎉
