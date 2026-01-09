# QR Code for Event

## Description
Generate a QR code that encodes the event details, allowing users to share events by scanning the QR code with their mobile device.

## User Value
- **Easy sharing**: Share events by showing/printing QR code
- **Mobile-friendly**: Quick event import via camera scan
- **Offline sharing**: No internet needed to share

## Implementation Details
- Add "Generate QR Code" button after Download button
- Use qrcode.js library for QR code generation
- Encode event data in a shareable format (URL with event params or vCalendar format)
- Display QR code in a modal dialog
- Option to download QR code as image

## Planning Decisions

### Start Timestamp
2026-01-09 02:25:00

### Implementation Plan
1. Add qrcode.js library (CDN or bundled)
2. Create "Generate QR Code" button next to existing buttons
3. Create modal dialog to display QR code
4. Generate QR code with URL containing event parameters
5. Add download button to save QR code as PNG
6. Write Playwright tests for QR code generation and display

### Assumptions
- Use URL-encoded event data for QR code content (compatible with Share via URL feature)
- QR code will contain a link that opens the iCal Creator with pre-filled event data
- Modal will show QR code at appropriate size for scanning
- Download functionality will use canvas.toDataURL()

### End Timestamp
2026-01-09 02:35:00

### Duration
10 minutes

## Screenshots

### Desktop View (1440x900)
![QR Code Desktop](screenshots/qr-code-desktop.png)

### Mobile View (375x812)
![QR Code Mobile](screenshots/qr-code-mobile.png)
