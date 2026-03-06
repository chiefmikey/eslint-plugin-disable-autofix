# Project CLAUDE.md - eslint-plugin-disable-autofix

## Project Overview

ESLint plugin that lets you disable autofix for specific rules without turning them off. Rules still report violations but won't auto-fix, useful when you want warnings/errors but don't want `eslint --fix` to change certain patterns.

## Tech Stack

- **Language:** TypeScript (source), JavaScript (dist)
- **Runtime:** Node.js
- **Testing:** Jest (v9 tests) + Node.js built-in test runner (integration tests)
- **Build:** TypeScript compiler (`tsc`)
- **Package:** Published to npm as `eslint-plugin-disable-autofix`

## Architecture

```
index.ts              # Main plugin source — wraps ESLint rules to strip autofix
dist/                 # Build output (published to npm)
tests/
  v9/                 # Jest test suite for ESLint v9+ flat config
  integration.test.js # Node.js native test runner integration tests
```

## Commands

```bash
npm run build         # Compile TypeScript to dist/
npm test              # Build + install dist + run Jest + integration tests
npm run test:quick    # Jest + integration tests (skip build)
npm run ci            # Build + Jest + integration tests (skip install)
npm run publish       # Publish dist/ to npm
```

## Conventions

- Source is a single `index.ts` file
- Build output goes to `dist/` which is the actual npm package
- ESLint v10 compatible (flat config support)
- `file:dist` self-dependency used for testing the built package locally
