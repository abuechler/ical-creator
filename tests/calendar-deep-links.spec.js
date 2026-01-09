// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

// Helper to get the file URL for the HTML page
const getPageUrl = () => {
  return 'file://' + path.resolve(__dirname, '../ical-creator.html');
};

// Helper to scroll and interact with elements
async function scrollAndClick(page, selector) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await element.click();
}

async function scrollAndFill(page, selector, value) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await element.fill(value);
}

async function scrollAndCheck(page, selector) {
  const element = page.locator(selector);
  const isToggle = await element.locator('xpath=..').evaluate(el => el.classList.contains('toggle-switch'));

  if (isToggle) {
    const slider = element.locator('xpath=following-sibling::span[@class="toggle-slider"]');
    await slider.scrollIntoViewIfNeeded();
    await slider.click();
  } else {
    await element.scrollIntoViewIfNeeded();
    await element.check({ force: true });
  }
}

async function scrollAndSelect(page, selector, value) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await element.selectOption(value);
}

test.describe('Calendar App Deep Links - Dropdown UI', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display Add to Calendar dropdown button', async ({ page }) => {
    const dropdown = page.locator('#addToCalendarBtn');
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toHaveText(/Add to Calendar/);
  });

  test('should show dropdown menu when button is clicked', async ({ page }) => {
    const dropdownMenu = page.locator('#calendarDropdownMenu');

    // Initially hidden
    await expect(dropdownMenu).not.toBeVisible();

    // Click to open
    await scrollAndClick(page, '#addToCalendarBtn');

    // Should be visible now
    await expect(dropdownMenu).toBeVisible();
  });

  test('should close dropdown when clicking outside', async ({ page }) => {
    // Open dropdown
    await scrollAndClick(page, '#addToCalendarBtn');
    await expect(page.locator('#calendarDropdownMenu')).toBeVisible();

    // Click outside
    await page.locator('h1').click();

    // Should be hidden
    await expect(page.locator('#calendarDropdownMenu')).not.toBeVisible();
  });

  test('should close dropdown on Escape key', async ({ page }) => {
    // Open dropdown
    await scrollAndClick(page, '#addToCalendarBtn');
    await expect(page.locator('#calendarDropdownMenu')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Should be hidden
    await expect(page.locator('#calendarDropdownMenu')).not.toBeVisible();
  });

  test('should show all three calendar options in dropdown', async ({ page }) => {
    await scrollAndClick(page, '#addToCalendarBtn');

    await expect(page.locator('#addToGoogleCalendar')).toBeVisible();
    await expect(page.locator('#addToGoogleCalendar')).toHaveText(/Google Calendar/);

    await expect(page.locator('#addToOutlook')).toBeVisible();
    await expect(page.locator('#addToOutlook')).toHaveText(/Outlook/);

    await expect(page.locator('#addToYahoo')).toBeVisible();
    await expect(page.locator('#addToYahoo')).toHaveText(/Yahoo Calendar/);
  });

  test('should update aria-expanded when dropdown opens/closes', async ({ page }) => {
    const btn = page.locator('#addToCalendarBtn');

    // Initially closed
    await expect(btn).toHaveAttribute('aria-expanded', 'false');

    // Open
    await scrollAndClick(page, '#addToCalendarBtn');
    await expect(btn).toHaveAttribute('aria-expanded', 'true');

    // Close
    await page.keyboard.press('Escape');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Calendar App Deep Links - URL Generation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('should validate form before generating Google Calendar URL', async ({ page }) => {
    // Clear title (required field)
    await scrollAndFill(page, '#title', '');

    // Open dropdown and click Google Calendar
    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToGoogleCalendar');

    // Should show error for empty title
    await expect(page.locator('#title-error')).toBeVisible();
  });

  test('should generate correct Google Calendar URL for basic event', async ({ page }) => {
    // Fill in event details
    await scrollAndFill(page, '#title', 'Test Event');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '10:00');
    await scrollAndFill(page, '#endTime', '11:00');
    await scrollAndFill(page, '#location', 'Conference Room A');
    await scrollAndFill(page, '#description', 'Test description');

    // Capture the URL that would be opened
    let capturedUrl = '';
    await page.evaluate(() => {
      // Override window.open to capture URL
      window.originalOpen = window.open;
      window.open = (url) => {
        window.capturedUrl = url;
        return null;
      };
    });

    // Open dropdown and click Google Calendar
    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToGoogleCalendar');

    // Get the captured URL
    capturedUrl = await page.evaluate(() => window.capturedUrl);

    // Verify URL structure
    expect(capturedUrl).toContain('https://calendar.google.com/calendar/render');
    expect(capturedUrl).toContain('action=TEMPLATE');
    expect(capturedUrl).toContain('text=Test+Event');
    expect(capturedUrl).toContain('dates=');
    expect(capturedUrl).toContain('location=Conference+Room+A');
    expect(capturedUrl).toContain('details=Test+description');
  });

  test('should generate correct Google Calendar URL for all-day event', async ({ page }) => {
    await scrollAndFill(page, '#title', 'All Day Event');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndCheck(page, '#allDay');

    let capturedUrl = '';
    await page.evaluate(() => {
      window.open = (url) => {
        window.capturedUrl = url;
        return null;
      };
    });

    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToGoogleCalendar');

    capturedUrl = await page.evaluate(() => window.capturedUrl);

    // All-day format: YYYYMMDD (no time component in the dates parameter)
    expect(capturedUrl).toContain('dates=20260315');
    // The dates parameter should not contain time (no 'T' after the date)
    const datesMatch = capturedUrl.match(/dates=([^&]+)/);
    expect(datesMatch).toBeTruthy();
    expect(datesMatch[1]).not.toContain('T'); // dates value should not contain time separator
  });

  test('should generate correct Outlook URL for basic event', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Outlook Test Event');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '14:00');
    await scrollAndFill(page, '#endTime', '15:30');
    await scrollAndFill(page, '#location', 'Meeting Room B');

    let capturedUrl = '';
    await page.evaluate(() => {
      window.open = (url) => {
        window.capturedUrl = url;
        return null;
      };
    });

    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToOutlook');

    capturedUrl = await page.evaluate(() => window.capturedUrl);

    expect(capturedUrl).toContain('https://outlook.live.com/calendar/0/deeplink/compose');
    expect(capturedUrl).toContain('subject=Outlook+Test+Event');
    expect(capturedUrl).toContain('startdt=2026-03-15T14%3A00');
    expect(capturedUrl).toContain('location=Meeting+Room+B');
  });

  test('should generate correct Outlook URL for all-day event', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Outlook All Day');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndCheck(page, '#allDay');

    let capturedUrl = '';
    await page.evaluate(() => {
      window.open = (url) => {
        window.capturedUrl = url;
        return null;
      };
    });

    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToOutlook');

    capturedUrl = await page.evaluate(() => window.capturedUrl);

    expect(capturedUrl).toContain('allday=true');
  });

  test('should generate correct Yahoo Calendar URL for basic event', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Yahoo Test Event');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '09:00');
    await scrollAndFill(page, '#endTime', '10:00');
    await scrollAndFill(page, '#location', 'Office');
    await scrollAndFill(page, '#description', 'Yahoo event description');

    let capturedUrl = '';
    await page.evaluate(() => {
      window.open = (url) => {
        window.capturedUrl = url;
        return null;
      };
    });

    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToYahoo');

    capturedUrl = await page.evaluate(() => window.capturedUrl);

    expect(capturedUrl).toContain('https://calendar.yahoo.com/');
    expect(capturedUrl).toContain('title=Yahoo+Test+Event');
    expect(capturedUrl).toContain('st=20260315T090000');
    expect(capturedUrl).toContain('et=20260315T100000');
    expect(capturedUrl).toContain('in_loc=Office');
    expect(capturedUrl).toContain('desc=Yahoo+event+description');
  });

  test('should generate correct Yahoo Calendar URL for all-day event', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Yahoo All Day');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndCheck(page, '#allDay');

    let capturedUrl = '';
    await page.evaluate(() => {
      window.open = (url) => {
        window.capturedUrl = url;
        return null;
      };
    });

    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToYahoo');

    capturedUrl = await page.evaluate(() => window.capturedUrl);

    expect(capturedUrl).toContain('dur=allday');
  });
});

