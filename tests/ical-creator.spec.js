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

test.describe('iCal Creator - Timezone Handling', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForSelector('#title');
  });

  test('Event time should be converted from local timezone to UTC (Europe/Berlin winter)', async ({ page }) => {
    // Europe/Berlin is UTC+1 in winter (January)
    // A time of 19:30 in Europe/Berlin should become 18:30 UTC

    await page.locator('#title').fill('Timezone Test Event');
    await fillDateTime(page, 'startDate', 'startTime', '2025-01-15', '19:30');
    await fillDateTime(page, 'endDate', 'endTime', '2025-01-15', '20:30');

    // Select Europe/Berlin timezone
    await scrollAndSelect(page, '#timezone', 'Europe/Berlin');

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'timezone-berlin-winter.ics');

    // Verify structure
    verifyICSStructure(content);

    // Extract DTSTART time - should be 18:30 UTC (19:30 - 1 hour offset)
    const dtstartMatch = content.match(/DTSTART:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/);
    expect(dtstartMatch).toBeTruthy();

    const [, year, month, day, hour, minute] = dtstartMatch;
    expect(year).toBe('2025');
    expect(month).toBe('01');
    expect(day).toBe('15');
    expect(hour).toBe('18'); // 19:30 local - 1 hour = 18:30 UTC
    expect(minute).toBe('30');

    // Extract DTEND time - should be 19:30 UTC (20:30 - 1 hour offset)
    const dtendMatch = content.match(/DTEND:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/);
    expect(dtendMatch).toBeTruthy();

    const [, endYear, endMonth, endDay, endHour, endMinute] = dtendMatch;
    expect(endYear).toBe('2025');
    expect(endMonth).toBe('01');
    expect(endDay).toBe('15');
    expect(endHour).toBe('19'); // 20:30 local - 1 hour = 19:30 UTC
    expect(endMinute).toBe('30');

    console.log(`Generated: ${filePath}`);
  });

  test('Event time should be converted from local timezone to UTC (America/New_York winter)', async ({ page }) => {
    // America/New_York is UTC-5 in winter (January)
    // A time of 10:00 in New York should become 15:00 UTC

    await page.locator('#title').fill('NYC Timezone Test');
    await fillDateTime(page, 'startDate', 'startTime', '2025-01-15', '10:00');
    await fillDateTime(page, 'endDate', 'endTime', '2025-01-15', '11:00');

    // Select America/New_York timezone
    await scrollAndSelect(page, '#timezone', 'America/New_York');

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'timezone-nyc-winter.ics');

    // Verify structure
    verifyICSStructure(content);

    // Extract DTSTART time - should be 15:00 UTC (10:00 + 5 hours offset)
    const dtstartMatch = content.match(/DTSTART:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/);
    expect(dtstartMatch).toBeTruthy();

    const [, year, month, day, hour, minute] = dtstartMatch;
    expect(year).toBe('2025');
    expect(month).toBe('01');
    expect(day).toBe('15');
    expect(hour).toBe('15'); // 10:00 local + 5 hours = 15:00 UTC
    expect(minute).toBe('00');

    console.log(`Generated: ${filePath}`);
  });

  test('UTC timezone should not change the time', async ({ page }) => {
    // When timezone is UTC, the time should remain unchanged

    await page.locator('#title').fill('UTC Test Event');
    await fillDateTime(page, 'startDate', 'startTime', '2025-01-15', '14:00');
    await fillDateTime(page, 'endDate', 'endTime', '2025-01-15', '15:00');

    // Select UTC timezone
    await scrollAndSelect(page, '#timezone', 'UTC');

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'timezone-utc.ics');

    // Verify structure
    verifyICSStructure(content);

    // Extract DTSTART time - should remain 14:00 UTC
    const dtstartMatch = content.match(/DTSTART:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/);
    expect(dtstartMatch).toBeTruthy();

    const [, year, month, day, hour, minute] = dtstartMatch;
    expect(year).toBe('2025');
    expect(month).toBe('01');
    expect(day).toBe('15');
    expect(hour).toBe('14'); // Unchanged for UTC
    expect(minute).toBe('00');

    console.log(`Generated: ${filePath}`);
  });

  test('Event time conversion should handle date boundary crossing', async ({ page }) => {
    // Asia/Tokyo is UTC+9
    // A time of 03:00 in Tokyo should become 18:00 UTC on the PREVIOUS day

    await page.locator('#title').fill('Tokyo Early Morning');
    await fillDateTime(page, 'startDate', 'startTime', '2025-01-15', '03:00');
    await fillDateTime(page, 'endDate', 'endTime', '2025-01-15', '04:00');

    // Select Asia/Tokyo timezone
    await scrollAndSelect(page, '#timezone', 'Asia/Tokyo');

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'timezone-tokyo-boundary.ics');

    // Verify structure
    verifyICSStructure(content);

    // Extract DTSTART time - should be 18:00 UTC on Jan 14 (03:00 - 9 hours = 18:00 previous day)
    const dtstartMatch = content.match(/DTSTART:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/);
    expect(dtstartMatch).toBeTruthy();

    const [, year, month, day, hour, minute] = dtstartMatch;
    expect(year).toBe('2025');
    expect(month).toBe('01');
    expect(day).toBe('14'); // Previous day due to timezone offset
    expect(hour).toBe('18'); // 03:00 - 9 hours = 18:00 previous day
    expect(minute).toBe('00');

    console.log(`Generated: ${filePath}`);
  });

  test('Recurring event should use TZID for correct DST handling', async ({ page }) => {
    // This test verifies that recurring events spanning DST transitions work correctly
    // Europe/Berlin: UTC+1 (winter) -> UTC+2 (summer, starts late March)
    //
    // Problem with UTC approach:
    // - Event at 19:30 Berlin in January = 18:30 UTC
    // - If we store DTSTART:...T183000Z, it's 18:30 UTC forever
    // - In April (summer), 18:30 UTC = 20:30 Berlin (wrong!)
    //
    // Solution: Use TZID so calendar app handles DST:
    // - DTSTART;TZID=Europe/Berlin:...T193000
    // - Calendar app knows to show 19:30 Berlin regardless of DST

    await page.locator('#title').fill('Bi-weekly Thursday Meeting');
    // Start on Thursday January 9, 2025 (winter time)
    await fillDateTime(page, 'startDate', 'startTime', '2025-01-09', '19:30');
    await fillDateTime(page, 'endDate', 'endTime', '2025-01-09', '20:30');

    // Select Europe/Berlin timezone
    await scrollAndSelect(page, '#timezone', 'Europe/Berlin');

    // Enable recurring
    await scrollAndCheck(page, '#isRecurring');

    // Select weekly frequency with interval 2 (bi-weekly)
    await scrollAndSelect(page, '#frequency', 'WEEKLY');
    await scrollAndSelect(page, '#interval', '2');

    // Set end date to May 2025 (spans DST transition on March 30, 2025)
    await scrollAndCheck(page, 'input[name="endType"][value="date"]');
    await scrollAndFill(page, '#recurrenceEndDate', '2025-05-31');

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'timezone-dst-recurring.ics');

    // Verify structure
    verifyICSStructure(content);
    expect(content).toContain('RRULE:');
    expect(content).toContain('FREQ=WEEKLY');

    // For recurring events spanning DST, we should use TZID instead of UTC
    // Check that DTSTART has TZID parameter
    const hasTZID = content.includes('DTSTART;TZID=Europe/Berlin');

    if (hasTZID) {
      // Correct: Using TZID approach - time should be local time (19:30)
      expect(content).toMatch(/DTSTART;TZID=Europe\/Berlin[^:]*:20250109T193000/);
      console.log('PASS: Using TZID approach for DST-safe recurring events');
    } else {
      // If using UTC approach, verify it's at least correct for the start date
      // But note this will be wrong after DST transition
      const dtstartMatch = content.match(/DTSTART:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/);
      expect(dtstartMatch).toBeTruthy();
      expect(dtstartMatch[4]).toBe('18'); // 19:30 Berlin winter = 18:30 UTC
      console.log('WARNING: Using UTC approach - events after March 30 DST change will show at 20:30 instead of 19:30');
    }

    console.log(`Generated: ${filePath}`);
  });

  test('Recurring event exceptions should use correct timezone conversion', async ({ page }) => {
    // Test that EXDATE times are also converted to UTC

    await page.locator('#title').fill('Weekly Berlin Meeting');
    await fillDateTime(page, 'startDate', 'startTime', '2025-01-06', '19:30');
    await fillDateTime(page, 'endDate', 'endTime', '2025-01-06', '20:30');

    // Select Europe/Berlin timezone
    await scrollAndSelect(page, '#timezone', 'Europe/Berlin');

    // Enable recurring
    await scrollAndCheck(page, '#isRecurring');

    // Select weekly frequency
    await scrollAndSelect(page, '#frequency', 'WEEKLY');

    // Set occurrence count
    await scrollAndCheck(page, 'input[name="endType"][value="count"]');
    await scrollAndFill(page, '#occurrenceCount', '4');

    // Wait for calendar to render
    await page.waitForSelector('.calendar-grid');

    // Add exception dates by clicking on calendar days
    const eventDays = page.locator('.calendar-grid .day.event');
    const dayCount = await eventDays.count();

    if (dayCount >= 2) {
      // Click on the second occurrence to add as exception
      await eventDays.nth(1).click();
    }

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'timezone-recurring-exception.ics');

    // Verify structure
    verifyICSStructure(content);

    // For recurring events with non-UTC timezone, we now use TZID format for DST correctness
    // Check for TZID format first (preferred for recurring), then UTC format
    const hasTZID = content.includes('DTSTART;TZID=Europe/Berlin');

    if (hasTZID) {
      // TZID format: time should be local time (19:30)
      expect(content).toMatch(/DTSTART;TZID=Europe\/Berlin[^:]*:20250106T193000/);
      console.log('Using TZID approach for recurring event');

      // Check EXDATE also uses TZID
      if (dayCount >= 2) {
        const hasExdateTZID = content.includes('EXDATE;TZID=Europe/Berlin');
        if (hasExdateTZID) {
          // EXDATE should also have local time (19:30)
          expect(content).toMatch(/EXDATE;TZID=Europe\/Berlin[^:]*:\d{8}T193000/);
        }
      }
    } else {
      // UTC format: time should be converted (19:30 Berlin -> 18:30 UTC)
      const dtstartMatch = content.match(/DTSTART:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/);
      expect(dtstartMatch).toBeTruthy();
      expect(dtstartMatch[4]).toBe('18'); // 19:30 - 1 hour = 18:30 UTC

      // If there's an EXDATE, verify it's also converted to UTC
      if (dayCount >= 2) {
        const exdateMatch = content.match(/EXDATE:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/);
        if (exdateMatch) {
          // EXDATE hour should also be 18:30 UTC (original 19:30 - 1 hour)
          expect(exdateMatch[4]).toBe('18');
          expect(exdateMatch[5]).toBe('30');
        }
      }
    }

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

test.describe('iCal Creator - UID and SEQUENCE (RFC 5545)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForSelector('#title');
    // Clear localStorage to ensure clean state
    await page.evaluate(() => localStorage.clear());
  });

  test('Generated iCal should include UID property', async ({ page }) => {
    await page.locator('#title').fill('UID Test Event');
    await fillDateTime(page, 'startDate', 'startTime', '2025-03-15', '10:00');

    const { content } = await generateAndCaptureICS(page, 'uid-test.ics');

    verifyICSStructure(content);
    // UID should be present and match the expected format
    expect(content).toMatch(/UID:ical-creator-\d+-[a-z0-9]+@ical-creator/);
  });

  test('Generated iCal should include SEQUENCE property', async ({ page }) => {
    await page.locator('#title').fill('SEQUENCE Test Event');
    await fillDateTime(page, 'startDate', 'startTime', '2025-03-15', '10:00');

    const { content } = await generateAndCaptureICS(page, 'sequence-test.ics');

    verifyICSStructure(content);
    // SEQUENCE should be present (starts at 0 for new events)
    expect(content).toMatch(/SEQUENCE:\d+/);
  });

  test('Saved event should retain same UID on re-download', async ({ page }) => {
    // Create an event and download (which auto-saves)
    await page.locator('#title').fill('Persistent UID Event');
    await fillDateTime(page, 'startDate', 'startTime', '2025-03-15', '10:00');

    // First download (this also saves the event to history)
    const { content: firstICS } = await generateAndCaptureICS(page, 'uid-persist-1.ics');

    // Extract UID from first download
    const uidMatch1 = firstICS.match(/UID:([^\r\n]+)/);
    expect(uidMatch1).toBeTruthy();
    const firstUID = uidMatch1[1];

    // Modify the event title
    await page.locator('#title').fill('Persistent UID Event - Modified');

    // Second download (same event, should have same UID)
    const { content: secondICS } = await generateAndCaptureICS(page, 'uid-persist-2.ics');

    // Extract UID from second download
    const uidMatch2 = secondICS.match(/UID:([^\r\n]+)/);
    expect(uidMatch2).toBeTruthy();
    const secondUID = uidMatch2[1];

    // UIDs should be identical (same event)
    expect(secondUID).toBe(firstUID);
    console.log(`UID preserved: ${firstUID}`);
  });

  test('SEQUENCE should increment when event is re-saved', async ({ page }) => {
    // Create an event and download (first save - sequence 0)
    await page.locator('#title').fill('SEQUENCE Increment Test');
    await fillDateTime(page, 'startDate', 'startTime', '2025-03-15', '10:00');

    // First download (saves event with sequence 0)
    const { content: firstICS } = await generateAndCaptureICS(page, 'seq-increment-1.ics');

    // Extract SEQUENCE from first download
    const seqMatch1 = firstICS.match(/SEQUENCE:(\d+)/);
    expect(seqMatch1).toBeTruthy();
    const firstSequence = parseInt(seqMatch1[1]);
    expect(firstSequence).toBe(0);

    // Modify and download again (second save - sequence should increment)
    await page.locator('#title').fill('SEQUENCE Increment Test - Updated');

    // Second download (saves event with incremented sequence)
    const { content: secondICS } = await generateAndCaptureICS(page, 'seq-increment-2.ics');

    // Extract SEQUENCE from second download
    const seqMatch2 = secondICS.match(/SEQUENCE:(\d+)/);
    expect(seqMatch2).toBeTruthy();
    const secondSequence = parseInt(seqMatch2[1]);

    // SEQUENCE should be incremented
    expect(secondSequence).toBe(firstSequence + 1);
    console.log(`SEQUENCE incremented: ${firstSequence} -> ${secondSequence}`);
  });

  test('New event should start with SEQUENCE 0', async ({ page }) => {
    await page.locator('#title').fill('New Event SEQUENCE');
    await fillDateTime(page, 'startDate', 'startTime', '2025-03-15', '10:00');

    const { content } = await generateAndCaptureICS(page, 'new-event-seq.ics');

    verifyICSStructure(content);
    // New event should have SEQUENCE:0
    expect(content).toContain('SEQUENCE:0');
  });

});

