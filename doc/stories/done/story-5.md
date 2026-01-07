# iCal Update Support via UID and SEQUENCE

When a user edits a saved event and re-downloads the iCal file, importing it into a calendar application should **update** the existing event rather than creating a duplicate.

## Current Behavior

- Each download generates a new random UID
- No SEQUENCE property is included
- Result: Every import creates a new event, even for the same saved event

## Desired Behavior

- Saved events should retain the same UID across downloads
- Include SEQUENCE property (starts at 0, increments on modifications)
- Calendar applications will recognize updates and modify existing entries

## Acceptance Criteria

1. A saved event has a persistent UID stored with it
2. Re-downloading the same event uses the same UID
3. SEQUENCE property is included in generated iCal files
4. SEQUENCE increments when event details are modified
5. Tests verify UID persistence and SEQUENCE behavior

## Technical Reference (RFC 5545)

- **UID**: Unique identifier for an event, must remain constant for updates
- **SEQUENCE**: Integer starting at 0, incremented for each significant revision
  - Reference: https://www.rfc-editor.org/rfc/rfc5545#section-3.8.7.4
- **DTSTAMP**: Timestamp of iCal object creation (already implemented)

## Planning Decisions

**Planning Session Start:** 2026-01-06 12:45:00

### Requirements Analysis

1. **Persistent UID**: Saved events need a UID stored with them
2. **UID reuse**: When downloading a saved event, use its stored UID
3. **SEQUENCE property**: Track modification count
4. **SEQUENCE increment**: Detect when event has been modified

### Research: Current Event Storage

**Findings:**
- Events stored in localStorage under `icalCreator_savedEvents` key
- `state.currentEventId` tracks which event is being edited (already implemented)
- Events have an `id` property generated via `generateUID()` (format: `ical-creator-{timestamp}-{random}@ical-creator`)
- The `id` format is already iCal UID compliant
- `createEventDataForSave()` reuses `state.currentEventId` when editing

**Key insight:** The event `id` can serve as the iCal UID. Just need to:
1. Use stored `id` in `generateICS()` instead of generating new UID
2. Add `sequence` property to event data
3. Increment sequence when event is modified and re-saved

### Implementation Plan

| Step | Description | Start | End |
|------|-------------|-------|-----|
| 1 | Add `sequence` to event data structure | 12:50:00 | 12:52:00 |
| 2 | Modify `generateICS()` to use stored UID from current event | 12:52:00 | 12:55:00 |
| 3 | Add SEQUENCE property to generated iCal | 12:52:00 | 12:55:00 |
| 4 | Increment sequence on event re-save | 12:50:00 | 12:52:00 |
| 5 | Add tests for UID persistence and SEQUENCE | 12:55:00 | 13:05:00 |

### Implementation Summary

**Files Modified:**
- `ical-creator.html`:
  - Added `sequence` property to event data in `createEventDataForSave()`
  - Modified `generateAndDownloadICS()` to set `state.currentEventId` before generating ICS
  - Modified `generateICS()` to use stored UID and calculate SEQUENCE

**Tests Added:**
- Generated iCal should include UID property
- Generated iCal should include SEQUENCE property
- Saved event should retain same UID on re-download
- SEQUENCE should increment when event is re-saved
- New event should start with SEQUENCE 0

**Planning Session End:** 2026-01-06 13:05:00
**Total Time:** ~20 minutes
