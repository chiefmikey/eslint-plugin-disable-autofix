# Contributing

Thank you for your interest in contributing to eslint-plugin-disable-autofix!

## Development Setup

### Prerequisites

- Node.js 14.17.0 or higher
- npm 7 or higher
- Git

### Getting Started

1. **Fork and clone the repository**
   ```bash
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

## Project Structure

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
└── .github/              # GitHub workflows
```

## Making Changes

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

### Writing Tests

Add tests in the appropriate test file:
- Unit tests: Test individual functions and modules
- Integration tests: Test plugin functionality with ESLint
- Performance tests: Benchmark plugin performance

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

## Issue Guidelines

### Reporting Bugs

Include:
- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Environment details (Node.js, ESLint, OS versions)

### Feature Requests

Include:
- Description of the problem
- Proposed solution
- Alternative solutions considered
- Additional context

## Release Process

We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. Update version: `npm version patch|minor|major`
2. Update changelog
3. Create release and publish to npm

## Getting Help

- [Documentation](https://github.com/chiefmikey/eslint-plugin-disable-autofix#readme)
- [Report Issues](https://github.com/chiefmikey/eslint-plugin-disable-autofix/issues)
- [Discussions](https://github.com/chiefmikey/eslint-plugin-disable-autofix/discussions)
- [Email Support](mailto:wolfe@mikl.io)
