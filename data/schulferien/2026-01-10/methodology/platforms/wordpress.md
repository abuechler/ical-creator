# WordPress Platform

## Overview

Some Swiss schools use WordPress for their websites, particularly smaller schools or those with custom designs.

## Identification

- URL structure with `/?page_id=[number]`
- `/wp-content/` in asset URLs
- `/wp-admin/` login page
- Common WordPress themes/plugins

## URL Patterns

### Page URLs
```
/?page_id=[id]
/[page-slug]/
Example: https://www.schule-eglisau.ch/?page_id=73
```

### PDF URLs
```
/wp-content/uploads/[year]/[month]/[filename].pdf
Example: /wp-content/uploads/2025/03/Ferienplan-2025-26.pdf
```

## Finding Ferienpläne

1. Use site search if available
2. Check menu for "Ferienplan" or "Downloads"
3. Look for PDF links in content areas
4. Check sidebar widgets

## Predictable URL Patterns

Once you find one Ferienplan PDF, try predicting others:
```
/wp-content/uploads/2025/03/Ferienplan-2025-26.pdf
/wp-content/uploads/2025/03/Ferienplan-2026-27.pdf  ← try this
/wp-content/uploads/2025/03/Ferienplan-2027-28.pdf  ← and this
```

## Examples

| School | URL | Notes |
|--------|-----|-------|
| Schule Eglisau | schule-eglisau.ch | Standard WordPress |

---

*Last updated: 2026-01-10*
