# Multiple Reminders

## Description
Allow users to set multiple reminders for a single event (e.g., 1 day before AND 1 hour before).

## User Value
- **Flexibility**: Different warning intervals
- **Important events**: Multiple nudges for critical meetings
- **Preference**: Users have different reminder needs

## Implementation Details
- Change single reminder dropdown to "Add Reminder" button
- Allow up to 3 reminders per event
- Each reminder has its own time selection
- Show list of added reminders with remove button
- Store as array in event data
