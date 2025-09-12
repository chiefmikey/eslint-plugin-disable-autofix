#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('Building eslint-plugin-disable-autofix...');

try {
  // Clean dist directory
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Build TypeScript
  console.log('Compiling TypeScript...');
  execSync('tsc', { stdio: 'inherit' });

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

  console.log('Build completed successfully!');
  console.log('Output:');
  console.log('  - dist/index.js');
  console.log('  - dist/index.d.ts');

} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
