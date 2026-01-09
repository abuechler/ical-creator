# QR Code for Event

## Description
Generate a QR code that others can scan to open the event in their calendar or view event details.

## User Value
- **Sharing**: Share events in person (meetings, posters)
- **Mobile-friendly**: Easy scan with phone
- **Professional**: Great for printed materials

## Implementation Details
- Generate QR after form is filled
- QR contains: webcal link OR share URL (if implemented)
- Show in modal or collapsible section
- Download QR as PNG
- Size options: small, medium, large
- Use qrcode.js library (client-side)
