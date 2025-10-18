#!/usr/bin/env node

/**
 * Dynamic Check Runner
 * Automatically detects and runs available quality checks from package.json
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const scripts = packageJson.scripts || {};

// Define check patterns and their priorities
const checkPatterns = [
  { pattern: /^type-?check/, name: 'Type Checking', priority: 1 },
  { pattern: /^lint(?!:)/, name: 'Linting', priority: 2 },
  { pattern: /^format(?!:)/, name: 'Formatting', priority: 3 },
  { pattern: /^test(?!:)/, name: 'Testing', priority: 4 },
  { pattern: /^validate/, name: 'Validation', priority: 5 },
  { pattern: /^check/, name: 'Quality Checks', priority: 6 },
  { pattern: /^audit/, name: 'Security Audit', priority: 7 },
];

console.log('🔍 Discovering available quality checks...\n');

const discoveredChecks = [];

// Find matching scripts
Object.keys(scripts).forEach(scriptName => {
  checkPatterns.forEach(({ pattern, name, priority }) => {
    if (pattern.test(scriptName)) {
      discoveredChecks.push({
        script: scriptName,
        name,
        priority,
        command: scripts[scriptName]
      });
    }
  });
});

// Sort by priority
discoveredChecks.sort((a, b) => a.priority - b.priority);

if (discoveredChecks.length === 0) {
  console.log('⚠️  No quality check scripts found in package.json');
  process.exit(0);
}

console.log(`Found ${discoveredChecks.length} check(s):\n`);
discoveredChecks.forEach(({ script, name }) => {
  console.log(`  ✓ ${name}: npm run ${script}`);
});
console.log('');

// Run each check
let failedChecks = [];
let passedChecks = [];

discoveredChecks.forEach(({ script, name }) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${name} (npm run ${script})`);
  console.log('='.repeat(60));
  
  try {
    execSync(`npm run ${script}`, { 
      stdio: 'inherit',
      env: { ...process.env, CI: 'true' }
    });
    passedChecks.push(name);
    console.log(`✅ ${name} passed`);
  } catch (error) {
    failedChecks.push(name);
    console.log(`❌ ${name} failed`);
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passedChecks.length}`);
console.log(`❌ Failed: ${failedChecks.length}`);

if (failedChecks.length > 0) {
  console.log('\nFailed checks:');
  failedChecks.forEach(check => console.log(`  - ${check}`));
  process.exit(1);
}

console.log('\n🎉 All checks passed!');
