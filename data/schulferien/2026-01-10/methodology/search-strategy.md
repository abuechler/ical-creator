# Swiss School Holiday Search Strategy

## Overview

This document describes the methodology for finding Schulferien (school holiday) data for Swiss municipalities.

## Language Considerations

Swiss municipalities have a primary language. Use appropriate search terms:

| Language | Region | Search Terms |
|----------|--------|--------------|
| **German** | ZH, SH, AR, AI, SG, AG, GL, GR, TG, SZ, ZG, NW, OW, UR, LU, SO, BL, BS | Ferienplan, Ferien, Schulferien, Schule |
| **French** | GE, VD, NE, JU | Calendrier des vacances, Vacances scolaires, École |
| **Italian** | TI | Calendario delle vacanze, Vacanze scolastiche, Scuola |
| **Mixed DE/FR** | BE, FR, VS | Check municipality language first |

## Search Strategy

### Step 1: Check Gemeinde Website First

Sometimes the Ferienplan is directly on the municipality website.

1. Go to `www.[gemeindename].ch` or `www.gemeinde-[name].ch`
2. Search for "Ferien" or "Ferienplan"
3. Check sections: Bildung, Schule, Publikationen, Downloads

### Step 2: Find School Website

If not on Gemeinde website:

1. On Gemeinde website, search for "Schule"
2. Look in "Bildung" or "Schulen" section
3. Find link to school website (usually `www.schule-[name].ch`)

### Step 3: Search School Website

On the school website:

1. Search for "Ferien" or "Ferienplan"
2. Check common locations:
   - Organisation → Ferienplan
   - Aktuelles → Ferienplan
   - Informationen → Ferienplan
   - Downloads / Dokumente
3. Look for PDF download links

## Common URL Patterns

### School Website Domains

```
www.schule-[gemeinde].ch
www.[gemeinde]-schule.ch
www.schule.[gemeinde].ch
www.ps-[gemeinde].ch        (Primarschule)
www.sek[gemeinde].ch        (Sekundarschule)
```

### Ferienplan Page Patterns

```
/ferienplan
/organisation/ferienplan
/aktuelles/ferienplan
/informationen/ferienplan.html
/downloads
/schule/download-formulare
```

### PDF URL Patterns

```
/download.php?action=download&doc_id=[hash]&download_type=3    (Escola)
/public/upload/assets/[id]/[filename].pdf                       (Escola)
/wp-content/uploads/[year]/[month]/[filename].pdf               (WordPress)
/fileadmin/user_upload/[path]/[filename].pdf                    (TYPO3)
/_doc/[id]                                                       (Custom CMS)
```

## Handling Special Cases

### Shared School Districts (Schulgemeinden)

Some municipalities share a school district:
- Check if municipality name includes multiple places (e.g., "RFT" = Rorbas, Freienstein-Teufen)
- Same Ferienplan applies to all member municipalities
- Document the relationship in source files

### No PDF Available

If no PDF found:
1. Check if data is displayed on webpage (often Escola platforms)
2. Extract and document the dates manually
3. Note "Webpage Only" status
4. Check for XLS export or calendar subscription options

### Restricted Access

If Ferienplan requires login:
1. Document the page URL
2. Note "Restricted Access" status
3. Consider contacting school administration
4. Check if Gemeinde website has alternative source

## Platform-Specific Notes

See `platforms/` directory for details on:
- [Escola](platforms/escola.md) - Most common in Kanton Zürich
- [WordPress](platforms/wordpress.md) - Some smaller schools
- [TYPO3](platforms/typo3.md) - Some larger municipalities

## Tips

1. **Use browser search**: Press Ctrl+F and search "Ferien" on any page
2. **Check "Downloads" sections**: Often Ferienpläne are with other documents
3. **Look for "Top Downloads"**: Popular documents often include Ferienplan
4. **Try multiple years**: If current year unavailable, older versions may exist
5. **Check Sekundarschule separately**: May have different schedule than Primarschule

---

*Last updated: 2026-01-10*