test.describe('Calendar App Deep Links - Recurring Events', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('should include RRULE in Google Calendar URL for daily recurring event', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Daily Standup');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '09:00');
    await scrollAndFill(page, '#endTime', '09:15');

    // Enable recurrence
    await scrollAndCheck(page, '#isRecurring');
    await scrollAndSelect(page, '#frequency', 'DAILY');

    let capturedUrl = '';
    await page.evaluate(() => {
      window.open = (url) => {
        window.capturedUrl = url;
        return null;
      };
    });

    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToGoogleCalendar');

    capturedUrl = await page.evaluate(() => window.capturedUrl);

    expect(capturedUrl).toContain('recur=RRULE%3AFREQ%3DDAILY');
  });

  test('should include RRULE with BYDAY in Google Calendar URL for weekly recurring event', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Weekly Team Meeting');
    await scrollAndFill(page, '#startDate', '2026-03-16'); // Monday
    await scrollAndFill(page, '#startTime', '10:00');
    await scrollAndFill(page, '#endTime', '11:00');

    // Enable recurrence
    await scrollAndCheck(page, '#isRecurring');
    await scrollAndSelect(page, '#frequency', 'WEEKLY');

    // Select Monday (should already be selected based on start date)
    // Also select Wednesday
    await scrollAndClick(page, '.day-picker-btn[data-day="WE"]');

    let capturedUrl = '';
    await page.evaluate(() => {
      window.open = (url) => {
        window.capturedUrl = url;
        return null;
      };
    });

    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToGoogleCalendar');

    capturedUrl = await page.evaluate(() => window.capturedUrl);

    expect(capturedUrl).toContain('recur=RRULE%3AFREQ%3DWEEKLY');
    expect(capturedUrl).toContain('BYDAY');
  });

  test('should include RRULE with BYMONTHDAY in Google Calendar URL for monthly by date', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Monthly Report');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '14:00');
    await scrollAndFill(page, '#endTime', '15:00');

    // Enable recurrence
    await scrollAndCheck(page, '#isRecurring');
    await scrollAndSelect(page, '#frequency', 'MONTHLY');

    // Keep "Day of month" selected (default)
    await expect(page.locator('#monthlyByDate')).toBeChecked();

    let capturedUrl = '';
    await page.evaluate(() => {
      window.open = (url) => {
        window.capturedUrl = url;
        return null;
      };
    });

    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToGoogleCalendar');

    capturedUrl = await page.evaluate(() => window.capturedUrl);

    expect(capturedUrl).toContain('recur=RRULE%3AFREQ%3DMONTHLY');
    expect(capturedUrl).toContain('BYMONTHDAY%3D15');
  });

  test('should include RRULE with BYDAY in Google Calendar URL for monthly by weekday', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Monthly Team Lunch');
    await scrollAndFill(page, '#startDate', '2026-03-11'); // 2nd Wednesday
    await scrollAndFill(page, '#startTime', '12:00');
    await scrollAndFill(page, '#endTime', '13:00');

    // Enable recurrence
    await scrollAndCheck(page, '#isRecurring');
    await scrollAndSelect(page, '#frequency', 'MONTHLY');

    // Select "Day of week"
    await scrollAndClick(page, '#monthlyByDay');

    let capturedUrl = '';
    await page.evaluate(() => {
      window.open = (url) => {
        window.capturedUrl = url;
        return null;
      };
    });

    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToGoogleCalendar');

    capturedUrl = await page.evaluate(() => window.capturedUrl);

    expect(capturedUrl).toContain('recur=RRULE%3AFREQ%3DMONTHLY');
    expect(capturedUrl).toContain('BYDAY%3D2WE'); // 2nd Wednesday
  });

  test('should include COUNT in RRULE when end by count is selected', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Limited Series');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '10:00');
    await scrollAndFill(page, '#endTime', '11:00');

    // Enable recurrence
    await scrollAndCheck(page, '#isRecurring');

    // Select end by count
    await scrollAndClick(page, '#endByCount');
    await scrollAndFill(page, '#occurrenceCount', '5');

    let capturedUrl = '';
    await page.evaluate(() => {
      window.open = (url) => {
        window.capturedUrl = url;
        return null;
      };
    });

    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToGoogleCalendar');

    capturedUrl = await page.evaluate(() => window.capturedUrl);

    expect(capturedUrl).toContain('COUNT%3D5');
  });

  test('should include UNTIL in RRULE when end by date is selected', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Until Date Event');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '10:00');
    await scrollAndFill(page, '#endTime', '11:00');

    // Enable recurrence
    await scrollAndCheck(page, '#isRecurring');

    // End by date should be default, set the date
    await scrollAndFill(page, '#recurrenceEndDate', '2026-06-15');

    let capturedUrl = '';
    await page.evaluate(() => {
      window.open = (url) => {
        window.capturedUrl = url;
        return null;
      };
    });

    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToGoogleCalendar');

    capturedUrl = await page.evaluate(() => window.capturedUrl);

    expect(capturedUrl).toContain('UNTIL%3D20260615');
  });

  test('should include INTERVAL in RRULE when interval > 1', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Every 2 Weeks');
    await scrollAndFill(page, '#startDate', '2026-03-16');
    await scrollAndFill(page, '#startTime', '10:00');
    await scrollAndFill(page, '#endTime', '11:00');

    // Enable recurrence
    await scrollAndCheck(page, '#isRecurring');
    await scrollAndSelect(page, '#frequency', 'WEEKLY');
    await scrollAndSelect(page, '#interval', '2');

    let capturedUrl = '';
    await page.evaluate(() => {
      window.open = (url) => {
        window.capturedUrl = url;
        return null;
      };
    });

    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToGoogleCalendar');

    capturedUrl = await page.evaluate(() => window.capturedUrl);

    expect(capturedUrl).toContain('INTERVAL%3D2');
  });
});

