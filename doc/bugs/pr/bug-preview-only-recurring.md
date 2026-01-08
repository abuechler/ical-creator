# Bug: Preview Only Shown for Recurring Events

## Description

The preview section is only displayed when the "Repeat this event" checkbox is checked. This makes the UI look odd and asymmetric for non-recurring events, as users don't see any preview of their event unless they enable recurrence.

## Expected Behavior

The preview section should be visible for all events (both recurring and non-recurring), showing a preview of the event being created.

## Actual Behavior

The preview section (`#previewSection`) is conditionally shown only when `isRecurring` is true:
- Line 1965 in ical-creator.html: `previewSection.style.display = isRecurring ? 'block' : 'none';`

## Steps to Reproduce

1. Open the iCal Creator application
2. Fill in event details (title, date, time, etc.)
3. Observe that no preview is shown
4. Click on "Repeat this event" checkbox
5. Preview section appears

## Impact

- UI inconsistency and asymmetric layout
- Users cannot see a preview of non-recurring events
- Poor user experience for simple one-time events

## Proposed Solution

1. Show the preview section for all events, not just recurring ones
2. For non-recurring events, display the single event occurrence
3. For recurring events, display the calendar with all occurrences and exceptions

## Files Affected

- ical-creator.html (JavaScript section handling preview display logic)
- tests/ical-creator.spec.js (Added test coverage for preview visibility)

## Planning Decisions

### Start timestamp
2026-01-08 08:45:00

### End timestamp
2026-01-08 09:01:08

### Duration
Approximately 16 minutes

### Implementation Decisions

1. **Always show preview section**: Changed the logic in `handleRecurringToggle()` to always display the preview section (`previewSection.style.display = 'block'`), regardless of whether the event is recurring or not.

2. **Dynamic preview content**: Created a new `updatePreviewContent(isRecurring)` function that:
   - Updates the preview title to "Preview" for non-recurring events and "Preview & Exceptions" for recurring events
   - Changes the instructions text based on event type
   - Shows/hides exception-related UI (exception toggle and legend) based on recurring status

3. **Calendar initialization**: Updated `renderCalendar()` to automatically set the calendar view to the first event occurrence's month, ensuring the event is visible in the calendar grid.

4. **Event listener updates**: Modified the startDate change event listener to always show the preview and render the calendar when a valid start date is entered, not just for recurring events.

5. **Exception handling**: Updated `toggleException()` and `createDayElement()` to prevent exceptions from being added for non-recurring events (clicking event dates has no effect for non-recurring events).

### Assumptions Made

1. Users want to see a preview of their event immediately when they enter a start date, regardless of whether it's recurring
2. The calendar should automatically show the month containing the event (not necessarily the current month)
3. For non-recurring events, the exception UI should be completely hidden as it's not relevant
4. The event day should still be clickable for recurring events but not for non-recurring events (indicated by cursor style)

### Test Coverage

Added comprehensive Playwright tests covering:
- Preview visibility for non-recurring events
- Correct preview title and instructions text
- Exception UI visibility toggling
- Cursor behavior for event days
- Preview persistence when switching between recurring and non-recurring modes
