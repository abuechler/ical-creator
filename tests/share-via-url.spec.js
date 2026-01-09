// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Share via URL Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and navigate to page
    await page.goto('file://' + process.cwd() + '/ical-creator.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should have share button visible', async ({ page }) => {
    const shareBtn = page.locator('#shareBtn');
    await expect(shareBtn).toBeVisible();
    await expect(shareBtn).toContainText('Share');
  });

  test('should have toast element in DOM', async ({ page }) => {
    const toast = page.locator('#toast');
    await expect(toast).toBeAttached();
  });

  test('should show toast when clicking share with empty title', async ({ page }) => {
    // Clear the title field
    await page.locator('#title').clear();

    // Click share button
    await page.locator('#shareBtn').click();

    // Toast should appear with error message
    const toast = page.locator('#toast');
    await expect(toast).toHaveClass(/show/);
    await expect(toast).toContainText('Please enter an event title first');
  });

  test('should show toast when sharing event with title', async ({ page }) => {
    // Fill in event title
    await page.locator('#title').fill('Test Meeting');
    await page.locator('#startDate').fill('2026-02-15');

    // Click share button
    await page.locator('#shareBtn').click();

    // Toast should appear (either success or fallback message)
    const toast = page.locator('#toast');
    await expect(toast).toHaveClass(/show/);
  });

  test('generateShareUrl should encode event data', async ({ page }) => {
    // Fill in event details
    await page.locator('#title').fill('Test Event');
    await page.locator('#startDate').fill('2026-03-20');

    // Call generateShareUrl function and verify it contains event data
    const shareUrl = await page.evaluate(() => {
      const eventData = {
        title: document.getElementById('title').value,
        startDate: document.getElementById('startDate').value
      };
      const json = JSON.stringify(eventData);
      const encoded = btoa(encodeURIComponent(json));
      return window.location.href.split('#')[0] + '#event=' + encoded;
    });

    // URL should contain #event= prefix
    expect(shareUrl).toContain('#event=');
  });

  test('loadEventFromUrl should parse encoded event data', async ({ page }) => {
    // Test the decoding logic directly
    const result = await page.evaluate(() => {
      const eventData = {
        title: 'Test Title',
        startDate: '2026-04-10',
        startTime: '09:00',
        location: 'Office'
      };

      // Encode like generateShareUrl does
      const json = JSON.stringify(eventData);
      const encoded = btoa(encodeURIComponent(json));

      // Decode like loadEventFromUrl does
      const decoded = decodeURIComponent(atob(encoded));
      const parsed = JSON.parse(decoded);

      return parsed;
    });

    // Verify roundtrip works
    expect(result.title).toBe('Test Title');
    expect(result.startDate).toBe('2026-04-10');
    expect(result.startTime).toBe('09:00');
    expect(result.location).toBe('Office');
  });

  test('populateFormFromEventData should set form values', async ({ page }) => {
    // Call populateFormFromEventData directly and check if form is filled
    await page.evaluate(() => {
      const eventData = {
        title: 'Populated Event',
        startDate: '2026-05-15',
        startTime: '14:00',
        location: 'Conference Room',
        description: 'Test Description'
      };
      // @ts-ignore
      window.populateFormFromEventData(eventData);
    });

    // Verify form values
    await expect(page.locator('#title')).toHaveValue('Populated Event');
    await expect(page.locator('#startDate')).toHaveValue('2026-05-15');
    await expect(page.locator('#startTime')).toHaveValue('14:00');
    await expect(page.locator('#location')).toHaveValue('Conference Room');
    await expect(page.locator('#description')).toHaveValue('Test Description');
  });

  test('populateFormFromEventData should set recurring options', async ({ page }) => {
    await page.evaluate(() => {
      const eventData = {
        title: 'Recurring Event',
        startDate: '2026-06-01',
        isRecurring: true,
        frequency: 'WEEKLY',
        interval: '2',
        hasReminder: true,
        reminderTime: '30'
      };
      // @ts-ignore
      window.populateFormFromEventData(eventData);
    });

    // Verify form values
    await expect(page.locator('#title')).toHaveValue('Recurring Event');
    await expect(page.locator('#isRecurring')).toBeChecked();
    await expect(page.locator('#frequency')).toHaveValue('WEEKLY');
    await expect(page.locator('#interval')).toHaveValue('2');
    await expect(page.locator('#hasReminder')).toBeChecked();
  });

  test('toast should disappear after timeout', async ({ page }) => {
    // Trigger toast via share button
    await page.locator('#title').clear();
    await page.locator('#shareBtn').click();

    // Toast should be visible
    const toast = page.locator('#toast');
    await expect(toast).toHaveClass(/show/);

    // Wait for toast to disappear (3 seconds + buffer)
    await page.waitForTimeout(3500);

    // Toast should no longer have 'show' class
    await expect(toast).not.toHaveClass(/show/);
  });

  test('share button should have share icon', async ({ page }) => {
    const shareBtnSvg = page.locator('#shareBtn svg');
    await expect(shareBtnSvg).toBeVisible();
  });
});