test.describe('Calendar App Deep Links - Accessibility', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
  });

  test('dropdown button should have appropriate ARIA attributes', async ({ page }) => {
    const btn = page.locator('#addToCalendarBtn');

    await expect(btn).toHaveAttribute('aria-haspopup', 'true');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('dropdown menu should have role="menu"', async ({ page }) => {
    await expect(page.locator('#calendarDropdownMenu')).toHaveAttribute('role', 'menu');
  });

  test('dropdown items should have role="menuitem"', async ({ page }) => {
    await scrollAndClick(page, '#addToCalendarBtn');

    await expect(page.locator('#addToGoogleCalendar')).toHaveAttribute('role', 'menuitem');
    await expect(page.locator('#addToOutlook')).toHaveAttribute('role', 'menuitem');
    await expect(page.locator('#addToYahoo')).toHaveAttribute('role', 'menuitem');
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Focus the dropdown button directly
    await page.locator('#addToCalendarBtn').focus();
    await expect(page.locator('#addToCalendarBtn')).toBeFocused();

    // Press Enter to open dropdown
    await page.keyboard.press('Enter');
    await expect(page.locator('#calendarDropdownMenu')).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(page.locator('#calendarDropdownMenu')).not.toBeVisible();
  });
});

test.describe('Calendar App Deep Links - Mobile View', () => {

  test.use({ viewport: { width: 375, height: 812 } }); // iPhone 11

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
  });

  test('dropdown should be visible on mobile', async ({ page }) => {
    await expect(page.locator('#addToCalendarBtn')).toBeVisible();
  });

  test('dropdown menu should open correctly on mobile', async ({ page }) => {
    await scrollAndClick(page, '#addToCalendarBtn');
    await expect(page.locator('#calendarDropdownMenu')).toBeVisible();
    await expect(page.locator('#addToGoogleCalendar')).toBeVisible();
  });

  test('dropdown menu should be right-aligned on mobile to prevent overflow', async ({ page }) => {
    await scrollAndClick(page, '#addToCalendarBtn');

    const menu = page.locator('#calendarDropdownMenu');
    const menuBox = await menu.boundingBox();
    const viewportSize = page.viewportSize();

    // Menu should not overflow the right edge
    expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(viewportSize.width);
  });
});

