# Calendar App Deep Links

## Description
In addition to .ics download, offer direct "Add to Google Calendar" and "Add to Outlook" buttons that open the respective web calendars.

## User Value
- **One-click**: Skip download/import flow
- **Convenience**: Goes straight to calendar
- **Choice**: Pick preferred calendar app

## Implementation Details
- "Add to Google Calendar" button using their URL API
- "Add to Outlook.com" button using their URL API
- "Add to Yahoo Calendar" option
- Generate URL with event parameters encoded
- Opens in new tab
- Still keep .ics download as primary
- Show as dropdown or button group
