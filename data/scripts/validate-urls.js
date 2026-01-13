#!/usr/bin/env node

/**
 * URL Validation Script for Schulferien Data
 *
 * Validates all URLs in JSON and Markdown files, reporting:
 * - File path
 * - Line number
 * - URL
 * - Status (valid/invalid/error)
 *
 * Usage:
 *   node validate-urls.js                           # Validate all files in data/schulferien/
 *   node validate-urls.js path/to/file.json         # Validate specific file
 *   node validate-urls.js --dns-only                # Only check DNS resolution (faster)
 *   node validate-urls.js --concurrency=20          # Set parallel requests (default: 10)
 */

const fs = require('fs');
const path = require('path');
const dns = require('dns');
const { URL } = require('url');

// Configuration
const DEFAULT_CONCURRENCY = 10;
const REQUEST_TIMEOUT = 10000; // 10 seconds
const DEFAULT_DATA_PATH = 'data/schulferien/2026-01-10';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dnsOnly: args.includes('--dns-only'),
  concurrency: DEFAULT_CONCURRENCY,
  files: []
};

args.forEach(arg => {
  if (arg.startsWith('--concurrency=')) {
    options.concurrency = parseInt(arg.split('=')[1], 10) || DEFAULT_CONCURRENCY;
  } else if (!arg.startsWith('--')) {
    options.files.push(arg);
  }
});

// Statistics
const stats = {
  total: 0,
  valid: 0,
  invalid: 0,
  errors: 0,
  skipped: 0
};

// Results storage
const results = {
  valid: [],
  invalid: [],
  errors: []
};

/**
 * Extract URLs from a file with line numbers
 */
function extractUrlsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const urlRegex = /https?:\/\/[^\s"'<>\]\)]+/g;
  const urls = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    let match;
    while ((match = urlRegex.exec(line)) !== null) {
      // Clean up URL (remove trailing punctuation that's not part of URL)
      let url = match[0].replace(/[,;.]+$/, '');

      // Skip template patterns (URLs with placeholders like {name}, [name], <name>)
      if (/[\{\}\[\]<>]/.test(url)) {
        continue;
      }

      // Skip truncated/placeholder URLs with "..."
      if (url.includes('...')) {
        continue;
      }

      // Skip incomplete URLs
      if (url === 'https://' || url === 'http://') {
        continue;
      }

      // Skip URLs that are clearly patterns/examples (contain placeholder indicators)
      if (url.includes('example.com') || url.includes('placeholder')) {
        continue;
      }

      urls.push({
        url,
        file: filePath,
        line: lineNumber
      });
    }
  });

  return urls;
}

/**
 * Find all JSON and MD files in a directory
 */
function findFiles(dir, extensions = ['.json', '.md']) {
  const files = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        // Skip data subdirectories with PDFs
        if (entry.name !== 'data' || !currentDir.includes('schulferien')) {
          walk(fullPath);
        }
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Check if a domain resolves via DNS
 */
function checkDns(hostname) {
  return new Promise((resolve) => {
    dns.lookup(hostname, (err) => {
      resolve(!err);
    });
  });
}

/**
 * Validate a URL using HTTP HEAD request
 */
async function validateUrl(urlInfo) {
  const { url, file, line } = urlInfo;

  try {
    const parsedUrl = new URL(url);

    // First check DNS
    const dnsValid = await checkDns(parsedUrl.hostname);
    if (!dnsValid) {
      return {
        ...urlInfo,
        status: 'invalid',
        reason: 'DNS resolution failed',
        hostname: parsedUrl.hostname
      };
    }

    if (options.dnsOnly) {
      return {
        ...urlInfo,
        status: 'valid',
        reason: 'DNS resolved'
      };
    }

    // Try HTTP HEAD request
    const http = parsedUrl.protocol === 'https:' ? require('https') : require('http');

    return new Promise((resolve) => {
      const req = http.request(url, {
        method: 'HEAD',
        timeout: REQUEST_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; URLValidator/1.0)'
        }
      }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve({
            ...urlInfo,
            status: 'valid',
            httpStatus: res.statusCode
          });
        } else if (res.statusCode >= 400) {
          resolve({
            ...urlInfo,
            status: 'invalid',
            reason: `HTTP ${res.statusCode}`,
            httpStatus: res.statusCode
          });
        } else {
          resolve({
            ...urlInfo,
            status: 'valid',
            httpStatus: res.statusCode
          });
        }
      });

      req.on('error', (err) => {
        resolve({
          ...urlInfo,
          status: 'error',
          reason: err.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          ...urlInfo,
          status: 'error',
          reason: 'Request timeout'
        });
      });

      req.end();
    });

  } catch (err) {
    return {
      ...urlInfo,
      status: 'error',
      reason: err.message
    };
  }
}

