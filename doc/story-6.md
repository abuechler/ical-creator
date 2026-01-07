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