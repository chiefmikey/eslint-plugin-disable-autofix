#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building eslint-plugin-disable-autofix...');

try {
  // Clean dist directory
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Build TypeScript (CJS version)
  console.log('Compiling TypeScript (CJS)...');
  execSync('tsc -p tsconfig.build.json', { stdio: 'inherit' });

  // Build ESM version
  console.log('Building ESM version...');
  execSync('tsc -p tsconfig.esm.json', { stdio: 'inherit' });

  // Copy ESM files to main dist directory
  console.log('Copying ESM files to main dist...');
  if (fs.existsSync('dist/esm/index.js')) {
    fs.copyFileSync('dist/esm/index.js', 'dist/index.js');
  }
  if (fs.existsSync('dist/types/index.d.ts')) {
    fs.copyFileSync('dist/types/index.d.ts', 'dist/index.d.ts');
  }

  // The CJS version is already built by the first tsc command
  console.log('CJS version already built in dist/cjs/');

  // Create package.json for main dist
  const mainPackageJson = {
    name: 'eslint-plugin-disable-autofix',
    version: require('../package.json').version,
    main: './index.js',
    types: './index.d.ts',
    files: ['index.js', 'index.d.ts'],
    peerDependencies: {
      eslint: '>=6.0.0'
    }
  };

  fs.writeFileSync('dist/package.json', JSON.stringify(mainPackageJson, null, 2));

  // Create package.json for CJS
  const cjsPackageJson = {
    name: 'eslint-plugin-disable-autofix',
    version: require('../package.json').version,
    main: './index.js',
    types: './index.d.ts',
    files: ['index.js', 'index.d.ts'],
    peerDependencies: {
      eslint: '>=6.0.0'
    }
  };

  fs.writeFileSync('dist/cjs/package.json', JSON.stringify(cjsPackageJson, null, 2));

  console.log('Build completed successfully!');
  console.log('Output:');
  console.log('  - dist/index.js (ESM)');
  console.log('  - dist/index.d.ts (Types)');
  console.log('  - dist/cjs/index.js (CJS)');
  console.log('  - dist/cjs/index.d.ts (Types)');

} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
