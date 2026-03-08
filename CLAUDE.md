# Project CLAUDE.md - eslint-plugin-disable-autofix

## Project Overview

ESLint plugin that lets you disable autofix for specific rules without turning them off. Rules still report violations but won't auto-fix, useful when you want warnings/errors but don't want `eslint --fix` to change certain patterns. Also strips IDE suggestions.

## Tech Stack

- **Language:** TypeScript (source), JavaScript (dist)
- **Runtime:** Node.js >=18.18.0
- **Testing:** Jest (v9 tests) + Node.js built-in test runner (integration tests)
- **Build:** TypeScript compiler (`tsc`) + LICENSE copy
- **Package:** Published to npm as `eslint-plugin-disable-autofix` from `dist/`

## Architecture

```
src/index.ts              # Main plugin source — single file
dist/                     # Build output (published to npm)
  index.js                # Compiled plugin
  index.d.ts              # TypeScript declarations
  package.json            # npm package metadata (separate from root)
  LICENSE                 # Copied during build
tests/
  v9/                     # Jest test suite for ESLint v9+ flat config
  integration.test.js     # Node.js native test runner (for ESM plugins)
```

## Commands

```bash
npm run build         # Compile TypeScript to dist/ + copy LICENSE
npm test              # Build + install dist + run Jest + integration tests
npm run test:quick    # Jest + integration tests (skip build)
npm run ci            # Build + Jest + integration tests (skip install)
npm run publish       # Publish dist/ to npm (requires npm login + OTP)
```

## Key APIs

- **Default export**: Plugin instance with `rules`, `configure()`, `createPlugin()`
- **`configure(rules)`**: Returns flat config object with correct prefixes
- **`createPlugin({ mode, plugins })`**: Factory for selective stripping modes
- **Modes**: `'all'` (default), `'fix'` (keep suggestions), `'suggest'` (keep fix)

## Conventions

- Source is a single `index.ts` file
- Build output goes to `dist/` which is the actual npm package
- ESLint 9 and 10 compatible (flat config only)
- `file:dist` self-dependency used for testing the built package locally
- Builtin rules loaded via `eslint/use-at-your-own-risk` API (filesystem fallback)
- Plugin rules discovered by scanning node_modules (lazy require on access)
- Version must be bumped in 3 places: `package.json`, `dist/package.json`, `src/index.ts`
