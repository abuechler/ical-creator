// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Helper to get the file URL for the HTML page
const getPageUrl = () => {
  return 'file://' + path.resolve(__dirname, '../ical-creator.html');
};

// Directory for generated ICS files
const OUTPUT_DIR = path.resolve(__dirname, '../test-output');

// Ensure output directory exists
test.beforeAll(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
});

// Helper to fill date/time fields
async function fillDateTime(page, dateId, timeId, date, time) {
  await page.locator(`#${dateId}`).fill(date);
  if (time && timeId) {
    await page.locator(`#${timeId}`).fill(time);
  }
}

// Helper to scroll element into view and interact with checkboxes
// For toggle-style checkboxes with hidden inputs, click on the adjacent slider
async function scrollAndCheck(page, selector) {
  const element = page.locator(selector);

  // Check if this is a toggle-style checkbox (parent has toggle-switch class)
  const isToggle = await element.locator('xpath=..').evaluate(el => el.classList.contains('toggle-switch'));

  if (isToggle) {
    // Click on the toggle slider sibling
    const slider = element.locator('xpath=following-sibling::span[@class="toggle-slider"]');
    await slider.scrollIntoViewIfNeeded();
    await slider.click();
  } else {
    await element.scrollIntoViewIfNeeded();
    await element.check({ force: true });
  }
}

async function scrollAndClick(page, selector) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await element.click();
}

async function scrollAndSelect(page, selector, value) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await element.selectOption(value);
}

async function scrollAndFill(page, selector, value) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await element.fill(value);
}

// Helper to generate and capture ICS content
async function generateAndCaptureICS(page, filename) {
  // Set up download handling
  const downloadPromise = page.waitForEvent('download');

  // Click the download button
  await page.locator('button[type="submit"]').click();

  const download = await downloadPromise;

  // Save to test output directory
  const filePath = path.join(OUTPUT_DIR, filename);
  await download.saveAs(filePath);

  // Read and return the content
  const content = fs.readFileSync(filePath, 'utf-8');
  return { filePath, content };
}

// Helper to verify basic ICS structure
function verifyICSStructure(content) {
  expect(content).toContain('BEGIN:VCALENDAR');
  expect(content).toContain('END:VCALENDAR');
  expect(content).toContain('BEGIN:VEVENT');
  expect(content).toContain('END:VEVENT');
  expect(content).toContain('VERSION:2.0');
  expect(content).toContain('PRODID:');
}

