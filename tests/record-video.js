#!/usr/bin/env node
// @ts-check
/**
 * Generic Video Recording Utility for Playwright
 *
 * Usage:
 *   node tests/record-video.js <scenario-name> [options]
 *
 * Options:
 *   --desktop-only    Record only desktop viewport (1440x900)
 *   --mobile-only     Record only mobile viewport (375x812)
 *   --output-dir      Custom output directory (default: videos/)
 *   --duration        Extra wait time in ms after scenario (default: 2000)
 *
 * Examples:
 *   node tests/record-video.js confetti
 *   node tests/record-video.js form-validation --mobile-only
 *   node tests/record-video.js recurring-event --duration 5000
 *
 * To add a new scenario, add it to the SCENARIOS object below.
 */

const { firefox } = require('playwright');
const path = require('path');
const fs = require('fs');

// Page URL
const PAGE_URL = 'file://' + path.resolve(__dirname, '../ical-creator.html');

// Viewport configurations
const VIEWPORTS = {
  desktop: { width: 1440, height: 900, name: 'desktop' },
  mobile: { width: 375, height: 812, name: 'mobile' }
};

// ============================================================================
// SCENARIOS - Add your recording scenarios here
// Each scenario is an async function that receives the page object
// ============================================================================
const SCENARIOS = {

  /**
   * Confetti celebration animation on successful download
   */
  confetti: async (page) => {
    // Fill in the form
    await page.locator('#title').fill('Team Meeting');
    await page.locator('#startDate').fill('2026-02-15');
    await page.locator('#startTime').fill('10:00');
    await page.locator('#endDate').fill('2026-02-15');
    await page.locator('#endTime').fill('11:00');
    await page.locator('#location').fill('Conference Room A');

    // Wait to show filled form
    await page.waitForTimeout(1000);

    // Click download to trigger confetti
    await page.locator('#downloadBtn').click();

    // Wait for confetti animation
    await page.waitForSelector('.confetti-container', { state: 'visible', timeout: 3000 });
    await page.waitForTimeout(4500); // Full animation duration
  },

  /**
   * Form validation - showing required fields
   */
  'form-validation': async (page) => {
    // Show empty form first
    await page.waitForTimeout(1000);

    // Try to focus on download button (should be disabled)
    const downloadBtn = page.locator('#downloadBtn');
    await downloadBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Start filling form - title first
    await page.locator('#title').fill('My Event');
    await page.waitForTimeout(500);

    // Add date
    await page.locator('#startDate').fill('2026-03-15');
    await page.waitForTimeout(500);

    // Add time - button should now be enabled
    await page.locator('#startTime').fill('09:00');
    await page.waitForTimeout(1000);
  },

  /**
   * Creating a recurring event with weekly frequency
   */
  'recurring-weekly': async (page) => {
    // Fill basic details
    await page.locator('#title').fill('Weekly Team Sync');
    await page.locator('#startDate').fill('2026-02-02'); // Monday
    await page.locator('#startTime').fill('10:00');
    await page.locator('#endTime').fill('11:00');
    await page.waitForTimeout(500);

    // Enable recurring
    const slider = page.locator('#isRecurring').locator('xpath=following-sibling::span[@class="toggle-slider"]');
    await slider.scrollIntoViewIfNeeded();
    await slider.click();
    await page.waitForTimeout(500);

    // Select weekly
    await page.locator('#frequency').selectOption('WEEKLY');
    await page.waitForTimeout(500);

    // Add more days (Wednesday, Friday)
    await page.locator('button[data-day="WE"]').click();
    await page.waitForTimeout(300);
    await page.locator('button[data-day="FR"]').click();
    await page.waitForTimeout(1000);

    // Show calendar preview
    await page.locator('.calendar-grid').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
  },

  /**
   * Creating a monthly recurring event
   */
  'recurring-monthly': async (page) => {
    await page.locator('#title').fill('Monthly Review');
    await page.locator('#startDate').fill('2026-01-30'); // Last Friday
    await page.locator('#startTime').fill('14:00');
    await page.locator('#endTime').fill('15:00');
    await page.waitForTimeout(500);

    // Enable recurring
    const slider = page.locator('#isRecurring').locator('xpath=following-sibling::span[@class="toggle-slider"]');
    await slider.scrollIntoViewIfNeeded();
    await slider.click();
    await page.waitForTimeout(500);

    // Select monthly
    await page.locator('#frequency').selectOption('MONTHLY');
    await page.waitForTimeout(500);

    // Select by day of week
    await page.locator('input[name="monthlyType"][value="day"]').check();
    await page.waitForTimeout(500);

    // Set count to 12
    await page.locator('#occurrenceCount').fill('12');
    await page.waitForTimeout(1000);

    // Show calendar
    await page.locator('.calendar-grid').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
  },

  /**
   * Adding exception dates to a recurring event
   */
  'exception-dates': async (page) => {
    await page.locator('#title').fill('Weekly Meeting');
    await page.locator('#startDate').fill('2026-03-02');
    await page.locator('#startTime').fill('09:00');
    await page.waitForTimeout(300);

    // Enable recurring
    const slider = page.locator('#isRecurring').locator('xpath=following-sibling::span[@class="toggle-slider"]');
    await slider.click();
    await page.waitForTimeout(500);

    // Set count
    await page.locator('#occurrenceCount').fill('8');
    await page.waitForTimeout(500);

    // Scroll to calendar
    await page.locator('.calendar-grid').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Click on some event days to add exceptions
    const eventDays = page.locator('.calendar-grid .day.event');
    const count = await eventDays.count();
    if (count >= 3) {
      await eventDays.nth(1).click();
      await page.waitForTimeout(500);
      await eventDays.nth(3).click();
      await page.waitForTimeout(1000);
    }
  },

  /**
   * Setting up a reminder
   */
  'reminder': async (page) => {
    await page.locator('#title').fill('Important Meeting');
    await page.locator('#startDate').fill('2026-04-10');
    await page.locator('#startTime').fill('09:00');
    await page.locator('#endTime').fill('10:00');
    await page.waitForTimeout(500);

    // Enable reminder
    const reminderSlider = page.locator('#hasReminder').locator('xpath=following-sibling::span[@class="toggle-slider"]');
    await reminderSlider.scrollIntoViewIfNeeded();
    await reminderSlider.click();
    await page.waitForTimeout(500);

    // Change reminder time
    await page.locator('#reminderTime').selectOption('60'); // 1 hour
    await page.waitForTimeout(1000);
  },

  /**
   * Loading a saved/demo event
   */
  'load-saved-event': async (page) => {
    // Clear and reload to get demo events
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#title');
    await page.waitForTimeout(500);

    // Scroll to saved events
    const savedSection = page.locator('#savedEventsSection');
    await savedSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Click load on first demo event
    const loadBtn = page.locator('.saved-event-card').first().locator('button:has-text("Load")');
    await loadBtn.click();
    await page.waitForTimeout(500);

    // Scroll back to top to show loaded form
    await page.locator('#title').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
  },

  /**
   * All-day event toggle
   */
  'all-day-event': async (page) => {
    await page.locator('#title').fill('Company Holiday');
    await page.locator('#startDate').fill('2026-12-25');
    await page.locator('#startTime').fill('09:00');
    await page.locator('#endTime').fill('17:00');
    await page.waitForTimeout(500);

    // Toggle all-day
    await page.locator('#allDay').check();
    await page.waitForTimeout(1000);

    // Notice time fields are hidden
    await page.waitForTimeout(1000);
  },

  /**
   * Full workflow: create event and download
   */
  'full-workflow': async (page) => {
    // Fill form
    await page.locator('#title').fill('Project Kickoff');
    await page.locator('#startDate').fill('2026-02-20');
    await page.locator('#startTime').fill('10:00');
    await page.locator('#endDate').fill('2026-02-20');
    await page.locator('#endTime').fill('12:00');
    await page.locator('#location').fill('Main Conference Room');
    await page.locator('#description').fill('Kickoff meeting for the new project');
    await page.waitForTimeout(500);

    // Add reminder
    const reminderSlider = page.locator('#hasReminder').locator('xpath=following-sibling::span[@class="toggle-slider"]');
    await reminderSlider.scrollIntoViewIfNeeded();
    await reminderSlider.click();
    await page.waitForTimeout(500);

    // Download
    await page.locator('#downloadBtn').scrollIntoViewIfNeeded();
    await page.locator('#downloadBtn').click();

    // Watch confetti
    await page.waitForSelector('.confetti-container', { state: 'visible', timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(4000);
  }
};

// ============================================================================
// Recording Engine
// ============================================================================

async function recordScenario(scenarioName, scenarioFn, viewport, outputDir, extraDuration) {
  const outputFile = `${scenarioName}-${viewport.name}.webm`;
  console.log(`  Recording ${outputFile} (${viewport.width}x${viewport.height})...`);

  const browser = await firefox.launch();
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    recordVideo: {
      dir: outputDir,
      size: { width: viewport.width, height: viewport.height }
    }
  });

  const page = await context.newPage();

  try {
    // Navigate to page
    await page.goto(PAGE_URL);
    await page.waitForSelector('#title');

    // Clear localStorage for clean state
    await page.evaluate(() => localStorage.clear());

    // Initial pause
    await page.waitForTimeout(500);

    // Run the scenario
    await scenarioFn(page);

    // Extra wait time at the end
    await page.waitForTimeout(extraDuration);

  } catch (error) {
    console.error(`  Error in scenario: ${error.message}`);
  }

  // Get video path before closing
  const video = page.video();

  await context.close();
  await browser.close();

  // Rename video file
  if (video) {
    const videoPath = await video.path();
    const newPath = path.join(outputDir, outputFile);
    try {
      fs.renameSync(videoPath, newPath);
      console.log(`  Saved: ${newPath}`);
    } catch (e) {
      console.log(`  Saved: ${videoPath}`);
    }
  }
}

