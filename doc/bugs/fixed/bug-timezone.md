# Timezone Bug

There is an issue with the timezone handling. The effect is the following:

- A user in timezone UTC+1 creates an event for 19:30 local time.
- When the same user imports the iCal file afterwards the event is at 20:30 in the calendar application.

Assumption: The iCal times are in UTC, but the local timezone offset is not considered when generating the iCal file.

Task: Check the assumption and fix the timezone handling when generating the iCal file.

## Planning Decisions

**Start Time:** 2026-01-06 12:00:00

### Analysis

**Root Cause Confirmed:** The assumption is correct.

In `ical-creator.html`, lines 2387-2388 and 2409:
```javascript
dtstart = ICAL.Time.fromDateTimeString(startDateStr + 'T' + startTimeStr + ':00');
dtstart.zone = ICAL.Timezone.utcTimezone; // BUG: Labels local time as UTC
```

**What's happening:**
1. User enters time in local time (e.g., 19:30 in UTC+1)
2. Code creates an ICAL.Time from the string "19:30"
3. Code labels this as UTC (`ICAL.Timezone.utcTimezone`)
4. The timezone dropdown value is read but **never used**
5. iCal file says "19:30 UTC"
6. Calendar app imports and converts: 19:30 UTC → 20:30 in UTC+1

**Affected locations:**
- Line 2388: `dtstart.zone = ICAL.Timezone.utcTimezone`
- Line 2409: `dtend.zone = ICAL.Timezone.utcTimezone`
- Line 2451: `exdate.zone = ICAL.Timezone.utcTimezone` (for exceptions)

### Fix Approach Decision

**Question:** Which approach for timezone handling?

**Options:**
1. Convert to UTC - Convert local time to UTC before storing
2. Use TZID + VTIMEZONE - Include timezone identifier and component

**Decision:** Option 1 - Convert to UTC
- Simpler to implement
- Universally compatible
- Uses 'Z' suffix for UTC times

**Additional requirement:** Show local time when loading stored events (convert UTC back to local)

### Implementation Plan

| Step | Description | Start | End |
|------|-------------|-------|-----|
| 1 | Create timezone offset calculation helper function | 12:05:00 | 12:08:00 |
| 2 | Fix generateICS() - convert local time to UTC for DTSTART | 12:08:00 | 12:10:00 |
| 3 | Fix generateICS() - convert local time to UTC for DTEND | 12:10:00 | 12:11:00 |
| 4 | Fix generateICS() - convert local time to UTC for EXDATE | 12:11:00 | 12:12:00 |
| 5 | Add Playwright tests for timezone handling | 12:12:00 | 12:20:00 |

**Note:** Event loading/display already uses local time strings from localStorage, so no changes needed there.

### Verification

All 6 timezone tests passed:
- Europe/Berlin winter: 19:30 local → 18:30 UTC
- America/New_York winter: 10:00 local → 15:00 UTC
- UTC: 14:00 → 14:00 (unchanged)
- Asia/Tokyo date boundary: 03:00 Jan 15 → 18:00 Jan 14 UTC
- Recurring exceptions: EXDATE correctly converted
- **DST transition: Recurring events use TZID format for correct DST handling**

### Additional Fix: DST Handling for Recurring Events

**Issue:** Initial fix used UTC for all events. For recurring events spanning DST transitions (e.g., Jan-May in Europe), the fixed UTC time would show wrong local time after DST change.

**Example problem:**
- Event at 19:30 Europe/Berlin (winter UTC+1) = 18:30 UTC
- After March 30 DST change (summer UTC+2), 18:30 UTC = 20:30 Berlin (wrong!)

**Solution:** For recurring events with non-UTC timezone, use TZID format instead of UTC:
- `DTSTART;TZID=Europe/Berlin:20250109T193000` (not `DTSTART:20250109T183000Z`)
- Calendar app handles DST transitions correctly

**Implementation:**
- Added `useTZID` flag for recurring + non-UTC + non-all-day events
- DTSTART, DTEND, and EXDATE now use TZID format for these events

**Planning session end:** 2026-01-06 12:35:00
**Total planning time:** ~35 minutes