/**
 * Process URLs with concurrency limit
 */
async function processUrls(urls) {
  const queue = [...urls];
  const inProgress = new Set();
  const results = [];

  return new Promise((resolve) => {
    function processNext() {
      while (inProgress.size < options.concurrency && queue.length > 0) {
        const urlInfo = queue.shift();
        const promise = validateUrl(urlInfo).then((result) => {
          inProgress.delete(promise);
          results.push(result);

          // Progress indicator
          const done = results.length;
          const total = urls.length;
          process.stdout.write(`\rValidating: ${done}/${total} (${Math.round(done/total*100)}%)`);

          processNext();
        });
        inProgress.add(promise);
      }

      if (inProgress.size === 0 && queue.length === 0) {
        console.log('\n');
        resolve(results);
      }
    }

    processNext();
  });
}

/**
 * Format result for output
 */
function formatResult(result) {
  const location = `${result.file}:${result.line}`;
  const status = result.status.toUpperCase();
  const reason = result.reason ? ` (${result.reason})` : '';
  return `  ${location}\n    ${result.url}\n    Status: ${status}${reason}`;
}

/**
 * Main function
 */
async function main() {
  console.log('URL Validation Script');
  console.log('=====================\n');

  // Determine files to process
  let files = options.files;
  if (files.length === 0) {
    const dataPath = path.resolve(process.cwd(), DEFAULT_DATA_PATH);
    if (fs.existsSync(dataPath)) {
      files = findFiles(dataPath);
    } else {
      console.error(`Error: Default data path not found: ${dataPath}`);
      process.exit(1);
    }
  }

  // Validate file paths
  files = files.filter(f => {
    if (!fs.existsSync(f)) {
      console.error(`Warning: File not found: ${f}`);
      return false;
    }
    return true;
  });

  if (files.length === 0) {
    console.error('No files to process');
    process.exit(1);
  }

  console.log(`Files to process: ${files.length}`);
  console.log(`Mode: ${options.dnsOnly ? 'DNS only' : 'Full HTTP validation'}`);
  console.log(`Concurrency: ${options.concurrency}\n`);

  // Extract all URLs
  console.log('Extracting URLs...');
  let allUrls = [];
  for (const file of files) {
    const urls = extractUrlsFromFile(file);
    allUrls = allUrls.concat(urls);
  }

  // Deduplicate by URL but keep all locations
  const urlMap = new Map();
  for (const urlInfo of allUrls) {
    if (!urlMap.has(urlInfo.url)) {
      urlMap.set(urlInfo.url, []);
    }
    urlMap.get(urlInfo.url).push({ file: urlInfo.file, line: urlInfo.line });
  }

  const uniqueUrls = Array.from(urlMap.keys()).map(url => ({
    url,
    locations: urlMap.get(url),
    file: urlMap.get(url)[0].file,
    line: urlMap.get(url)[0].line
  }));

  console.log(`Total URLs found: ${allUrls.length}`);
  console.log(`Unique URLs: ${uniqueUrls.length}\n`);

  // Validate URLs
  const validationResults = await processUrls(uniqueUrls);

  // Categorize results
  const invalid = validationResults.filter(r => r.status === 'invalid');
  const errors = validationResults.filter(r => r.status === 'error');
  const valid = validationResults.filter(r => r.status === 'valid');

  // Output results
  console.log('Results Summary');
  console.log('---------------');
  console.log(`Valid:   ${valid.length}`);
  console.log(`Invalid: ${invalid.length}`);
  console.log(`Errors:  ${errors.length}`);
  console.log('');

  if (invalid.length > 0) {
    console.log('INVALID URLs:');
    console.log('=============');
    for (const result of invalid) {
      console.log(formatResult(result));
      if (result.locations && result.locations.length > 1) {
        console.log('    Also found at:');
        for (const loc of result.locations.slice(1)) {
          console.log(`      ${loc.file}:${loc.line}`);
        }
      }
      console.log('');
    }
  }

  if (errors.length > 0) {
    console.log('ERRORS (could not validate):');
    console.log('============================');
    for (const result of errors) {
      console.log(formatResult(result));
      console.log('');
    }
  }

  // Exit with error code if invalid URLs found
  if (invalid.length > 0) {
    console.log(`\nValidation FAILED: ${invalid.length} invalid URL(s) found`);
    process.exit(1);
  } else if (errors.length > 0) {
    console.log(`\nValidation completed with ${errors.length} error(s) (URLs could not be checked)`);
    process.exit(0);
  } else {
    console.log('\nValidation PASSED: All URLs are valid');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
