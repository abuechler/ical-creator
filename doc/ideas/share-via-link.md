# Share Event via URL

## Description
Generate a shareable URL that contains event data encoded in the URL, allowing others to open the link and have the event pre-filled.

## User Value
- **Sharing**: Share events without file attachments
- **Collaboration**: Send meeting invites via link
- **Universal**: Works in any browser

## Implementation Details
- Add "Share Link" button after filling form
- Encode event data in URL hash or query params
- Opening link pre-fills all form fields
- User can then download .ics or modify
- Consider URL shortening for long events
- Privacy note: data visible in URL

## Planning Decisions

### Start Timestamp
2026-01-09 01:38:00

### Implementation Plan
1. Add "Share" button next to Download button
2. Encode event data as URL hash using JSON + base64
3. On page load, check for hash and decode event data
4. Pre-fill form with decoded data
5. Copy shareable URL to clipboard when Share is clicked
6. Show toast notification confirming copy
7. Write Playwright tests for share functionality

### Assumptions
- Will use URL hash (#) rather than query params to avoid server logging
- Data encoded as base64 to handle special characters
- Will show simple toast/alert for copy confirmation
- Will not implement URL shortening (keep it simple)
- Share button visible after form has title filled in

### Screenshots
- Desktop: ![Share Desktop](../screenshots/share-via-url/share-desktop.png)
- Mobile: ![Share Mobile](../screenshots/share-via-url/share-mobile.png)

### End Timestamp
2026-01-09 01:50:00

### Duration
12 minutes
