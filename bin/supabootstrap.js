#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Check if we're in development (TypeScript files exist) or production (dist exists)
const distPath = path.join(__dirname, '..', 'dist', 'index.js');
const srcPath = path.join(__dirname, '..', 'src', 'index.ts');

if (fs.existsSync(distPath)) {
  // Production mode - use compiled JavaScript
  require(distPath);
} else if (fs.existsSync(srcPath)) {
  // Development mode - use ts-node if available
  try {
    require('ts-node/register');
    require(srcPath);
  } catch (error) {
    console.error('❌ Development mode requires ts-node. Install it with:');
    console.error('npm install -g ts-node');
    console.error('or run "npm run build" to compile first.');
    process.exit(1);
  }
} else {
  console.error('❌ Could not find supabootstrap entry point.');
  console.error('Make sure you have built the project with "npm run build"');
  process.exit(1);
}