# `.agent/` development state

This directory is the persistent handoff layer for future ChatGPT/Codex sessions.

Read in this order:

1. `../AGENTS.md`
2. `STATUS.md`
3. `TODO.md`
4. `SOURCES.md`
5. `VALIDATION.md`

`CONTINUE_PROMPT.md` is the short reusable prompt for a new session. `source-state.json` records authoritative input identities and repository artifact hashes so expensive work is not repeated when inputs are unchanged.

## File ownership

| Path | Ownership | How to update |
| --- | --- | --- |
| `assets/fish-wiki-data-0.json.gz` | GENERATED | `scripts/build-fish-wiki.py` / Build Fish Wiki Data workflow |
| `assets/fish-wiki-data-1.json.gz` | GENERATED | same |
| `assets/fish-search-index.json` | GENERATED | same |
| `scripts/fish-build-report.txt` | GENERATED | same |
| `scripts/fish-source-inventory.txt` | GENERATED | Audit Fish Wiki Sources workflow |
| `assets/fish-wiki-atlas-*.webp` | GENERATED when present | authentic render export + atlas packing pipeline |
| `docs/generated/audits/tideborne-*.json` | GENERATED when present | Tideborne JAR audit tooling |
| `docs/generated/audits/tideborne-*.md` | GENERATED when present | Tideborne JAR audit tooling |
| `assets/fish-render-manifest.json` | provenance manifest | update only from established source-backed render evidence |
| `.agent/*.md` | hand-written state | update during development sessions |
| `.agent/source-state.json` | machine-readable handoff state | update when authoritative inputs or tracked generated artifacts change |

JSON files cannot carry comments, so generation ownership is documented here instead of inside the JSON payload.

## Invalidation summary

- FishData: upstream FishData or builder changes.
- Tideborne audit: authoritative JAR SHA-256 or audit logic changes.
- Renders: model/texture/DisplayData/renderer/mod inputs or render pipeline changes.
- Atlas: constituent renders, packing logic, or metadata schema changes.
- Search: fish metadata, indexed pages, or indexer changes.

Do not rebuild an expensive artifact merely because its timestamp is old. Check `source-state.json` and the relevant validator first.
