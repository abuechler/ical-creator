# Meeting Link Detection

## Description
Automatically detect and highlight video meeting links (Zoom, Meet, Teams) in the URL field with smart formatting.

## User Value
- **Recognition**: Instantly see it's a video call
- **Validation**: Confirm link is valid format
- **UX**: Platform icon shown next to link

## Implementation Details
- Detect patterns: zoom.us, meet.google.com, teams.microsoft.com
- Show platform icon/badge when detected
- "Join Meeting" styled differently than regular URL
- Validate meeting ID format if possible
- Quick copy button for meeting link
- Works in URL field and description
