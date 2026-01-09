# Copy Event as Text

## Description
Add a "Copy" button that copies event details as formatted text to clipboard, useful for sharing via chat/email.

## User Value
- **Sharing**: Quickly share event details without .ics file
- **Communication**: Paste into Slack, email, SMS
- **Flexibility**: Works anywhere text is accepted

## Implementation Details
- Add "Copy" button in saved events or after form fill
- Format example:
  ```
  Team Meeting
  Date: Mon, Jan 15, 2024
  Time: 2:00 PM - 3:00 PM (Europe/Zurich)
  Location: Conference Room A
  ```
- Show "Copied!" toast notification
- Use Clipboard API
