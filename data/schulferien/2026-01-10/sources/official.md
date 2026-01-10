# Official Swiss School Holiday Sources

## EDK/IDES (Schweizerische Konferenz der kantonalen Erziehungsdirektoren)

The authoritative source for Swiss cantonal school holidays.

### Retrieved Files

| File | Retrieved | Size |
|------|-----------|------|
| [`edk-schulferien-2026.pdf`](../data/official/edk-schulferien-2026.pdf) | 2026-01-10 23:21:55 CET | 779 KB |

### Source URLs

- **Direct PDF:** https://edudoc.ch/record/235166/files/Schulferien_2026.pdf
- **Overview Page:** https://www.edk.ch/de/bildungssystem/kantonale-schulorganisation/Schulferien/
- **Archive (from 1987):** https://edudoc.ch/search?cc=idesferienliste&ln=de&c=idesferienliste

### Notes

- Official cantonal data for all 26 cantons
- Identifies which cantons have standardized vs. per-municipality dates
- 6 cantons require per-Gemeinde data: AG, AI, AR, BE, SG, ZH

---

## TCS (Touring Club Schweiz)

Consumer-friendly summary of school holidays.

### Retrieved Files

| File | Retrieved | Size |
|------|-----------|------|
| [`tcs-schulferien-2026.pdf`](../data/official/tcs-schulferien-2026.pdf) | 2026-01-10 23:21:55 CET | 142 KB |

### Source URLs

- **Direct PDF:** https://www.tcs.ch/mam/Corporate-Communication/PDF/Info-Sheet/schulferien-2026.pdf
- **Overview Page:** https://www.tcs.ch/de/camping-reisen/reiseinformationen/wissenswertes/reisetipps/schulferien-feiertage-schweiz.php

### Notes

- Same data as EDK, formatted for travelers
- Easier to read tabular format
- Updated annually

---

## BFS API (Bundesamt für Statistik)

Official Swiss municipality data API.

### Endpoints Used

- **Commune Snapshot:** https://www.agvchapp.bfs.admin.ch/api/communes/snapshot?date=01-01-2026
- **API Documentation:** https://www.agvchapp.bfs.admin.ch/documents/rest_api_de.pdf

### Purpose

- Get official BFS numbers for all municipalities
- Identify parent Bezirk for each Gemeinde
- Verify municipality names and structure

---

## Wikidata SPARQL

Used to retrieve official municipality website URLs.

### Endpoint

- **Query Service:** https://query.wikidata.org/

### Example Query

```sparql
SELECT ?municipality ?municipalityLabel ?bfsNr ?website WHERE {
  ?municipality wdt:P31 wd:Q70208;      # instance of municipality of Switzerland
                wdt:P131 wd:Q11933;      # located in Kanton Zürich
                wdt:P771 ?bfsNr.         # BFS number
  OPTIONAL { ?municipality wdt:P856 ?website. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "de". }
}
```

---

*Last updated: 2026-01-10*
