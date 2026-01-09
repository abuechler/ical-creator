# Download History

## Description
Track and display recently downloaded .ics files with option to re-download.

## User Value
- **Convenience**: Re-download without recreating event
- **Recovery**: Find previously downloaded files
- **Tracking**: See what events were exported

## Implementation Details
- Store last 5-10 downloads in localStorage
- Show "Recent Downloads" section (collapsible)
- Each entry shows: event title, date downloaded
- Click to re-download same .ics file
- Auto-cleanup downloads older than 30 days
