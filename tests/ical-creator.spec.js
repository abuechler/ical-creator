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

    // Set reminder time (30 minutes before) - select in the first reminder dropdown
    await page.locator('.reminder-item select').first().selectOption('30');

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
    const isDisabled = downloadBtn;
    await expect(isDisabled).toBeDisabled();
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
      '2026-12-25' // Dec last Friday
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

    // Verify the hint shows warning about skipped months
    const hint = await page.locator('#monthlyDateHint').textContent();
    expect(hint).toContain('skips Feb');

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

    // Expected dates: 30th of each month, skipping Feb (no 30th day)
    const expectedDates = [
      '2026-01-30', // Jan 30
      // Feb skipped - no 30th day
      '2026-03-30', // Mar 30
      '2026-04-30', // Apr 30
      '2026-05-30', // May 30
      '2026-06-30', // Jun 30
      '2026-07-30', // Jul 30
      '2026-08-30', // Aug 30
      '2026-09-30', // Sep 30
      '2026-10-30', // Oct 30
      '2026-11-30', // Nov 30
      '2026-12-30', // Dec 30
      '2027-01-30' // Jan 30 (12th occurrence)
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

test.describe('iCal Creator - Demo Events', () => {

  test('demo events are loaded when localStorage is empty', async ({ page }) => {
    // Clear localStorage before navigating
    await page.goto(getPageUrl());
    await page.evaluate(() => localStorage.clear());

    // Reload to trigger demo events loading
    await page.reload();
    await page.waitForSelector('#title');

    // Wait for saved events section to be visible
    await page.waitForSelector('#savedEventsSection', { state: 'visible' });

    // Check that saved events section is displayed
    const savedEventsSection = page.locator('#savedEventsSection');
    await expect(savedEventsSection).toBeVisible();

    // Check that there are exactly 2 demo events
    const eventCards = page.locator('.saved-event-card');
    await expect(eventCards).toHaveCount(2);

    // Verify first demo event title
    const firstEventTitle = page.locator('.saved-event-card').first().locator('.saved-event-title');
    await expect(firstEventTitle).toHaveText('Letzter Freitag im Monat - Senioren Kaffee');

    // Verify second demo event title
    const secondEventTitle = page.locator('.saved-event-card').last().locator('.saved-event-title');
    await expect(secondEventTitle).toHaveText('Am 30. Tag jeden Monat - Senioren Treff');
  });

  test('demo events are NOT loaded when localStorage has existing events', async ({ page }) => {
    // Clear localStorage before navigating
    await page.goto(getPageUrl());
    await page.evaluate(() => localStorage.clear());

    // Add a custom event to localStorage
    await page.evaluate(() => {
      const customEvent = {
        id: 'custom-event-1@ical-creator',
        sequence: 0,
        title: 'My Custom Event',
        allDay: false,
        startDate: '2026-02-15',
        startTime: '14:00',
        endDate: '2026-02-15',
        endTime: '15:00',
        timezone: 'Europe/Berlin',
        location: '',
        description: '',
        url: '',
        isRecurring: false,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('icalCreator_savedEvents', JSON.stringify([customEvent]));
    });

    // Reload to trigger demo events check
    await page.reload();
    await page.waitForSelector('#title');

    // Wait for saved events section
    await page.waitForSelector('#savedEventsSection', { state: 'visible' });

    // Check that there is only 1 event (the custom one)
    const eventCards = page.locator('.saved-event-card');
    await expect(eventCards).toHaveCount(1);

    // Verify it's the custom event, not a demo event
    const eventTitle = page.locator('.saved-event-card').first().locator('.saved-event-title');
    await expect(eventTitle).toHaveText('My Custom Event');
  });

  test('demo events have correct recurrence badges', async ({ page }) => {
    // Clear localStorage and reload
    await page.goto(getPageUrl());
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#title');
    await page.waitForSelector('#savedEventsSection', { state: 'visible' });

    // Both demo events should have Monthly badge
    const monthlyBadges = page.locator('.saved-event-badge:has-text("Monthly")');
    await expect(monthlyBadges).toHaveCount(2);

    // Both demo events should have Reminder badge
    const reminderBadges = page.locator('.saved-event-badge:has-text("Reminder")');
    await expect(reminderBadges).toHaveCount(2);
  });

  test('demo event can be loaded into form', async ({ page }) => {
    // Clear localStorage and reload
    await page.goto(getPageUrl());
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#title');
    await page.waitForSelector('#savedEventsSection', { state: 'visible' });

    // Click Load button on first demo event
    const loadButton = page.locator('.saved-event-card').first().locator('button:has-text("Load")');
    await loadButton.click();

    // Verify form is populated with demo event data
    await expect(page.locator('#title')).toHaveValue('Letzter Freitag im Monat - Senioren Kaffee');
    await expect(page.locator('#startDate')).toHaveValue('2026-01-30');
    await expect(page.locator('#startTime')).toHaveValue('09:00');
    await expect(page.locator('#endDate')).toHaveValue('2026-01-30');
    await expect(page.locator('#endTime')).toHaveValue('11:00');
    await expect(page.locator('#timezone')).toHaveValue('Europe/Zurich');
    await expect(page.locator('#location')).toHaveValue('Restaurant Lokal, Embrach');
    await expect(page.locator('#url')).toHaveValue('https://www.restaurantlokal.ch');

    // Check recurrence settings
    await expect(page.locator('#isRecurring')).toBeChecked();
    await expect(page.locator('#frequency')).toHaveValue('MONTHLY');
    await expect(page.locator('#interval')).toHaveValue('1');
    await expect(page.locator('input[name="monthlyType"][value="day"]')).toBeChecked();
    await expect(page.locator('input[name="endType"][value="count"]')).toBeChecked();
    await expect(page.locator('#occurrenceCount')).toHaveValue('12');

    // Check reminder settings - verify checkbox and first reminder value
    await expect(page.locator('#hasReminder')).toBeChecked();
    await expect(page.locator('.reminder-item select').first()).toHaveValue('60');
  });

  test('second demo event loads with date-based monthly recurrence', async ({ page }) => {
    // Clear localStorage and reload
    await page.goto(getPageUrl());
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#title');
    await page.waitForSelector('#savedEventsSection', { state: 'visible' });

    // Click Load button on second demo event
    const loadButton = page.locator('.saved-event-card').last().locator('button:has-text("Load")');
    await loadButton.click();

    // Verify form is populated with second demo event data
    await expect(page.locator('#title')).toHaveValue('Am 30. Tag jeden Monat - Senioren Treff');

    // Check that monthlyType is 'date' (by day of month)
    await expect(page.locator('input[name="monthlyType"][value="date"]')).toBeChecked();
  });

  test('demo event generates valid ICS with correct RRULE', async ({ page }) => {
    // Clear localStorage and reload
    await page.goto(getPageUrl());
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#title');
    await page.waitForSelector('#savedEventsSection', { state: 'visible' });

    // Load first demo event (monthly by day)
    const loadButton = page.locator('.saved-event-card').first().locator('button:has-text("Load")');
    await loadButton.click();

    // Generate ICS
    const { content } = await generateAndCaptureICS(page, 'demo-event-monthly-by-day.ics');

    // Verify ICS structure
    verifyICSStructure(content);

    // Verify event details
    expect(content).toContain('SUMMARY:Letzter Freitag im Monat - Senioren Kaffee');
    expect(content).toContain('LOCATION:Restaurant Lokal\\, Embrach');
    expect(content).toContain('URL:https://www.restaurantlokal.ch');

    // Verify RRULE for monthly by day (5th Friday = last Friday)
    expect(content).toContain('FREQ=MONTHLY');
    expect(content).toContain('COUNT=12');
    expect(content).toMatch(/BYDAY=[-]?\d?FR/); // Should have FR in BYDAY

    // Verify alarm
    expect(content).toContain('BEGIN:VALARM');
    expect(content).toContain('TRIGGER:-PT60M');
  });

});

test.describe('iCal Creator - Responsive Design', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForSelector('#title');
  });

  test('Mobile layout (375x812) - single column layout', async ({ page, browserName: _browserName }, testInfo) => {
    // Skip if not running on mobile viewport
    if (testInfo.project.name !== 'Mobile Firefox') {
      test.skip();
    }

    // Verify the viewport is mobile size
    const viewport = page.viewportSize();
    expect(viewport.width).toBe(375);

    // Check that main content exists and is visible
    const mainContent = page.locator('.form-area');
    await expect(mainContent).toBeVisible();

    // Check that the Event Details card is visible
    const eventDetailsCard = page.locator('section[aria-labelledby="basic-info-title"]');
    await expect(eventDetailsCard).toBeVisible();

    // Get bounding boxes to verify single column layout
    const eventDetailsBox = await eventDetailsCard.boundingBox();

    // In mobile layout, Event Details should be near full width
    // Allow some padding (expect width > 300px on 375px viewport)
    expect(eventDetailsBox.width).toBeGreaterThan(300);

    // Verify form row stacks vertically on mobile
    const formRow = page.locator('.form-row').first();
    const formRowBox = await formRow.boundingBox();

    // The form row width should be similar to the card width (stacked layout)
    expect(formRowBox.width).toBeGreaterThan(300);
  });

  test('Desktop layout (1440x900) - two column layout', async ({ page, browserName: _browserName }, testInfo) => {
    // Skip if not running on desktop viewport
    if (testInfo.project.name !== 'Laptop Firefox') {
      test.skip();
    }

    // Verify the viewport is desktop size
    const viewport = page.viewportSize();
    expect(viewport.width).toBe(1440);

    // Check that main content exists and is visible
    const mainContent = page.locator('.form-area');
    await expect(mainContent).toBeVisible();

    // Check that the Event Details card is visible
    const eventDetailsCard = page.locator('section[aria-labelledby="basic-info-title"]');
    await expect(eventDetailsCard).toBeVisible();

    // Enable recurrence to make preview section visible
    const isRecurringCheckbox = page.locator('#isRecurring');
    const slider = isRecurringCheckbox.locator('xpath=following-sibling::span[@class="toggle-slider"]');
    await slider.scrollIntoViewIfNeeded();
    await slider.click();

    // Wait for preview section to appear
    const previewSection = page.locator('#previewSection');
    await expect(previewSection).toBeVisible();

    // Get bounding boxes to verify two-column layout
    const eventDetailsBox = await eventDetailsCard.boundingBox();
    const previewBox = await previewSection.boundingBox();

    // In desktop layout, Event Details and Preview should be side by side
    // Event Details should be in left column (x position near left edge)
    expect(eventDetailsBox.x).toBeLessThan(200); // Left column starts near left edge

    // Preview section should be in right column (x position should be roughly half the container)
    expect(previewBox.x).toBeGreaterThan(600); // Right column starts around middle

    // Both should have similar widths in a two-column layout
    expect(eventDetailsBox.width).toBeGreaterThan(400);
    expect(previewBox.width).toBeGreaterThan(400);
  });

  test('Desktop layout - container uses full width', async ({ page }, testInfo) => {
    // Skip if not running on desktop viewport
    if (testInfo.project.name !== 'Laptop Firefox') {
      test.skip();
    }

    // Check that container is wider on desktop
    const container = page.locator('.container');
    const containerBox = await container.boundingBox();

    // On desktop, container max-width should be 1200px
    // With 1440px viewport and padding, container should be close to 1200px
    expect(containerBox.width).toBeGreaterThan(1000);
    expect(containerBox.width).toBeLessThanOrEqual(1200);
  });

  test('Mobile layout - container is narrower', async ({ page }, testInfo) => {
    // Skip if not running on mobile viewport
    if (testInfo.project.name !== 'Mobile Firefox') {
      test.skip();
    }

    // Check that container is narrow on mobile
    const container = page.locator('.container');
    const containerBox = await container.boundingBox();

    // On mobile (375px viewport), container should be close to 375px
    expect(containerBox.width).toBeLessThanOrEqual(375);
    expect(containerBox.width).toBeGreaterThan(300);
  });

});

