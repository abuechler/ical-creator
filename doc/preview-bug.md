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
SUMMARY:Senioren Kaffee
DTSTART;TZID=Europe/Zurich:20260130T090000
DTEND;TZID=Europe/Zurich:20260130T110000
LOCATION:Restaurant Lokal\, Embrach
DESCRIPTION:Gemütliches Beisammen sein
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

<your content goes here>