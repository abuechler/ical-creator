# Attendees/Participants Field

## Description
Add a field to list event attendees (email addresses) that will be included in the .ics file as ATTENDEE properties.

## User Value
- **Meetings**: Track who should attend
- **Calendar integration**: Attendees show in calendar apps
- **Organization**: Know event participants

## Implementation Details
- Add "Attendees" text field (comma-separated emails)
- Validate email format
- Add as ATTENDEE properties in .ics output
- Optional: Add names with email (Name <email>)
- Show attendee count badge