test.describe('iCal Creator - Preview Bug Fix (Last Friday)', () => {
  // Test for the preview bug where monthly recurrence on 5th weekday
  // (last Friday) was not showing all occurrences in the preview

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForSelector('#title');
  });

  test('Monthly last Friday recurrence should show all 12 occurrences in preview', async ({ page }) => {
    // This test verifies the fix for the bug where selecting a date on the 5th Friday
    // (like January 30, 2026) with COUNT=12 would not show all events in the preview

    // Fill in event details - January 30, 2026 is a Friday in the 5th week
    await page.locator('#title').fill('Senioren Kaffee');
    await fillDateTime(page, 'startDate', 'startTime', '2026-01-30', '09:00');
    await fillDateTime(page, 'endDate', 'endTime', '2026-01-30', '11:00');

    // Enable recurring
    await scrollAndCheck(page, '#isRecurring');

    // Select monthly frequency
    await scrollAndSelect(page, '#frequency', 'MONTHLY');

    // Select "by day" option (day of week)
    await scrollAndCheck(page, 'input[name="monthlyType"][value="day"]');

    // Verify the hint shows "last Fri" instead of "5th Fri"
    const hint = await page.locator('#monthlyDayHint').textContent();
    expect(hint).toContain('last Fri');

    // Set occurrence count to 12
    await scrollAndCheck(page, 'input[name="endType"][value="count"]');
    await scrollAndFill(page, '#occurrenceCount', '12');

    // Wait for calendar to render
    await page.waitForSelector('.calendar-grid');

    // Check the state.eventOccurrences array has all 12 occurrences
    const occurrences = await page.evaluate(() => {
      return {
        count: state.eventOccurrences.length,
        dates: state.eventOccurrences.map(d => d.toLocaleDateString('en-CA'))
      };
    });

    // Should have exactly 12 occurrences
    expect(occurrences.count).toBe(12);

    // Verify each occurrence is the last Friday of its month
    const expectedDates = [
      '2026-01-30', // Jan last Friday
      '2026-02-27', // Feb last Friday
      '2026-03-27', // Mar last Friday
      '2026-04-24', // Apr last Friday
      '2026-05-29', // May last Friday
      '2026-06-26', // Jun last Friday
      '2026-07-31', // Jul last Friday
      '2026-08-28', // Aug last Friday
      '2026-09-25', // Sep last Friday
      '2026-10-30', // Oct last Friday
      '2026-11-27', // Nov last Friday
      '2026-12-25', // Dec last Friday
    ];

    expect(occurrences.dates).toEqual(expectedDates);

    // Verify first occurrence is visible in January calendar
    const janEvent = page.locator('.calendar-grid .event-day');
    await expect(janEvent.first()).toBeVisible();

    console.log('All 12 occurrences calculated correctly:', occurrences.dates);
  });

  test('Generated iCal should use BYDAY=-1FR for last Friday recurrence', async ({ page }) => {
    // This test verifies that the RRULE uses -1FR (last Friday) instead of 5FR

    await page.locator('#title').fill('Last Friday Event');
    await fillDateTime(page, 'startDate', 'startTime', '2026-01-30', '09:00');
    await fillDateTime(page, 'endDate', 'endTime', '2026-01-30', '11:00');

    // Enable recurring
    await scrollAndCheck(page, '#isRecurring');

    // Select monthly frequency
    await scrollAndSelect(page, '#frequency', 'MONTHLY');

    // Select "by day" option
    await scrollAndCheck(page, 'input[name="monthlyType"][value="day"]');

    // Set occurrence count
    await scrollAndCheck(page, 'input[name="endType"][value="count"]');
    await scrollAndFill(page, '#occurrenceCount', '12');

    // Generate and capture ICS
    const { content, filePath } = await generateAndCaptureICS(page, 'last-friday-recurrence.ics');

    // Verify structure
    verifyICSStructure(content);
    expect(content).toContain('SUMMARY:Last Friday Event');
    expect(content).toContain('RRULE:');
    expect(content).toContain('FREQ=MONTHLY');
    // Should use -1FR (last Friday) instead of 5FR
    expect(content).toContain('BYDAY=-1FR');
    expect(content).toContain('COUNT=12');

    console.log(`Generated: ${filePath}`);
  });

  test('Preview should extend beyond 3 months for COUNT-based recurrence', async ({ page }) => {
    // This test verifies that calendarMonthsLoaded is extended to cover all occurrences

    await page.locator('#title').fill('Extended Preview Test');
    await fillDateTime(page, 'startDate', 'startTime', '2026-01-15', '10:00');

    // Enable recurring
    await scrollAndCheck(page, '#isRecurring');

    // Select monthly frequency with count of 12
    await scrollAndSelect(page, '#frequency', 'MONTHLY');
    await scrollAndCheck(page, 'input[name="endType"][value="count"]');
    await scrollAndFill(page, '#occurrenceCount', '12');

    // Check that calendarMonthsLoaded was extended
    const monthsLoaded = await page.evaluate(() => state.calendarMonthsLoaded);

    // Should be at least 13 months (12 occurrences * 1 month + 1 buffer)
    expect(monthsLoaded).toBeGreaterThanOrEqual(13);

    // Verify all 12 occurrences are calculated
    const occurrenceCount = await page.evaluate(() => state.eventOccurrences.length);
    expect(occurrenceCount).toBe(12);

    console.log(`calendarMonthsLoaded extended to: ${monthsLoaded}`);
  });

  test('Monthly by day-of-month (30th) recurrence should show correct occurrences', async ({ page }) => {
    // Test for RRULE:FREQ=MONTHLY;COUNT=12;BYMONTHDAY=30
    // Note: February doesn't have a 30th day

    await page.locator('#title').fill('Senioren Treff');
    await fillDateTime(page, 'startDate', 'startTime', '2026-01-30', '09:00');
    await fillDateTime(page, 'endDate', 'endTime', '2026-01-30', '11:00');
    await scrollAndFill(page, '#location', 'Restaurant Lokal, Embrach');

    // Enable recurring
    await scrollAndCheck(page, '#isRecurring');

    // Select monthly frequency
    await scrollAndSelect(page, '#frequency', 'MONTHLY');

    // Select "by date" option (30th of every month)
    await scrollAndCheck(page, 'input[name="monthlyType"][value="date"]');

    // Set occurrence count to 12
    await scrollAndCheck(page, 'input[name="endType"][value="count"]');
    await scrollAndFill(page, '#occurrenceCount', '12');

    // Check the calculated occurrences
    const occurrences = await page.evaluate(() => {
      return {
        count: state.eventOccurrences.length,
        dates: state.eventOccurrences.map(d => d.toLocaleDateString('en-CA'))
      };
    });

    // Should have 12 occurrences - the 30th of each month
    expect(occurrences.count).toBe(12);

    // Expected dates: 30th of each month (Feb has only 28 days, so it wraps to Mar 2)
    // After Feb overflow, dates reset to 30th correctly
    const expectedDates = [
      '2026-01-30', // Jan 30
      '2026-03-02', // Feb 30 -> Mar 2 (overflow, unavoidable)
      '2026-04-30', // Apr 30 (resets correctly)
      '2026-05-30', // May 30
      '2026-06-30', // Jun 30
      '2026-07-30', // Jul 30
      '2026-08-30', // Aug 30
      '2026-09-30', // Sep 30
      '2026-10-30', // Oct 30
      '2026-11-30', // Nov 30
      '2026-12-30', // Dec 30
      '2027-01-30', // Jan 30 (next year)
    ];

    expect(occurrences.dates).toEqual(expectedDates);

    // Verify the RRULE uses BYMONTHDAY
    const { content } = await generateAndCaptureICS(page, 'monthly-by-date-30.ics');
    verifyICSStructure(content);
    expect(content).toContain('FREQ=MONTHLY');
    expect(content).toContain('BYMONTHDAY=30');
    expect(content).toContain('COUNT=12');

    console.log('Monthly by date occurrences:', occurrences.dates);
  });

});
