# Quick Date Presets

## Description
Add quick date preset buttons like "Today", "Tomorrow", "Next Week" to help users quickly set event dates without using the date picker.

## User Value
- **Speed**: Quickly set common dates with one click
- **Convenience**: No need to navigate date picker for common scenarios
- **Mobile-friendly**: Easier than typing dates on mobile devices

## Implementation Details
- Add preset buttons below or next to the date input field
- Presets to include: Today, Tomorrow, Next Week, Next Month
- Clicking a preset sets the start date automatically
- Visual feedback when a preset is selected

## Planning Decisions

### Start Timestamp
2026-01-09 02:40:00

### Implementation Plan
1. Add preset button group below start date field
2. Create preset buttons: Today, Tomorrow, Next Week, Next Month
3. Add JavaScript to handle preset clicks and update date field
4. Add CSS for preset button styling (small, pill-shaped buttons)
5. Clear preset selection when date is manually changed
6. Write Playwright tests for preset functionality

### Assumptions
- Presets will only affect the start date (not end date)
- "Next Week" means 7 days from today
- "Next Month" means same day next month (or last day if overflow)
- Presets should be styled as small, unobtrusive buttons
- Presets work alongside manual date entry

### End Timestamp
2026-01-09 03:25:00

### Duration
45 minutes

### Bug Fix
Fixed `formatDateForInput()` function to use local date components instead of `toISOString()` which was causing timezone-related date shifts (dates were off by one day in certain timezones).

## Screenshots

### Desktop View (1440x900)
![Quick Date Presets Desktop](screenshots/quick-date-presets-desktop.png)

### Mobile View (375x812)
![Quick Date Presets Mobile](screenshots/quick-date-presets-mobile.png)
