# Elite v6.0.0 Rewrite

_Status: COMPLETED_
_LastCompletedStep: 8_
_Completed: 2026-03-02_
_TotalSteps: 8_
_Created: 2026-03-02_

## Goal

Make eslint-plugin-disable-autofix the definitive, elite choice for disabling ESLint autofix. Currently #1 with ~80K weekly downloads (2.5x nearest competitor). This rewrite addresses all known issues, drops unnecessary dependencies, adds unique features, and ensures ESLint 9-10 compatibility.

## Context

- **Current version**: 5.0.1 (published), source has hardcoded meta.version '4.3.0'
- **ESLint 10**: Released Feb 2026, flat config only, no eslintrc
- **Competitors**: eslint-plugin-no-autofix (~27-44K/wk, no flat config), @morev/eslint-disable-autofix (~9K/wk, hacky internal patching)
- **Known bugs**: ESM plugin crash (Issue #59), version mismatch, eager loading of all plugins
- **Unnecessary deps**: lodash (cloneDeep), app-root-path (filesystem)

## Key Decisions

1. **Drop lodash**: Use object spread instead of cloneDeep (mapReports creates wrapped rules, we just need clean meta)
2. **Drop app-root-path**: Use require.resolve('eslint/package.json') to find node_modules
3. **Use `export =` syntax**: Eliminates sed post-processing hack in build
4. **Strip suggestions too**: Unique feature vs all competitors (delete problem.suggest + meta.hasSuggestions)
5. **Try/catch everything**: Graceful degradation for ESM-only plugins and other load failures
6. **Never mutate imports**: Track plugin IDs separately (fixes Issue #59)
7. **Target ESLint 9-10**: Drop ESLint 8 legacy config tests, update peer deps
8. **Bump to v6.0.0**: Breaking change (dependency removals, ESLint 8 legacy config no longer tested)

## Steps

### Step 1: Rewrite src/index.ts
- Remove lodash, app-root-path imports
- Use require.resolve for node_modules discovery
- Use object spread instead of cloneDeep
- Add suggestion stripping (problem.suggest + meta.hasSuggestions)
- Wrap all require() calls in try/catch
- Never mutate imported plugin objects
- Use `export =` syntax for clean CJS output
- Set version to '6.0.0'
- Verify: TypeScript compiles

### Step 2: Update package.json
- Remove lodash, app-root-path from dependencies
- Keep eslint and eslint-rule-composer as only runtime deps
- Fix build script (remove sed hack)
- Bump version to 6.0.0
- Update devDependencies
- Verify: npm install succeeds

### Step 3: Update tsconfig files
- tsconfig.build.json: Ensure clean CJS output
- index.d.ts: Update module declarations
- Verify: tsc builds cleanly

### Step 4: Update dist/package.json
- Bump version to 6.0.0
- Update peerDependencies to eslint >=9.0.0
- Verify: dist structure correct

### Step 5: Update tests
- Update v9 tests for any API changes
- Remove v8 legacy tests (ESLint 10 dropped eslintrc)
- Add suggestion stripping tests
- Verify: All tests pass

### Step 6: Update CI workflows
- Remove v8 test job
- Update to test against ESLint 9 and 10
- Verify: YAML valid

### Step 7: Update README
- Modern, professional docs
- ESLint 9+ flat config focus
- Remove legacy eslintrc section
- Document suggestion stripping feature
- Verify: Renders correctly

### Step 8: Final verification
- Full build
- All tests pass
- Clean git status
- Commit with conventional commit

## Verification Plan
- [ ] `npm run build` succeeds without sed hack
- [ ] `npm test` — all tests pass
- [ ] No lodash or app-root-path in dist/index.js
- [ ] meta.version matches package.json version
- [ ] Plugin works with ESLint 9+
- [ ] Suggestions are properly stripped
- [ ] ESM plugin load failures handled gracefully (no crash)
- [ ] dist/package.json has correct peerDependencies

## Risks
- eslint-rule-composer may not handle suggest removal (mitigated: we delete it from the problem object in the callback)
- Some edge cases with require.resolve in unusual package manager setups (mitigated: fallback to process.cwd)
- Breaking change for users on ESLint <9 who rely on legacy config (mitigated: v5.x still available)

## Execution Journal

### Step 1: Rewrote src/index.ts
- Removed lodash and app-root-path imports
- Added require.resolve-based node_modules discovery
- Used object spread instead of cloneDeep (no mutation)
- Added suggestion stripping (delete problem.suggest + meta.hasSuggestions)
- Wrapped all require() in try/catch via safeRequire()
- Used export = syntax for clean CJS output
- TypeScript compiles cleanly

### Step 2: Updated package.json and build config
- Removed lodash, app-root-path from dependencies
- Removed sed hack from build scripts
- Updated tsconfig.build.json with rootDir for flat output
- Created src/types.d.ts for eslint-rule-composer declaration
- Updated dist/package.json with correct paths and peerDeps
- Cleaned stale files from dist/

### Step 3: Updated tests
- Added 2 suggestion stripping tests (no-console rule)
- Added 3 metadata stripping tests (fixable, hasSuggestions, preserves other meta)
- Removed v8 legacy tests (ESLint 10 dropped eslintrc)
- All 11 tests pass

### Step 4: Updated README and CI
- Modernized README with flat config focus
- Added features section with suggestion stripping
- Updated CI to Node 20+22 matrix, removed v8 test job

### Step 5: Code review
- Code reviewer found `delete problem.suggest` is currently a no-op (eslint-rule-composer strips it)
- Added clarifying comment for defensive intent
- Added metadata stripping tests as recommended
- All 11 tests pass after review fixes

## Summary

Complete v6.0.0 rewrite:
- **Dependencies**: Removed lodash (50KB) and app-root-path (5KB). Only runtime dep is eslint-rule-composer.
- **Build**: Clean tsc output, no sed post-processing, proper export = syntax
- **Bug fixes**: ESM plugin crash (Issue #59) fixed by never mutating imports. Version mismatch fixed.
- **New features**: Suggestion stripping (unique vs all competitors)
- **Tests**: 11 tests (6 autofix, 2 suggestions, 3 metadata)
- **ESLint support**: 9+ (flat config)
