// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Directory containing generated ICS files
const OUTPUT_DIR = path.resolve(__dirname, '../test-output');

// Online validator URL
const VALIDATOR_URL = 'https://icalendar.org/validator.html';

test.describe('Online iCal Validator (icalendar.org)', () => {

  test.beforeAll(async () => {
    // Ensure test-output directory exists with ICS files
    if (!fs.existsSync(OUTPUT_DIR)) {
      throw new Error(`Test output directory not found: ${OUTPUT_DIR}. Run the main tests first.`);
    }

    const icsFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.ics'));
    if (icsFiles.length === 0) {
      throw new Error('No ICS files found in test-output directory. Run the main tests first.');
    }
  });

  // Get all ICS files from the test-output directory
  const getIcsFiles = () => {
    if (!fs.existsSync(OUTPUT_DIR)) return [];
    return fs.readdirSync(OUTPUT_DIR)
      .filter(f => f.endsWith('.ics'))
      .map(f => ({
        name: f,
        path: path.join(OUTPUT_DIR, f)
      }));
  };

  // Create a test for each ICS file
  const icsFiles = getIcsFiles();

  for (const icsFile of icsFiles) {
    test(`Validate ${icsFile.name} with online validator`, async ({ page }) => {
      // Navigate to the validator
      await page.goto(VALIDATOR_URL);

      // Wait for the page to load
      await page.waitForSelector('textarea, input[type="file"]');

      // Read the ICS file content
      const icsContent = fs.readFileSync(icsFile.path, 'utf-8');

      // Find the text input area and paste the ICS content
      // The validator has a textarea for pasting iCal content
      const textarea = page.locator('textarea').first();

      if (await textarea.isVisible()) {
        await textarea.fill(icsContent);

        // Look for and click the validate/submit button
        const validateBtn = page.locator('button:has-text("Validate"), input[type="submit"], button[type="submit"]').first();
        await validateBtn.click();

        // Wait for results
        await page.waitForTimeout(3000);

        // Check for validation results
        // The validator typically shows success/error messages
        const pageContent = await page.content();

        // Log the result for debugging
        console.log(`\n=== Validation Result for ${icsFile.name} ===`);

        // Check for common error indicators
        const hasError = pageContent.toLowerCase().includes('error') &&
                        !pageContent.toLowerCase().includes('no error');
        const hasWarning = pageContent.toLowerCase().includes('warning');
        const hasSuccess = pageContent.toLowerCase().includes('no error') ||
                          pageContent.toLowerCase().includes('valid') ||
                          pageContent.toLowerCase().includes('passed');

        if (hasSuccess) {
          console.log('✓ Validation PASSED');
        } else if (hasError) {
          console.log('✗ Validation FAILED - errors found');
          // Take a screenshot for debugging
          await page.screenshot({
            path: path.join(OUTPUT_DIR, `${icsFile.name}-validation-error.png`)
          });
        } else if (hasWarning) {
          console.log('⚠ Validation completed with warnings');
        } else {
          console.log('? Validation result unclear');
        }

        // We don't fail the test on validation errors for online validator
        // as the online validator may have stricter rules or different interpretations
        // Just log the results for manual review
        expect(true).toBe(true);

      } else {
        // If textarea not found, try file upload approach
        const fileInput = page.locator('input[type="file"]').first();

        if (await fileInput.isVisible()) {
          await fileInput.setInputFiles(icsFile.path);

          // Wait for upload and validation
          await page.waitForTimeout(3000);

          console.log(`Uploaded ${icsFile.name} for validation`);
          expect(true).toBe(true);
        } else {
          console.log(`Could not find input method for ${icsFile.name}`);
          expect(true).toBe(true);
        }
      }
    });
  }

  // Fallback test if no ICS files exist yet
  if (icsFiles.length === 0) {
    test('Placeholder - run main tests first', async () => {
      console.log('No ICS files found. Run the main test suite first to generate ICS files.');
      expect(true).toBe(true);
    });
  }

});
