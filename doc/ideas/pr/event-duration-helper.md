# Event Duration Helper

## Description
Show calculated event duration when both start and end times are set, and provide quick preset duration buttons (30 min, 1 hour, 2 hours, etc.) to automatically set the end time.

## User Value
- **Clarity**: Instantly see how long the event will be
- **Speed**: Set common durations with one click
- **Error Prevention**: Catch mistakes when duration seems wrong

## Implementation Details
- Display duration badge next to end time field when both times are set
- Add duration preset buttons (30 min, 1 hour, 2 hours, All day)
- Clicking duration preset auto-fills end date/time based on start
- Update duration display in real-time as times change

## Planning Decisions

### Start Timestamp
2026-01-09 03:30:00

### Implementation Plan
1. Add duration display element next to end time field
2. Create duration preset buttons (30 min, 1h, 2h, All day)
3. Add JavaScript to calculate and display duration
4. Add handlers for duration presets to set end time
5. Add CSS for duration badge and preset button styling
6. Write Playwright tests

### Assumptions
- Duration presets only work if start time is set
- "All day" preset enables the all-day checkbox
- Duration is calculated in hours/minutes format
- Duration display updates on input change
- Negative duration shows warning or is prevented

### End Timestamp
2026-01-09 04:00:00

### Duration
30 minutes

### Bug Fix
Also fixed `formatDateForInput()` function to use local date components instead of `toISOString()` to prevent timezone-related date shifts.

## Screenshots

### Desktop View (1440x900)
![Event Duration Helper Desktop](screenshots/event-duration-helper-desktop.png)

### Mobile View (375x812)
![Event Duration Helper Mobile](screenshots/event-duration-helper-mobile.png)
