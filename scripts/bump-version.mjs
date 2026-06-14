#!/usr/bin/env node
// Atomically bumps the version in all three locations:
//   package.json, dist/package.json, src/index.ts
// Usage: node scripts/bump-version.mjs <new-version>

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('ERROR: No version argument provided.');
  console.error('Usage: node scripts/bump-version.mjs <new-version>');
  console.error('Example: node scripts/bump-version.mjs 6.2.0');
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(newVersion)) {
  console.error(`ERROR: Invalid version "${newVersion}".`);
  console.error('Expected semver format: X.Y.Z or X.Y.Z-prerelease');
  process.exit(1);
}

const files = [
  { path: resolve(root, 'package.json'), type: 'json' },
  { path: resolve(root, 'dist', 'package.json'), type: 'json' },
  { path: resolve(root, 'src', 'index.ts'), type: 'ts' },
];

// Validate all files exist before making any changes (fail loudly, atomically)
for (const file of files) {
  if (!existsSync(file.path)) {
    console.error(`ERROR: Expected file not found: ${file.path}`);
    process.exit(1);
  }
}

const updates = [];

for (const file of files) {
  const content = readFileSync(file.path, 'utf8');
  let oldVersion;
  let newContent;

  if (file.type === 'json') {
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error(`ERROR: Failed to parse JSON in ${file.path}`);
      process.exit(1);
    }
    if (typeof parsed.version !== 'string') {
      console.error(`ERROR: No "version" field found in ${file.path}`);
      process.exit(1);
    }
    oldVersion = parsed.version;
    parsed.version = newVersion;
    // Preserve trailing newline if present, use 2-space indent
    const trailingNewline = content.endsWith('\n') ? '\n' : '';
    newContent = JSON.stringify(parsed, null, 2) + trailingNewline;
  } else if (file.type === 'ts') {
    // Match the exact declaration: const VERSION = '<version>';
    const pattern = /^(const VERSION = ')([^']+)(';)$/m;
    const match = content.match(pattern);
    if (!match) {
      console.error(
        `ERROR: Could not find "const VERSION = '...'" pattern in ${file.path}`,
      );
      console.error(
        "The VERSION constant must be declared as: const VERSION = 'x.y.z';",
      );
      process.exit(1);
    }
    oldVersion = match[2];
    newContent = content.replace(pattern, `$1${newVersion}$3`);
  }

  updates.push({ file: file.path, oldVersion, newVersion, newContent });
}

// All validations passed — apply all changes
for (const { file, oldVersion, newContent } of updates) {
  writeFileSync(file, newContent, 'utf8');
  const rel = file.replace(root + '/', '');
  console.log(`  ${rel}: ${oldVersion} → ${newVersion}`);
}

console.log(`\nVersion bumped to ${newVersion} in ${updates.length} files.`);
