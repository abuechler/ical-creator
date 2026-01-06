# Timezone Bug

There is an issue with the timezone handling. The effect is the following:

- A user in timezone UTC+1 creates an event for 19:30 local time.
- When the same user imports the iCal file afterwards the event is at 20:30 in the calendar application.

Assumption: The iCal times are in UTC, but the local timezone offset is not considered when generating the iCal file.

Task: Check the assumption and fix the timezone handling when generating the iCal file.

## Planning Decisions

<your content goes here>