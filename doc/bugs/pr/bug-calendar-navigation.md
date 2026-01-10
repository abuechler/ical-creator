# Bug: Calendar Month Navigation Not Working

## Description

The Next/Previous month navigation buttons in the preview calendar were not functioning. When clicked, the calendar would immediately reset back to the first occurrence's month, preventing users from navigating to see events in future months or adding exceptions to events in months other than the first.

## Expected Behavior

Clicking the Next (›) or Previous (‹) month buttons should navigate the calendar to show the adjacent month, allowing users to:
- View recurring events in future/past months
- Add or remove exceptions for events in any month

## Actual Behavior

When clicking the navigation buttons:
1. The `navigateCalendar()` function correctly updated `state.calendarDate`
2. It then called `renderCalendar()` to redraw the calendar
3. `renderCalendar()` immediately reset `state.calendarDate` to the first occurrence's month
4. The calendar appeared to not respond to navigation

## Steps to Reproduce

1. Open the iCal Creator application
2. Create a recurring event (e.g., weekly on Fridays)
3. Observe the preview calendar shows the first occurrence's month
4. Click the "Next" (›) button to navigate to the next month
5. Calendar immediately resets to the original month

## Root Cause

In `script.js`, the `renderCalendar()` function was unconditionally resetting `state.calendarDate` to the first occurrence's month on every call:

```javascript
function renderCalendar() {
    // ...
    state.calendarDate = new Date(firstOccurrence);  // Always reset!
    // ...
}
```

This meant that any navigation changes were immediately overwritten when the calendar was redrawn.

## Solution

Added an optional `resetToFirstOccurrence` parameter to `renderCalendar()`:
- `true`: Reset calendar to first occurrence month (used when event data changes)
- `false` (default): Keep the current month (used for navigation and exception toggling)

Updated 11 call sites to pass `true` when the event data changes (form inputs, loading saved events), preserving the default `false` for navigation calls.

## Files Affected

- `script.js` - Added parameter to `renderCalendar()` and updated call sites
- `tests/ical-creator.spec.js` - Added 22 new UI interaction tests
- `package.json` - Version bump to 1.12.1

## Screenshots

### Desktop (1440x900)

![Calendar navigation desktop](../../screenshots/calendar-navigation-desktop.gif)

### Mobile (iPhone 11 - 375x812)

![Calendar navigation mobile](../../screenshots/calendar-navigation-mobile.gif)

## Planning Decisions

### Start timestamp
2026-01-10 10:00:00

### End timestamp
2026-01-10 10:18:38

### Duration
Approximately 18 minutes

### Implementation Decisions

1. **Optional parameter approach**: Rather than creating a separate function or using a global flag, added an optional `resetToFirstOccurrence` parameter to the existing `renderCalendar()` function. This minimizes code changes while clearly expressing intent at each call site.

2. **Default to false**: The default value of `false` means existing navigation code works correctly without modification. Only explicit resets (when event data changes) need to pass `true`.

3. **Identified all reset points**: Carefully reviewed all 11 places where `renderCalendar()` is called and determined which should reset to first occurrence:
   - Form field changes (start date, recurrence pattern, etc.) → reset
   - Loading saved events → reset
   - Navigation buttons → don't reset
   - Exception toggling → don't reset

### Assumptions Made

1. Users expect the calendar to jump to the first occurrence when they change the event's date or recurrence pattern
2. Users expect the calendar to stay on the current month when navigating or toggling exceptions
3. The navigation buttons should work consistently regardless of whether exceptions exist

### Test Coverage

Added 22 new Playwright tests covering:
- Next/Previous month button navigation
- Multi-month navigation with event visibility verification
- Exception management via clicking dates in different months
- Last Friday recurrence pattern navigation and exceptions
- Navigation persistence after toggling exceptions