test.describe('Calendar App Deep Links - Desktop View', () => {

  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
  });

  test('dropdown should be visible on desktop', async ({ page }) => {
    await expect(page.locator('#addToCalendarBtn')).toBeVisible();
  });

  test('dropdown menu should open correctly on desktop', async ({ page }) => {
    await scrollAndClick(page, '#addToCalendarBtn');
    await expect(page.locator('#calendarDropdownMenu')).toBeVisible();
  });

  test('all calendar options should be clickable on desktop', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Desktop Test');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '10:00');

    // Mock window.open
    await page.evaluate(() => {
      window.openCalls = [];
      window.open = (url) => {
        window.openCalls.push(url);
        return null;
      };
    });

    // Test Google Calendar
    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToGoogleCalendar');

    let calls = await page.evaluate(() => window.openCalls);
    expect(calls.length).toBe(1);
    expect(calls[0]).toContain('calendar.google.com');

    // Test Outlook
    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToOutlook');

    calls = await page.evaluate(() => window.openCalls);
    expect(calls.length).toBe(2);
    expect(calls[1]).toContain('outlook.live.com');

    // Test Yahoo
    await scrollAndClick(page, '#addToCalendarBtn');
    await scrollAndClick(page, '#addToYahoo');

    calls = await page.evaluate(() => window.openCalls);
    expect(calls.length).toBe(3);
    expect(calls[2]).toContain('calendar.yahoo.com');
  });
});
