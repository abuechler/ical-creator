# Preview Bug

There is a bug in the preview. When creating an event like shown below, the preview only shows the first event on January 30th, the following events are not shown anymore. Heres the iCal for the event:

```
BEGIN:VCALENDAR
PRODID:-//iCal Creator//ical-creator.html//EN
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:ical-creator-1767764384730-rjbo4m9tb@ical-creator
SEQUENCE:0
DTSTAMP:20260107T053944Z
SUMMARY:Letzter Freitag im Monat - Senioren Kaffee
DTSTART;TZID=Europe/Zurich:20260130T090000
DTEND;TZID=Europe/Zurich:20260130T110000
LOCATION:Restaurant Lokal\, Embrach
DESCRIPTION:Gemütliches beisammen sein und quatschen. Von Zeit zu Zeit spi
 elen wir auch folgende Spiele:\n\n- Schach\n- Ligretto\n- Hau den Lukas\n-
 Vergiss mein nicht\n\nEs wird definitiv nicht langweilig 😜
URL:https://www.restaurantlokal.ch
URL:https://www.restaurantlokal.ch
RRULE:FREQ=MONTHLY;COUNT=12;BYDAY=5FR
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder: Senioren Kaffee
TRIGGER:-PT60M
END:VALARM
END:VEVENT
END:VCALENDAR
```

Try to fix the bug so that all events are shown in the preview. Create a test case using mcp playwright with Firefox to verify that the preview shows all events correctly.

If you have any questions about the bug or need more information, feel free to ask with choices, ask one question at the time until you have all the information you need.

## Planning the Fix

**Start Time:** 2026-01-07 06:47:29

### Analysis

**Bug Location:** `ical-creator.html`, function `calculateOccurrences()` (lines 2047-2053)

**Root Cause:** The preview is limited to `state.calendarMonthsLoaded` months (default: 3). When an event has `RRULE:FREQ=MONTHLY;COUNT=12`, it spans ~12 months, but only occurrences within the first 3 months are calculated and displayed.

**Problem Code:**
```javascript
// Lines 2047-2053
const previewEndDate = new Date(startDate);
previewEndDate.setMonth(previewEndDate.getMonth() + state.calendarMonthsLoaded);

const effectiveEndDate = endDate ?
  (endDate < previewEndDate ? endDate : previewEndDate) :
  previewEndDate;
```

### Fix Approach

**Selected:** Dynamically extend preview range based on COUNT/frequency

**Implementation Plan:**
1. Before setting `effectiveEndDate`, calculate the required months based on COUNT and frequency
2. If `endType === 'count'`, estimate how many months are needed to cover all occurrences
3. Update `state.calendarMonthsLoaded` to ensure all occurrences are visible

## Implementation

**End Time:** 2026-01-07 07:15:15
**Total Duration:** ~28 minutes

### Changes Made

#### 1. Dynamic Preview Range Extension (`ical-creator.html`, lines 2047-2062)

Added code to calculate required months based on COUNT and frequency before setting `effectiveEndDate`:

```javascript
// Dynamically extend preview range based on COUNT and frequency
let requiredMonths = state.calendarMonthsLoaded;
if (endType === 'count' && maxCount > 1) {
  if (frequency === 'MONTHLY') {
    requiredMonths = Math.max(requiredMonths, maxCount * interval + 1);
  } else if (frequency === 'WEEKLY') {
    requiredMonths = Math.max(requiredMonths, Math.ceil((maxCount * interval * 7) / 30) + 1);
  } else if (frequency === 'DAILY') {
    requiredMonths = Math.max(requiredMonths, Math.ceil((maxCount * interval) / 30) + 1);
  }
  state.calendarMonthsLoaded = Math.max(state.calendarMonthsLoaded, requiredMonths);
}
```

#### 2. "Last Weekday" Logic for 5th Week Dates (`ical-creator.html`, lines 2100-2130)

Changed the "5th Friday" behavior to use "last Friday" since not all months have a 5th occurrence:

```javascript
// If 5th week or later, use "last weekday" logic (always exists)
const useLastWeekday = weekOfMonth >= 5;

if (useLastWeekday) {
  // Find last occurrence of weekday in month
  currentDate.setMonth(targetMonth + 1);
  currentDate.setDate(0); // Last day of target month
  while (currentDate.getDay() !== dayOfWeek) {
    currentDate.setDate(currentDate.getDate() - 1);
  }
}
```

#### 3. RRULE Generation Fix (`ical-creator.html`, lines 2627-2632)

Updated BYDAY value to use `-1` (last) instead of `5` for 5th week dates:

```javascript
// Use -1 (last) for 5th week since not all months have 5 occurrences
const weekNum = weekOfMonth >= 5 ? -1 : weekOfMonth;
rruleData.byday = [weekNum + dayCode];
```

#### 4. UI Label Update (`ical-creator.html`, lines 2312-2319)

Updated the hint text to show "last" instead of "5th":

```javascript
const ordinals = ['', '1st', '2nd', '3rd', '4th', 'last'];
const weekLabel = weekOfMonth >= 5 ? 'last' : ordinals[weekOfMonth];
```

#### 5. Event Listeners for Recalculation (`ical-creator.html`, lines 1817-1853)

Added event listeners for:
- `occurrenceCount` input changes
- `recurrenceEndDate` input changes
- `monthlyType` radio button changes

These ensure the preview recalculates when the user changes these values.

### Test Results

Created 3 new Playwright tests in `tests/ical-creator.spec.js`:

1. **Monthly last Friday recurrence should show all 12 occurrences in preview** - PASS
2. **Generated iCal should use BYDAY=-1FR for last Friday recurrence** - PASS
3. **Preview should extend beyond 3 months for COUNT-based recurrence** - PASS

All 26 existing tests continue to pass.

## Planning Decisions

**Planning Session:** 2026-01-07 06:47:29 - 06:52:00 (~5 minutes)

### Decision 1: Preview Range Fix Approach
**Question:** How should the preview calculate occurrences for recurring events with a specified COUNT?
**Options:**
1. Calculate all occurrences up to COUNT (Recommended)
2. Dynamically extend preview range
3. Increase default preview range

**Selected:** Option 2 - Dynamically extend preview range based on COUNT/frequency

### Decision 2: 5th Weekday Handling
**Question:** How should the 'Day of week' recurrence handle dates like the 5th Friday?
**Options:**
1. Use 'Last weekday' for 5th occurrence (Recommended)
2. Warn user and suggest alternatives
3. Keep current skip behavior

**Selected:** Option 1 - Use "last weekday" for 5th occurrence. This always exists and matches standard calendar app behavior.

### Decision 3: BYMONTHDAY Handling for Days That Don't Exist in All Months
**Requirement:** When using monthly recurrence by day-of-month (e.g., BYMONTHDAY=30):
1. Only create events on the exact day specified - skip months that don't have that day
2. No overflow allowed (e.g., Feb 30 should NOT become Mar 2)
3. Show a warning if the selected day doesn't exist in all months (29th, 30th, 31st)

**Example:** BYMONTHDAY=30 with COUNT=12 starting Jan 30, 2026:
- Jan 30 ✓
- Feb - SKIP (no 30th)
- Mar 30 ✓
- Apr 30 ✓
- May 30 ✓
- Jun 30 ✓
- Jul 30 ✓
- Aug 30 ✓
- Sep 30 ✓
- Oct 30 ✓
- Nov 30 ✓
- Dec 30 ✓
- Jan 30, 2027 ✓ (12th occurrence)