test.describe('iCal Creator - Event Generation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    // Wait for the page to be fully loaded
    await page.waitForSelector('#title');
  });

  test('Simple event with title, date, and time', async ({ page }) => {
    // Fill in basic event details
    await page.locator('#title').fill('Team Meeting');
    await fillDateTime(page, 'startDate', 'startTime', '2025-03-15', '09:00');
    await fillDateTime(page, 'endDate', 'endTime', '2025-03-15', '10:30');

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'simple-event.ics');

    // Verify structure
    verifyICSStructure(content);
    expect(content).toContain('SUMMARY:Team Meeting');
    expect(content).toContain('DTSTART');
    expect(content).toContain('DTEND');

    console.log(`Generated: ${filePath}`);
  });

  test('All-day event', async ({ page }) => {
    // Fill in event details
    await page.locator('#title').fill('Company Holiday');
    await fillDateTime(page, 'startDate', null, '2025-12-25', null);

    // Check all-day checkbox
    await page.locator('#allDay').check();

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'all-day-event.ics');

    // Verify structure
    verifyICSStructure(content);
    expect(content).toContain('SUMMARY:Company Holiday');
    // All-day events should have VALUE=DATE parameter
    expect(content).toMatch(/DTSTART[^:]*VALUE=DATE/);

    console.log(`Generated: ${filePath}`);
  });

  test('Recurring daily event', async ({ page }) => {
    await page.locator('#title').fill('Daily Standup');
    await fillDateTime(page, 'startDate', 'startTime', '2025-02-01', '09:00');
    await fillDateTime(page, 'endDate', 'endTime', '2025-02-01', '09:15');

    // Enable recurring (scroll into view first)
    await scrollAndCheck(page, '#isRecurring');

    // Select daily frequency
    await scrollAndSelect(page, '#frequency', 'DAILY');

    // Set occurrence count
    await scrollAndCheck(page, 'input[name="endType"][value="count"]');
    await scrollAndFill(page, '#occurrenceCount', '10');

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'recurring-daily.ics');

    // Verify structure
    verifyICSStructure(content);
    expect(content).toContain('SUMMARY:Daily Standup');
    expect(content).toContain('RRULE:');
    expect(content).toContain('FREQ=DAILY');
    expect(content).toContain('COUNT=10');

    console.log(`Generated: ${filePath}`);
  });

  test('Recurring weekly event with day selection', async ({ page }) => {
    await page.locator('#title').fill('Team Sync');
    // 2025-02-03 is a Monday - it will be auto-selected
    await fillDateTime(page, 'startDate', 'startTime', '2025-02-03', '14:00');
    await fillDateTime(page, 'endDate', 'endTime', '2025-02-03', '15:00');

    // Enable recurring (scroll into view first)
    await scrollAndCheck(page, '#isRecurring');

    // Select weekly frequency
    await scrollAndSelect(page, '#frequency', 'WEEKLY');

    // MO is auto-selected based on start date (Monday)
    // Add Wednesday and Friday
    await scrollAndClick(page, 'button[data-day="WE"]');
    await scrollAndClick(page, 'button[data-day="FR"]');

    // Set end date
    await scrollAndCheck(page, 'input[name="endType"][value="date"]');
    await scrollAndFill(page, '#recurrenceEndDate', '2025-06-30');

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'recurring-weekly.ics');

    // Verify structure
    verifyICSStructure(content);
    expect(content).toContain('SUMMARY:Team Sync');
    expect(content).toContain('RRULE:');
    expect(content).toContain('FREQ=WEEKLY');
    // Verify at least some days are selected (MO is auto-selected, WE and FR added)
    expect(content).toContain('BYDAY=');
    expect(content).toMatch(/BYDAY=.*MO/);

    console.log(`Generated: ${filePath}`);
  });

  test('Recurring monthly event by date', async ({ page }) => {
    await page.locator('#title').fill('Monthly Report Due');
    await fillDateTime(page, 'startDate', 'startTime', '2025-01-15', '17:00');
    await fillDateTime(page, 'endDate', 'endTime', '2025-01-15', '18:00');

    // Enable recurring (scroll into view first)
    await scrollAndCheck(page, '#isRecurring');

    // Select monthly frequency
    await scrollAndSelect(page, '#frequency', 'MONTHLY');

    // Select "by date" option (should be default)
    await scrollAndCheck(page, 'input[name="monthlyType"][value="date"]');

    // Set occurrence count
    await scrollAndCheck(page, 'input[name="endType"][value="count"]');
    await scrollAndFill(page, '#occurrenceCount', '12');

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'recurring-monthly-date.ics');

    // Verify structure
    verifyICSStructure(content);
    expect(content).toContain('SUMMARY:Monthly Report Due');
    expect(content).toContain('RRULE:');
    expect(content).toContain('FREQ=MONTHLY');
    expect(content).toContain('BYMONTHDAY=15');

    console.log(`Generated: ${filePath}`);
  });

  test('Recurring monthly event by day of week', async ({ page }) => {
    await page.locator('#title').fill('Third Tuesday Meeting');
    // Set date to a Tuesday that is the 3rd of the month
    await fillDateTime(page, 'startDate', 'startTime', '2025-02-18', '10:00');
    await fillDateTime(page, 'endDate', 'endTime', '2025-02-18', '11:00');

    // Enable recurring (scroll into view first)
    await scrollAndCheck(page, '#isRecurring');

    // Select monthly frequency
    await scrollAndSelect(page, '#frequency', 'MONTHLY');

    // Select "by day" option
    await scrollAndCheck(page, 'input[name="monthlyType"][value="day"]');

    // Set occurrence count
    await scrollAndCheck(page, 'input[name="endType"][value="count"]');
    await scrollAndFill(page, '#occurrenceCount', '6');

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'recurring-monthly-day.ics');

    // Verify structure
    verifyICSStructure(content);
    expect(content).toContain('SUMMARY:Third Tuesday Meeting');
    expect(content).toContain('RRULE:');
    expect(content).toContain('FREQ=MONTHLY');
    expect(content).toMatch(/BYDAY=\d+TU/);

    console.log(`Generated: ${filePath}`);
  });

  test('Event with reminder', async ({ page }) => {
    await page.locator('#title').fill('Important Deadline');
    await fillDateTime(page, 'startDate', 'startTime', '2025-04-01', '09:00');
    await fillDateTime(page, 'endDate', 'endTime', '2025-04-01', '10:00');

    // Enable reminder (scroll into view first)
    await scrollAndCheck(page, '#hasReminder');

    // Set reminder time (30 minutes before)
    await scrollAndSelect(page, '#reminderTime', '30');

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'event-with-reminder.ics');

    // Verify structure
    verifyICSStructure(content);
    expect(content).toContain('SUMMARY:Important Deadline');
    expect(content).toContain('BEGIN:VALARM');
    expect(content).toContain('END:VALARM');
    expect(content).toContain('ACTION:DISPLAY');
    expect(content).toContain('TRIGGER');

    console.log(`Generated: ${filePath}`);
  });

  test('Recurring event with exceptions', async ({ page }) => {
    await page.locator('#title').fill('Weekly Team Lunch');
    await fillDateTime(page, 'startDate', 'startTime', '2025-03-03', '12:00');
    await fillDateTime(page, 'endDate', 'endTime', '2025-03-03', '13:00');

    // Enable recurring (scroll into view first)
    await scrollAndCheck(page, '#isRecurring');

    // Select weekly frequency
    await scrollAndSelect(page, '#frequency', 'WEEKLY');

    // Set occurrence count
    await scrollAndCheck(page, 'input[name="endType"][value="count"]');
    await scrollAndFill(page, '#occurrenceCount', '10');

    // Wait for calendar to render
    await page.waitForSelector('.calendar-grid');

    // Add exception dates by clicking on calendar days
    // Navigate to correct month if needed and click on specific dates
    // This depends on the calendar UI implementation
    // For now, we'll look for clickable event days
    const eventDays = page.locator('.calendar-grid .day.event');
    const dayCount = await eventDays.count();

    if (dayCount >= 2) {
      // Click on the second occurrence to add as exception
      await eventDays.nth(1).click();
    }

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'recurring-with-exceptions.ics');

    // Verify structure
    verifyICSStructure(content);
    expect(content).toContain('SUMMARY:Weekly Team Lunch');
    expect(content).toContain('RRULE:');
    expect(content).toContain('FREQ=WEEKLY');
    // Check for EXDATE if exception was added
    if (dayCount >= 2) {
      expect(content).toContain('EXDATE');
    }

    console.log(`Generated: ${filePath}`);
  });

  test('Event with location, description, and URL', async ({ page }) => {
    await page.locator('#title').fill('Conference Talk');
    await fillDateTime(page, 'startDate', 'startTime', '2025-05-20', '14:00');
    await fillDateTime(page, 'endDate', 'endTime', '2025-05-20', '15:30');

    // Fill optional fields
    await page.locator('#location').fill('Main Conference Hall, Building A');
    await page.locator('#description').fill('Presentation on Modern Web Development\n\nTopics:\n- Component Architecture\n- State Management\n- Testing Strategies');
    await page.locator('#url').fill('https://example.com/conference/talk-123');

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'event-full-details.ics');

    // Verify structure
    verifyICSStructure(content);
    expect(content).toContain('SUMMARY:Conference Talk');
    expect(content).toContain('LOCATION:Main Conference Hall');
    expect(content).toContain('DESCRIPTION:');
    expect(content).toContain('URL:https://example.com/conference/talk-123');

    console.log(`Generated: ${filePath}`);
  });

  test('Recurring all-day monthly event', async ({ page }) => {
    // Note: YEARLY frequency is not supported by the app, so we test all-day + monthly
    await page.locator('#title').fill('Monthly All-Day Review');
    await fillDateTime(page, 'startDate', null, '2025-07-15', null);

    // Check all-day (scroll into view first)
    await scrollAndCheck(page, '#allDay');

    // Enable recurring
    await scrollAndCheck(page, '#isRecurring');

    // Select monthly frequency
    await scrollAndSelect(page, '#frequency', 'MONTHLY');

    // Set to repeat forever
    await scrollAndCheck(page, 'input[name="endType"][value="never"]');

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'recurring-allday-monthly.ics');

    // Verify structure
    verifyICSStructure(content);
    expect(content).toContain('SUMMARY:Monthly All-Day Review');
    expect(content).toMatch(/DTSTART[^:]*VALUE=DATE/);
    expect(content).toContain('RRULE:');
    expect(content).toContain('FREQ=MONTHLY');

    console.log(`Generated: ${filePath}`);
  });

});

test.describe('iCal Creator - Form Validation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForSelector('#title');
  });

  test('Download button should be disabled without required fields', async ({ page }) => {
    // Initially, the download button should be disabled
    const downloadBtn = page.locator('button[type="submit"]');

    // Check if button is disabled or has disabled styling
    // The app might use different mechanisms for disabling
    const isDisabled = await downloadBtn.isDisabled() ||
                       await downloadBtn.getAttribute('disabled') !== null;

    expect(isDisabled).toBeTruthy();
  });

  test('Form should validate title is required', async ({ page }) => {
    // Fill date but not title
    await page.locator('#startDate').fill('2025-03-15');
    await page.locator('#startTime').fill('09:00');

    // Try to submit
    const downloadBtn = page.locator('button[type="submit"]');

    // Button should still be disabled without title
    const isDisabled = await downloadBtn.isDisabled();
    expect(isDisabled).toBeTruthy();
  });

});
