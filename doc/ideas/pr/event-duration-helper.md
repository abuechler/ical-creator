# Event Duration Helper

## Description
Provide quick preset duration buttons (30 min, 1 hour, 2 hours, All day) to automatically set the end time based on start time.

## User Value
- **Speed**: Set common durations with one click
- **Convenience**: No need to manually calculate end times

## Implementation Details
- Add duration preset buttons (30 min, 1 hour, 2 hours, All day)
- Clicking duration preset auto-fills end date/time based on start
- Active preset button is highlighted to show current selection
- Selection is cleared when times are manually changed

## Planning Decisions

### Start Timestamp
2026-01-09 03:30:00

### Implementation Plan
1. Create duration preset buttons (30 min, 1h, 2h, All day)
2. Add handlers for duration presets to set end time
3. Add CSS for preset button styling and active state
4. Write Playwright tests

### Assumptions
- Duration presets only work if start time is set
- "All day" preset enables the all-day checkbox
- Clicking a preset replaces (not adds to) the current end time
- Active button styling clearly indicates current selection

### End Timestamp
2026-01-09 04:00:00

### Duration
30 minutes

### Bug Fix
Also fixed `formatDateForInput()` function to use local date components instead of `toISOString()` to prevent timezone-related date shifts.

### Update (2026-01-15)
Removed the duration display element that showed calculated duration (e.g., "1h 30m"). The display was visually similar to the preset buttons, causing user confusion. The active button styling already clearly indicates the selected preset.

## Screenshots

### Desktop View (1440x900)
![Event Duration Helper Desktop](screenshots/event-duration-helper-desktop.png)

### Mobile View (375x812)
![Event Duration Helper Mobile](screenshots/event-duration-helper-mobile.png)