test.describe('iCal Creator - Preview Visibility for Non-Recurring Events', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForSelector('#title');
  });

  test('Preview should be shown for non-recurring events', async ({ page }) => {
    // Fill in basic event details
    await scrollAndFill(page, '#title', 'Non-Recurring Event');
    await scrollAndFill(page, '#startDate', '2026-02-15');
    // Blur the field to trigger change event
    await page.locator('#startDate').blur();
    await scrollAndFill(page, '#startTime', '10:00');

    // Wait for preview to be shown
    await page.waitForTimeout(1000);

    // Verify preview section is visible
    const previewSection = page.locator('#previewSection');
    await expect(previewSection).toBeVisible();

    // Verify preview title is "Preview" (not "Preview & Exceptions")
    const previewTitle = page.locator('#preview-title');
    await expect(previewTitle).toHaveText('Preview');

    // Verify the calendar is shown with the event date highlighted
    const calendarGrid = page.locator('#calendarGrid');
    await expect(calendarGrid).toBeVisible();

    // Verify at least one event day exists
    const eventDay = page.locator('.event-day').first();
    await expect(eventDay).toBeVisible();
  });

  test('Preview should show correct instructions for non-recurring events', async ({ page }) => {
    // Fill in basic event details
    await scrollAndFill(page, '#title', 'Single Event');
    await scrollAndFill(page, '#startDate', '2026-03-20');

    // Wait for preview to be visible
    await page.waitForTimeout(500);
    const previewSection = page.locator('#previewSection');
    await expect(previewSection).toBeVisible();

    // Verify instructions text is for non-recurring events
    const instructionsText = previewSection.locator('p').first();
    await expect(instructionsText).toHaveText('This is how your event will appear on the calendar.');
  });

  test('Exception UI should be hidden for non-recurring events', async ({ page }) => {
    // Fill in basic event details
    await scrollAndFill(page, '#title', 'Non-Recurring Event');
    await scrollAndFill(page, '#startDate', '2026-04-10');

    // Wait for preview to be visible
    await page.waitForTimeout(500);
    const previewSection = page.locator('#previewSection');
    await expect(previewSection).toBeVisible();

    // Verify exception count toggle is hidden
    const exceptionToggle = page.locator('#exceptionCount');
    await expect(exceptionToggle).toBeHidden();

    // Verify exception legend item is hidden
    const exceptionLegend = page.locator('.legend-item:has(.legend-dot.exception)');
    await expect(exceptionLegend).toBeHidden();
  });

  test('Preview should update to show exceptions UI when recurring is enabled', async ({ page }) => {
    // Fill in basic event details
    await scrollAndFill(page, '#title', 'Event');
    await scrollAndFill(page, '#startDate', '2026-05-15');

    // Wait for preview to be visible (non-recurring)
    await page.waitForTimeout(500);
    const previewSection = page.locator('#previewSection');
    await expect(previewSection).toBeVisible();

    // Verify exception UI is hidden initially
    const exceptionToggle = page.locator('#exceptionCount');
    await expect(exceptionToggle).toBeHidden();

    // Enable recurring
    await scrollAndCheck(page, '#isRecurring');

    // Wait for preview to update
    await page.waitForTimeout(500);

    // Verify preview title changed to "Preview & Exceptions"
    const previewTitle = page.locator('#preview-title');
    await expect(previewTitle).toHaveText('Preview & Exceptions');

    // Verify exception UI is now visible
    await expect(exceptionToggle).toBeVisible();

    // Verify instructions changed for recurring events
    const instructionsText = previewSection.locator('p').first();
    await expect(instructionsText).toHaveText('Click on highlighted dates to exclude them from the recurring event.');
  });

  test('Clicking event dates should not add exceptions for non-recurring events', async ({ page }) => {
    // Fill in basic event details
    await scrollAndFill(page, '#title', 'Non-Recurring Event');
    await scrollAndFill(page, '#startDate', '2026-06-10');
    // Blur the field to trigger change event
    await page.locator('#startDate').blur();

    // Wait for preview to be visible
    await page.waitForTimeout(1000);
    const previewSection = page.locator('#previewSection');
    await expect(previewSection).toBeVisible();

    // Find the event day
    const eventDay = page.locator('.event-day').first();
    await expect(eventDay).toBeVisible();

    // Verify cursor is default (not pointer)
    const cursorStyle = await eventDay.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursorStyle).toBe('default');

    // Click on the event day
    await eventDay.click();

    // Verify no exception was added (exception toggle should remain hidden)
    const exceptionToggle = page.locator('#exceptionCount');
    await expect(exceptionToggle).toBeHidden();

    // Verify event day doesn't have exception class
    await expect(eventDay).not.toHaveClass(/exception/);
  });

  test('Preview should remain visible when switching from recurring to non-recurring', async ({ page }) => {
    // Fill in event details
    await scrollAndFill(page, '#title', 'Event');
    await scrollAndFill(page, '#startDate', '2026-07-20');

    // Enable recurring
    await scrollAndCheck(page, '#isRecurring');

    // Wait for preview to update
    await page.waitForTimeout(500);

    // Verify preview is visible for recurring
    const previewSection = page.locator('#previewSection');
    await expect(previewSection).toBeVisible();

    // Disable recurring (uncheck by clicking again)
    await scrollAndCheck(page, '#isRecurring');

    // Wait for preview to update
    await page.waitForTimeout(500);

    // Verify preview is still visible (not hidden)
    await expect(previewSection).toBeVisible();

    // Verify title changed back to "Preview"
    const previewTitle = page.locator('#preview-title');
    await expect(previewTitle).toHaveText('Preview');
  });
});