async function main() {
  // Parse arguments
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Video Recording Utility for iCal Creator

Usage:
  node tests/record-video.js <scenario-name> [options]

Available scenarios:
${Object.keys(SCENARIOS).map(s => `  - ${s}`).join('\n')}

Options:
  --desktop-only    Record only desktop viewport (1440x900)
  --mobile-only     Record only mobile viewport (375x812)
  --output-dir DIR  Custom output directory (default: videos/)
  --duration MS     Extra wait time after scenario (default: 2000)
  --list            List all available scenarios
  --help, -h        Show this help message

Examples:
  node tests/record-video.js confetti
  node tests/record-video.js form-validation --mobile-only
  node tests/record-video.js recurring-weekly --duration 5000
  node tests/record-video.js full-workflow --output-dir ./demo-videos
`);
    return;
  }

  if (args.includes('--list')) {
    console.log('Available scenarios:');
    Object.keys(SCENARIOS).forEach(name => {
      console.log(`  - ${name}`);
    });
    return;
  }

  const scenarioName = args[0];
  const desktopOnly = args.includes('--desktop-only');
  const mobileOnly = args.includes('--mobile-only');
  const durationIdx = args.indexOf('--duration');
  const extraDuration = durationIdx !== -1 ? parseInt(args[durationIdx + 1]) : 2000;
  const outputDirIdx = args.indexOf('--output-dir');
  const outputDir = outputDirIdx !== -1
    ? path.resolve(args[outputDirIdx + 1])
    : path.resolve(__dirname, '../videos');

  // Validate scenario
  if (!SCENARIOS[scenarioName]) {
    console.error(`Error: Unknown scenario "${scenarioName}"`);
    console.log(`Available scenarios: ${Object.keys(SCENARIOS).join(', ')}`);
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`\nRecording scenario: ${scenarioName}`);
  console.log(`Output directory: ${outputDir}\n`);

  const scenarioFn = SCENARIOS[scenarioName];

  // Record for each viewport
  if (!mobileOnly) {
    await recordScenario(scenarioName, scenarioFn, VIEWPORTS.desktop, outputDir, extraDuration);
  }

  if (!desktopOnly) {
    await recordScenario(scenarioName, scenarioFn, VIEWPORTS.mobile, outputDir, extraDuration);
  }

  console.log('\nDone!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
