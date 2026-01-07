# UI Issues to fix

This document describes some UI issues that should be addressed.

- The "Preview" button has no real function since a calendar preview is always shown. Remove it.
- The "Download .ics" button should not be active until any validation errors are fixed. Give a hint that this is the
  case.
- The spacing between the "Download .ics" button and the "Add Event" and the Saved Events list is too small. Consider
  make it consistent with other vertical spacing.

Lets go through these list one by one before starting to implement them. Lets clarify them first, offer choices if
needed and offer suggestions. Summarize the the prompts and decisions in the section below.

## Planning Decisions

1. **Preview button**: Remove it entirely (it's redundant since preview shows automatically when "Is Recurring" is checked)

2. **Download button validation**: Disable button when validation errors exist + show hint text below (e.g., "Fix errors above to download")

3. **Spacing**: Match standard card spacing (16px gap) between the Download button area and Saved Events section