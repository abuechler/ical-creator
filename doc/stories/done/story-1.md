# iCal Creator Website

Create a simple static webiste to create iCal files. The website should have the following features:

- A form to input event details (title, date, time, location, description).
- Generate re-occurring events (daily, weekly, monthly).
- For recurring events, allow the user to specify the end date or number of occurrences.
- For recurring events, allow the user to specify exceptions (dates when the event does not occur).
  - Generate a preview of the events and let the user select exceptions from the preview.
- A button to generate and download the iCal file.
- There must be no build step for the website, it should be a single HTML file with embedded CSS and JS. No React, Vue, or other frameworks that require a build step.

## Planning

Let's plan this and create a plan under Suggested Implementation Steps. For all the points below, offer choices and considerations. Feel free to ask clarifying questions if needed, but always offer choices.

- What are suitable JS libraries for generating iCal files?
- Suggest a simple and clean UI design for the form.
- How to handle date and time inputs effectively?
- How to implement recurring events and exceptions in the iCal format? Does the iCal format support this natively?

## Planning Decisions

### 1. iCal File Generation

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| No library (hand-craft) | Write iCal format manually | No dependencies, full control | More code to write |
| **ical.js via CDN** ✓ | Use Mozilla's ical.js library | Comprehensive, well-maintained | External dependency |
| ics.js via CDN | Use simpler ics library | Easy API | External dependency |

**Choice: ical.js via CDN**

### 2. UI Layout

| Option | Description |
|--------|-------------|
| **Single-column form** ✓ | Clean vertical flow, mobile-first design. All fields stacked in one column. |
| Two-column layout | Basic event info on left, recurrence options on right. Better use of desktop space. |
| Stepper/wizard | Step-by-step flow: Basic Info → Recurrence → Preview/Exceptions → Download. |

**Choice: Single-column form**

### 3. Date/Time Inputs

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Native HTML5 inputs** ✓ | Browser's built-in date/time pickers | No dependencies, good support | Styling varies by browser |
| Flatpickr via CDN | Lightweight date picker library | Consistent styling | Adds ~10KB dependency |

**Choice: Native HTML5 inputs**

### 4. Recurring Event Preview (for selecting exceptions)

| Option | Description |
|--------|-------------|
| Simple list view | Vertical list of upcoming dates with checkboxes to exclude. Easy to implement and scan. |
| **Calendar grid view** ✓ | Mini calendar showing event dates highlighted. Click dates to toggle exclusion. More visual. |
| Both options | List view as default with toggle to switch to calendar view. |

**Choice: Calendar grid view**

### 5. Styling Approach

| Option | Description |
|--------|-------------|
| Minimal modern | Clean white/gray theme, subtle shadows, system fonts. |
| **Colorful accent** ✓ | White base with a vibrant accent color for buttons and highlights. |
| Dark mode | Dark background with light text. |

**Choice: Colorful accent**

### 6. Accent Color

| Option | Description |
|--------|-------------|
| Blue | Classic, professional feel. |
| **Teal/Cyan** ✓ | Fresh, modern. Stands out while remaining professional. |
| Purple | Creative, distinctive. |
| Green | Calm, approachable. |

**Choice: Teal/Cyan**

---

## Suggested Implementation Steps

### Step 1: HTML Structure
- Create single HTML file with embedded CSS and JS
- Set up basic page layout with header and main content area
- Add form container with single-column layout

