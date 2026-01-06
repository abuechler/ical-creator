#!/usr/bin/env node
/**
 * Generates a GitHub Job Summary from Playwright test results.
 *
 * Usage: node scripts/generate-summary.js [results.json] [--online-validation]
 *
 * Reads Playwright JSON report and outputs GitHub-flavored markdown
 * suitable for $GITHUB_STEP_SUMMARY.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const isOnlineValidation = args.includes('--online-validation');
const resultsFile = args.find(arg => !arg.startsWith('--')) || 'test-results/results.json';

function getStatusEmoji(status) {
  switch (status) {
    case 'passed': return '✅';
    case 'failed': return '❌';
    case 'skipped': return '⏭️';
    case 'timedOut': return '⏱️';
    default: return '❓';
  }
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(2);
  return `${seconds}s`;
}

function extractErrorMessage(result) {
  if (!result.error) return null;

  // Try to extract a meaningful error message
  const error = result.error;
  if (error.message) {
    // Truncate long messages
    const msg = error.message.split('\n')[0];
    return msg.length > 200 ? msg.substring(0, 200) + '...' : msg;
  }
  return 'Unknown error';
}

function generateSummary(report) {
  const lines = [];

  // Header
  const title = isOnlineValidation ? 'Online Validation Results' : 'Test Results';
  lines.push(`# ${getStatusEmoji(report.stats?.failed > 0 ? 'failed' : 'passed')} ${title}`);
  lines.push('');

  // Summary stats
  const stats = report.stats || {};
  const total = stats.expected || 0;
  const passed = (stats.expected || 0) - (stats.unexpected || 0) - (stats.skipped || 0);
  const failed = stats.unexpected || 0;
  const skipped = stats.skipped || 0;
  const duration = formatDuration(stats.duration || 0);

  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| ✅ Passed | ${passed} |`);
  lines.push(`| ❌ Failed | ${failed} |`);
  lines.push(`| ⏭️ Skipped | ${skipped} |`);
  lines.push(`| **Total** | **${total}** |`);
  lines.push(`| ⏱️ Duration | ${duration} |`);
  lines.push('');

  // Test details table
  lines.push('## Test Cases');
  lines.push('');
  lines.push('| Status | Test Suite | Test Case | Duration |');
  lines.push('|--------|------------|-----------|----------|');

  // Process each suite
  const suites = report.suites || [];
  for (const suite of suites) {
    processSuite(suite, lines, '');
  }

  lines.push('');

  // Failed tests details
  const failedTests = collectFailedTests(suites);
  if (failedTests.length > 0) {
    lines.push('## Failed Tests Details');
    lines.push('');

    for (const test of failedTests) {
      lines.push(`### ❌ ${test.title}`);
      lines.push('');
      if (test.error) {
        lines.push('```');
        lines.push(test.error);
        lines.push('```');
        lines.push('');
      }
    }
  }

  // ICS files generated (for main tests)
  if (!isOnlineValidation) {
    const icsFiles = listIcsFiles();
    if (icsFiles.length > 0) {
      lines.push('## Generated iCal Files');
      lines.push('');
      lines.push('The following iCal files were generated during testing:');
      lines.push('');
      for (const file of icsFiles) {
        lines.push(`- \`${file}\``);
      }
      lines.push('');
      lines.push('> These files are available in the **test-results** artifact.');
      lines.push('');
    }
  }

  // Online validation screenshots
  if (isOnlineValidation) {
    const screenshots = listScreenshots();
    if (screenshots.length > 0) {
      lines.push('## Validation Screenshots');
      lines.push('');
      lines.push('Screenshots captured during online validation:');
      lines.push('');
      for (const file of screenshots) {
        lines.push(`- \`${file}\``);
      }
      lines.push('');
      lines.push('> Screenshots are available in the **online-validation-results** artifact.');
      lines.push('');
    }
  }

  return lines.join('\n');
}

function processSuite(suite, lines, parentTitle) {
  const suiteTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;

  // Process specs in this suite
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      const result = test.results?.[test.results.length - 1] || {};
      const status = result.status || 'unknown';
      const duration = formatDuration(result.duration || 0);

      lines.push(`| ${getStatusEmoji(status)} | ${suiteTitle} | ${spec.title} | ${duration} |`);
    }
  }

  // Process nested suites
  for (const childSuite of suite.suites || []) {
    processSuite(childSuite, lines, suiteTitle);
  }
}

function collectFailedTests(suites) {
  const failed = [];

  function process(suite, parentTitle) {
    const suiteTitle = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;

    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const result = test.results?.[test.results.length - 1] || {};
        if (result.status === 'failed' || result.status === 'timedOut') {
          failed.push({
            title: `${suiteTitle} > ${spec.title}`,
            error: extractErrorMessage(result)
          });
        }
      }
    }

    for (const childSuite of suite.suites || []) {
      process(childSuite, suiteTitle);
    }
  }

  for (const suite of suites) {
    process(suite, '');
  }

  return failed;
}

function listIcsFiles() {
  const outputDir = path.resolve('test-output');
  if (!fs.existsSync(outputDir)) return [];

  return fs.readdirSync(outputDir)
    .filter(f => f.endsWith('.ics'))
    .sort();
}

function listScreenshots() {
  const outputDir = path.resolve('test-output');
  if (!fs.existsSync(outputDir)) return [];

  return fs.readdirSync(outputDir)
    .filter(f => f.endsWith('.png') || f.endsWith('.jpg'))
    .sort();
}

// Main
try {
  if (!fs.existsSync(resultsFile)) {
    console.error(`Results file not found: ${resultsFile}`);
    // Output a minimal summary
    console.log('# ⚠️ Test Results');
    console.log('');
    console.log('No test results file found. Tests may not have run.');
    process.exit(0);
  }

  const report = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
  const summary = generateSummary(report);
  console.log(summary);
} catch (error) {
  console.error('Error generating summary:', error.message);
  console.log('# ⚠️ Test Results');
  console.log('');
  console.log(`Error generating summary: ${error.message}`);
  process.exit(1);
}
