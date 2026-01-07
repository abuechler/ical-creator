# Initial Loaded Event Data

Create a new branch for this. If there are no local save events, create the following two events for demo purposes.

If the implementation is done, create a PR for the changes and check the automatic Copilot review on the PR. Iterate as
long as needed, be skeptical about the review comments of Copilot is not that smart yet, but still have look at them.

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

```
BEGIN:VCALENDAR
PRODID:-//iCal Creator//ical-creator.html//EN
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:ical-creator-1767764384730-rjbo4m9tb@ical-creator
SEQUENCE:5
DTSTAMP:20260107T061500Z
SUMMARY:Am 30. Tag jeden Monat - Senioren Treff
DTSTART;TZID=Europe/Zurich:20260130T090000
DTEND;TZID=Europe/Zurich:20260130T110000
LOCATION:Restaurant Lokal\, Embrach
DESCRIPTION:Wir treffen uns immer am letzten Freitag im Monat.\n\nGemütlic
 hes beisammen sein und quatschen ist das Hauptmotto\, von Zeit zu Zeit spie
 len wir auch folgende Spiele:\n\n- Schach\n- Ligretto\n- Hau den Lukas\n- V
 ergiss mein nicht\n\nEs wird definitiv nicht langweilig 😜
URL:https://www.restaurantlokal.ch
RRULE:FREQ=MONTHLY;COUNT=12;BYMONTHDAY=30
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Reminder: Senioren Treff
TRIGGER:-PT60M
END:VALARM
END:VEVENT
END:VCALENDAR
```

## Planning Decisions

### Planning Session 1
**Start Time:** 2026-01-07 10:15:00
**End Time:** 2026-01-07 10:22:00
**Duration:** ~7 minutes

#### Questions & Decisions

**Q1: Should both demo events be loaded as separate entries?**
- Decision: **Both as separate events** with different UIDs (the shared UID in the story was a copy-paste error)

**Q2: Should there be a way to manually reload demo events?**
- Decision: **No reset button needed** - demos only load once on first visit if localStorage is empty

#### Implementation Plan

1. **Create feature branch** (`feature/demo-events`)
2. **Add demo events function** in `ical-creator.html`:
   - Create `getDemoEvents()` function returning two demo event objects in internal format
   - Create `loadDemoEventsIfEmpty()` function that checks if saved events are empty and loads demos
3. **Modify `init()` function** to call `loadDemoEventsIfEmpty()` before `renderSavedEvents()`
4. **Convert iCal events to internal format**:
   - Event 1: "Letzter Freitag im Monat - Senioren Kaffee" (monthly, last Friday, 12 occurrences)
   - Event 2: "Am 30. Tag jeden Monat - Senioren Treff" (monthly, 30th day, 12 occurrences)
5. **Write Playwright tests** for demo loading functionality
6. **Run all tests** to ensure nothing is broken
7. **Create PR** and address Copilot review comments

### Implementation Log

| Step | Start Time | End Time | Notes |
|------|-----------|----------|-------|
| 1. Create feature branch | 10:22:00 | 10:22:00 | `feature/demo-events` |
| 2. Add demo events functions | 10:22:00 | 10:25:00 | `getDemoEvents()`, `loadDemoEventsIfEmpty()` |
| 3. Modify init() | 10:25:00 | 10:26:00 | Added call before `renderSavedEvents()` |
| 4. Write Playwright tests | 10:26:00 | 10:35:00 | 6 tests for demo functionality |
| 5. Update version | 10:35:00 | 10:36:00 | `1.0.0` → `1.1.0` |
| 6. Run all tests | 10:36:00 | 10:38:00 | 33 tests passed |
| 7. Create PR | 10:38:00 | - | In progress |

