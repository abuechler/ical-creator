# Holiday Indicators

## Description
Display holiday markers on the calendar preview to help users avoid scheduling events on holidays. Shows major holidays for the selected timezone region.

## User Value
- **Awareness**: See at a glance which days are holidays
- **Better Planning**: Avoid accidentally scheduling events on holidays
- **Context**: Understand the calendar context when planning recurring events

## Implementation Details
- Show small holiday indicators on calendar days
- Support major holidays (New Year, Christmas, Easter, etc.)
- Visual indicator (small dot or icon) on holiday dates
- Tooltip or hover effect to show holiday name
- Consider timezone/locale for regional holidays

## Planning Decisions

### Start Timestamp
2026-01-09 04:20:00

### Implementation Plan
1. Create a holiday data source with major international holidays
2. Add CSS styling for holiday indicators on calendar days
3. Update calendar rendering to mark holidays
4. Add tooltip functionality to show holiday names
5. Write Playwright tests

### Assumptions
- Focus on major international holidays (New Year's Day, Christmas, etc.)
- Use a simple static holiday list (no external API dependency)
- Holidays are displayed as a small indicator dot below the date number
- Hover/focus shows holiday name in tooltip
- Holiday calculations work for any year (Easter computed algorithmically)
- Different color (red) for holidays vs event days (teal)

### End Timestamp
2026-01-09 04:35:00

### Duration
15 minutes

## Screenshots

### Desktop (1440x900)
![Holiday Indicators - Desktop](screenshots/holiday-indicators-desktop.png)

### Mobile (375x812)
![Holiday Indicators - Mobile](screenshots/holiday-indicators-mobile.png)

---

## Future Enhancement: Swiss Cantonal/Municipal Holidays

Research notes for potentially supporting regional Swiss holidays (Feiertage) per canton or municipality.

### Official Data Sources

#### BFS REST API (Amtliches Gemeindeverzeichnis)
The Swiss Federal Statistical Office provides a REST API for municipality data:

**Base URL:** `https://www.agvchapp.bfs.admin.ch/api/communes/`

**Endpoints:**

| Endpoint | Description | Example |
|----------|-------------|---------|
| `/snapshot` | List of municipalities on a given date | `?date=01-01-2026` |
| `/correspondances` | Municipality mappings between periods | `?startPeriod=01-01-2008&endPeriod=01-01-2026` |
| `/mutations` | Municipality changes during a period | `?startPeriod=01-01-2020&endPeriod=01-01-2026` |
| `/levels` | Spatial classifications (canton, district, etc.) | `?date=01-01-2026` |

**Snapshot Response Fields:**
- `HistoricalCode` - Historical identifier
- `BfsCode` - Official BFS municipality number
- `ValidFrom` / `ValidTo` - Validity period
- `Level` - Administrative level
- `Parent` - Parent entity (Bezirk/Canton)
- `Name` / `ShortName` - Municipality names
- `CantonId` / `Canton` - Canton information
- `DistrictId` / `District` - District (Bezirk) information

**Parameters:**
- `date` - Reference date (format: DD-MM-YYYY)
- `format` - Response format: `csv` (default) or `xlsx`
- `labelLanguages` - Language codes: `de`, `fr`, `it`, `en` (comma-separated)

**Example:**
```
https://www.agvchapp.bfs.admin.ch/api/communes/snapshot?date=01-01-2026&format=csv&labelLanguages=de,fr
```

**Documentation:** [REST API PDF](https://www.agvchapp.bfs.admin.ch/documents/rest_api_de.pdf)

#### Municipality Websites (NOT in BFS data)

The official BFS data does **not** include municipality website URLs. For website URLs, use **Wikidata**:

**SPARQL Query for Swiss Municipality Websites:**
```sparql
SELECT ?municipality ?municipalityLabel ?bfsNr ?website WHERE {
  ?municipality wdt:P31 wd:Q70208 .    # instance of Swiss municipality
  OPTIONAL { ?municipality wdt:P771 ?bfsNr }   # BFS number
  OPTIONAL { ?municipality wdt:P856 ?website } # official website
  SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en" . }
}
```

Run at: https://query.wikidata.org/

The BFS number (`P771`) can be used to join Wikidata results with official BFS data.

### Spatial Classifications Available

The BFS API provides many classification codes that could help determine regional holidays:

| Code | Description |
|------|-------------|
| `SPRGEB2020` | Language regions (Sprachgebiete) |
| `REGCH` | Major regions of Switzerland (Grossregionen) |
| `GDETYP2020_9` | Municipality typology (9 categories) |
| `STALAN2020` | Urban/rural classification |

### Implementation Considerations

1. **Canton-based holidays** - Each canton has different public holidays. The BFS `CantonId` field allows grouping municipalities by canton.

2. **Data freshness** - Municipality boundaries change over time (mergers, etc.). The API supports historical queries.

3. **No external runtime dependency** - Could pre-fetch and bundle a static list of cantons/municipalities for the iCal creator.

4. **Holiday data source** - The BFS API provides municipality structure, but holiday dates would need a separate source (e.g., [feiertagskalender.ch](https://www.feiertagskalender.ch/) or similar).

### Example: Bezirk Bülach (Kanton Zürich)

Complete list of all 22 municipalities in Bezirk Bülach with their official websites:

| BFS-Nr | Gemeinde | Website |
|--------|----------|---------|
| 51 | Bachenbülach | http://www.bachenbuelach.ch |
| 52 | Bassersdorf | https://www.bassersdorf.ch |
| 53 | Bülach | https://www.buelach.ch |
| 54 | Dietlikon | https://www.dietlikon.ch |
| 55 | Eglisau | https://www.eglisau.ch |
| 56 | Embrach | http://www.embrach.ch |
| 57 | Freienstein-Teufen | https://www.freienstein-teufen.ch/ |
| 58 | Glattfelden | https://www.glattfelden.ch |
| 59 | Hochfelden | http://www.hochfelden.ch |
| 60 | Höri | http://www.hoeri.ch |
| 61 | Hüntwangen | https://www.huentwangen.ch/ |
| 62 | Kloten | http://www.kloten.ch |
| 63 | Lufingen | https://www.lufingen.ch/ |
| 64 | Nürensdorf | http://www.nuerensdorf.ch |
| 65 | Oberembrach | http://www.oberembrach.ch |
| 66 | Opfikon | http://www.opfikon.ch |
| 67 | Rafz | https://www.rafz.ch |
| 68 | Rorbas | https://www.rorbas.ch |
| 69 | Wallisellen | http://www.wallisellen.ch |
| 70 | Wasterkingen | https://www.wasterkingen.ch |
| 71 | Wil (ZH) | http://www.wil-zh.ch |
| 72 | Winkel | http://www.winkel.ch |

**Data sources:**
- Municipality list: [BFS API](https://www.agvchapp.bfs.admin.ch/api/communes/snapshot?date=01-01-2026) (Bezirk Bülach = Parent 10081)
- Websites: [Wikidata](https://query.wikidata.org/) (Property P856, joined via BFS number P771)
