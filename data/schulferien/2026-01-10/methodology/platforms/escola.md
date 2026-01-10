# Escola Platform

## Overview

Escola is the most common school website platform in Kanton Zürich. It's a Swiss CMS specifically designed for schools.

**Vendor:** Escola GmbH
**Website:** https://www.escola.ch

## Identification

- Footer usually shows "© Escola GmbH" or Escola logo
- Login button labeled "Anmelden" with Escola branding
- URL patterns include `/p-[number]/` for pages

## URL Patterns

### Page URLs
```
/[section]/[subsection]/p-[page_id]/
Example: /organisation/ferienplan/p-186536/
```

### Download URLs
```
/download.php?action=download&doc_id=[hash]&download_type=3
Example: /download.php?action=download&doc_id=XREosqjbCNJVkhclOoh1gE1sH4UIU2r2dUFGaqKwjIhM1FMg&download_type=3
```

### Asset URLs
```
/public/upload/assets/[asset_id]/[filename].pdf?fp=[version]
Example: /public/upload/assets/2823/Ferienplan%20PSBB%202025_2028.pdf?fp=2
```

## Finding Ferienpläne

### Common Navigation Paths
1. Organisation → Ferienplan
2. Informationen → Ferienplan
3. Aktuelles → Ferienplan
4. Schule → Download Formulare

### Document Tables
- Escola displays documents in tables with columns: Name, Type, Size, Date
- Download icon in last column
- Click icon to download PDF

### Agenda/Calendar View
- Some schools show holidays in calendar view only
- Check for "Ferienkalender" checkbox filters
- May offer XLS export (often requires login)

## Restricted Content

Some Escola sites restrict downloads to logged-in users:
- "Downloads" section may require authentication
- Check "Top 10 Downloads" which are often public
- Try direct navigation to `/organisation/ferienplan/`

## Dynamic Content

Escola uses JavaScript for:
- Calendar/agenda displays
- Document filtering
- Some navigation menus

Use browser automation (Playwright) to access dynamic content.

## Examples

| School | URL | Notes |
|--------|-----|-------|
| Schule Höri | schulehoeri.ch | Informationen → Ferienplan |
| Schule Bassersdorf | schule-bassersdorf.ch | Organisation → Ferienplan |
| Schule Nürensdorf | schule-nuerensdorf.ch | Calendar only, no PDF |
| Schule RFT | schule-rft.ch | Schulorganisation → Download |

---

*Last updated: 2026-01-10*