### Step 2: Form Fields - Basic Event Info
- Title input (text, required)
- All-day event checkbox (when checked, hide time inputs)
- Start date input (native HTML5 date picker, required)
- Start time input (native HTML5 time picker, required unless all-day)
- End date input (optional, for multi-day events)
- End time input (optional, hidden if all-day)
- Timezone selector (dropdown, default to browser's local timezone)
- Location input (text, optional)
- Description textarea (optional)
- URL input (text, optional - for meeting links)

### Step 3: Form Fields - Recurrence Options
- Recurrence toggle (checkbox to enable/disable)
- Frequency selector (daily, weekly, monthly)
- Interval input (every N days/weeks/months)
- **Weekly day selection** (shown when frequency=weekly):
  - Checkboxes for each day: Mon, Tue, Wed, Thu, Fri, Sat, Sun
  - At least one day must be selected
  - Maps to BYDAY in RRULE
- **Monthly recurrence type** (shown when frequency=monthly):
  - Radio: "Same date each month" (e.g., 15th) - uses BYMONTHDAY
  - Radio: "Same weekday each month" (e.g., 2nd Tuesday) - uses BYDAY with position
- End condition radio buttons (default to "Until specific date"):
  - Until specific date (recommended, prominently displayed)
  - After N occurrences
  - Never (de-emphasized, show warning that most events should have an end)

### Step 3b: Reminders/Alarms
- Enable reminder checkbox
- Reminder time selector:
  - Preset options: 5 min, 15 min, 30 min, 1 hour, 1 day before
  - Maps to VALARM component in iCal

### Step 4: Calendar Grid Preview
- Build calendar grid component showing month view
- Highlight dates where event occurs based on recurrence rules
- Allow clicking dates to toggle them as exceptions (excluded dates)
- Show navigation to move between months
- Display count of selected exceptions
- **Lazy loading/pagination for unbounded events**:
  - Initially show 3 months of occurrences
  - "Load more" button or infinite scroll to load additional months
  - Prevents UI overflow for events without end date
  - Show total occurrence count (or "∞" if unbounded)

### Step 5: Styling (Teal/Cyan Accent)
- White background base
- Teal/Cyan (#00BCD4 or similar) for:
  - Primary buttons
  - Active/selected states
  - Form focus outlines
  - Calendar event highlights
- Gray tones for borders and secondary text
- Subtle shadows for depth
- System font stack for performance

### Step 5b: Accessibility (a11y)
- Semantic HTML elements (form, fieldset, legend, label)
- ARIA labels for interactive elements (calendar grid, toggles)
- Keyboard navigation:
  - Tab through form fields
  - Arrow keys to navigate calendar grid
  - Enter/Space to toggle exceptions
- Focus indicators (visible focus rings)
- Color contrast compliance (WCAG AA minimum)
- Screen reader announcements for dynamic content changes

### Step 6: iCal Generation with ical.js
- Load ical.js from CDN
- On form submit, create VCALENDAR component with:
  - VERSION: 2.0
  - PRODID: identifier for this tool
- Add VEVENT with:
  - UID: unique identifier (generated UUID)
  - SUMMARY (title)
  - DTSTART/DTEND:
    - For all-day: DATE format (no time component)
    - For timed: DATE-TIME with TZID
  - LOCATION
  - DESCRIPTION
  - URL (if provided)
  - RRULE (if recurring):
    - FREQ (DAILY/WEEKLY/MONTHLY)
    - INTERVAL
    - BYDAY (for weekly/monthly weekday)
    - BYMONTHDAY (for monthly date)
    - COUNT or UNTIL
  - EXDATE (for each exception date)
  - VALARM (if reminder enabled):
    - ACTION: DISPLAY
    - TRIGGER: -PT{time}
    - DESCRIPTION: reminder text
- Include VTIMEZONE component for selected timezone
- Generate .ics file content

### Step 7: File Download
- Create Blob from iCal string
- Generate download link
- Trigger download with appropriate filename (event-title.ics)

### Step 8: Form Validation & Polish
- Required field validation
- Date logic validation (end after start)
- Error message display
- Loading states
- Responsive design tweaks

### Step 9: Built-in iCal Validation
- After generating iCal content, re-parse it using ical.js
- Display validation status (success/error) before download
- Show detailed error messages if parsing fails
- Only enable download button if validation passes

## Testing Decisions

### iCal File Validation

| Option | Type | Description |
|--------|------|-------------|
| Playwright + Online Validator | Automated | Use Playwright to paste into kewisch validator |
| **Built-in Validation** ✓ | Automated | Validate button re-parses output with ical.js, shows errors inline |
| Calendar App Import | Manual | Test by importing into Google/Apple/Outlook Calendar |
| Node.js Test Suite | Automated | Separate test script for CI testing |
| Raw Content Preview | Manual | Show raw .ics text in preview panel |

**Choice: Built-in Validation** - Re-parse generated content with ical.js, display validation status and errors inline before allowing download.

### Additional Features (Added During Review)

| Feature | Status | Notes |
|---------|--------|-------|
| **All-day events** | ✓ Added | Checkbox to disable time inputs, uses DATE format in iCal |
| **Timezone handling** | ✓ Added | Dropdown selector, defaults to browser timezone, includes VTIMEZONE |
| **Weekly day selection** | ✓ Added | Multi-select for Mon-Sun when frequency=weekly, maps to BYDAY |
| **Monthly recurrence type** | ✓ Added | Radio choice: same date vs same weekday |
| **Preview lazy loading** | ✓ Added | Initially 3 months, "load more" for unbounded events |
| **Accessibility (a11y)** | ✓ Added | ARIA labels, keyboard nav, focus indicators, WCAG AA contrast |
| **Reminders/Alarms** | ✓ Added | VALARM with preset time options |
| **Event URL field** | ✓ Added | Optional field for meeting links |
| **End date emphasis** | ✓ Added | "Until date" as default, warning for "never" option |

### Considered But Not Implemented

| Suggestion | Decision | Rationale |
|------------|----------|-----------|
| **24-hour time format** | Keep native HTML5 | Native `<input type="time">` displays based on browser/OS locale settings. Alternatives (custom dropdowns, text input with mask) would add complexity. Keeping HTML5 standard respects user's system preferences. |