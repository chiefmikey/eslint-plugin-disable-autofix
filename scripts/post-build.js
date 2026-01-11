#!/usr/bin/env node

/**
 * Cross-platform post-build script to fix CommonJS exports for compatibility
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix CommonJS exports for Node.js compatibility
    content = content.replace(/exports\.default/g, 'module.exports');
    content = content.replace(/export default/g, 'export =');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed exports in ${path.relative(process.cwd(), filePath)}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    process.exit(1);
  }
}

function processDistFiles() {
  const files = [
    path.join(distDir, 'index.js'),
    path.join(distDir, 'index.d.ts')
  ];

  files.forEach(file => {
    if (fs.existsSync(file)) {
      fixFile(file);
    } else {
      console.warn(`File not found: ${path.relative(process.cwd(), file)}`);
    }
  });
}

if (require.main === module) {
  processDistFiles();
}

module.exports = { fixFile, processDistFiles };
