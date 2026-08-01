# CSV Import (D3.23)

**Status:** LOCKED

## Supported formats (deterministic parsers)

| Format key | Notes |
|------------|-------|
| `steamdb` | SteamDB export columns |
| `backloggd` | Backloggd CSV |
| `backloggery` | Backloggery export |
| `rawg` | RAWG-style export |
| `ign` | IGN lists export |
| `generic` | title + status + optional playtime |

## Wizard steps

1. Upload (multipart / base64 JSON for API)
2. Preview (first N rows + detected format)
3. Column mapping
4. Conflict review
5. Import (`integration.import` job)

Provider on resulting integration / job: `csv`.
