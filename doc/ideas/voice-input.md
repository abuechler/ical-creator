# Voice Input

## Description
Add voice input button to dictate event details using browser's Speech Recognition API.

## User Value
- **Hands-free**: Create events by speaking
- **Speed**: Faster than typing on mobile
- **Accessibility**: Helps users with motor impairments

## Implementation Details
- Microphone button in title field
- Uses Web Speech API (Chrome, Edge, Safari)
- Transcribes speech to text
- Can combine with natural language parsing
- Visual feedback during recording
- Graceful fallback if not supported