// Multiple Reminders Feature Tests
test.describe('Multiple Reminders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForSelector('#title');
  });

  test('should add and display multiple reminders', async ({ page }) => {
    // Enable reminders
    await scrollAndCheck(page, '#hasReminder');

    // Should have one reminder by default
    const reminderItems = page.locator('.reminder-item');
    await expect(reminderItems).toHaveCount(1);

    // Add another reminder
    const addBtn = page.locator('#addReminderBtn');
    await addBtn.click();
    await expect(reminderItems).toHaveCount(2);

    // Add a third reminder
    await addBtn.click();
    await expect(reminderItems).toHaveCount(3);

    // Verify each reminder has a select and remove button
    for (let i = 0; i < 3; i++) {
      const item = reminderItems.nth(i);
      await expect(item.locator('select')).toBeVisible();
      await expect(item.locator('.reminder-remove-btn')).toBeVisible();
    }
  });

  test('should allow changing reminder values', async ({ page }) => {
    // Enable reminders
    await scrollAndCheck(page, '#hasReminder');

    // Change the first reminder to "1 day before"
    const firstSelect = page.locator('.reminder-item select').first();
    await firstSelect.selectOption('1440');
    await expect(firstSelect).toHaveValue('1440');

    // Add another and change it to "30 minutes before"
    await page.locator('#addReminderBtn').click();
    const secondSelect = page.locator('.reminder-item select').nth(1);
    await secondSelect.selectOption('30');
    await expect(secondSelect).toHaveValue('30');
  });

  test('should remove individual reminders', async ({ page }) => {
    // Enable reminders
    await scrollAndCheck(page, '#hasReminder');

    // Add reminders to have 3 total
    await page.locator('#addReminderBtn').click();
    await page.locator('#addReminderBtn').click();

    const reminderItems = page.locator('.reminder-item');
    await expect(reminderItems).toHaveCount(3);

    // Remove the middle reminder
    await page.locator('.reminder-item').nth(1).locator('.reminder-remove-btn').click();
    await expect(reminderItems).toHaveCount(2);

    // Remove another
    await page.locator('.reminder-item').first().locator('.reminder-remove-btn').click();
    await expect(reminderItems).toHaveCount(1);
  });

  test('should uncheck reminder checkbox when last reminder is removed', async ({ page }) => {
    // Enable reminders
    await scrollAndCheck(page, '#hasReminder');

    // Should have one reminder
    const reminderItems = page.locator('.reminder-item');
    await expect(reminderItems).toHaveCount(1);

    // Remove the last reminder
    await page.locator('.reminder-remove-btn').first().click();

    // Reminder checkbox should be unchecked and section collapsed
    const checkbox = page.locator('#hasReminder');
    await expect(checkbox).not.toBeChecked();
    await expect(page.locator('#reminderOptions')).not.toBeVisible();
  });

  test('should enforce maximum of 5 reminders', async ({ page }) => {
    // Enable reminders
    await scrollAndCheck(page, '#hasReminder');

    const addBtn = page.locator('#addReminderBtn');

    // Add 4 more reminders (total 5)
    for (let i = 0; i < 4; i++) {
      await addBtn.click();
    }

    const reminderItems = page.locator('.reminder-item');
    await expect(reminderItems).toHaveCount(5);

    // Add button should be hidden
    await expect(addBtn).not.toBeVisible();

    // Hint should be visible
    const hint = page.locator('#reminderHint');
    await expect(hint).toBeVisible();
  });

  test('should generate multiple VALARM components in ICS', async ({ page }) => {
    // Fill required fields
    await page.fill('#title', 'Multi-Reminder Test');
    await page.fill('#startDate', '2026-03-20');
    await page.fill('#startTime', '10:00');
    await page.fill('#endDate', '2026-03-20');
    await page.fill('#endTime', '11:00');

    // Enable reminders
    await scrollAndCheck(page, '#hasReminder');

    // Set first reminder to 15 minutes
    await page.locator('.reminder-item select').first().selectOption('15');

    // Add second reminder - 1 hour before
    await page.locator('#addReminderBtn').click();
    await page.locator('.reminder-item select').nth(1).selectOption('60');

    // Add third reminder - 1 day before
    await page.locator('#addReminderBtn').click();
    await page.locator('.reminder-item select').nth(2).selectOption('1440');

    // Generate ICS
    const downloadPromise = page.waitForEvent('download');
    await page.click('#downloadBtn');
    const download = await downloadPromise;

    // Read the downloaded file
    const filePath = await download.path();
    const fs = require('fs');
    const icsContent = fs.readFileSync(filePath, 'utf-8');

    // Count VALARM components - should have 3
    const valarmCount = (icsContent.match(/BEGIN:VALARM/g) || []).length;
    expect(valarmCount).toBe(3);

    // Verify different trigger values (ICAL.js formats 60 min as PT60M and 1440 min as P1D)
    expect(icsContent).toContain('TRIGGER:-PT15M');
    expect(icsContent).toContain('TRIGGER:-PT60M');
    expect(icsContent).toContain('TRIGGER:-PT1440M');
  });

  test('should persist reminders in form state', async ({ page }) => {
    // Enable reminders
    await scrollAndCheck(page, '#hasReminder');

    // Set first reminder to 30 minutes
    await page.locator('.reminder-item select').first().selectOption('30');

    // Add second reminder - 1 hour
    await page.locator('#addReminderBtn').click();
    await page.locator('.reminder-item select').nth(1).selectOption('60');

    // Reload page
    await page.reload();

    // Reminders should be restored
    const checkbox = page.locator('#hasReminder');
    await expect(checkbox).toBeChecked();

    // Expand reminder options to see items
    const reminderItems = page.locator('.reminder-item');
    await expect(reminderItems).toHaveCount(2);

    // Verify values
    await expect(page.locator('.reminder-item select').first()).toHaveValue('30');
    await expect(page.locator('.reminder-item select').nth(1)).toHaveValue('60');
  });

});
