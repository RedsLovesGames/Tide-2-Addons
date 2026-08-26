# Tideborne Fish Wiki Agent Instructions

## Project architecture

- This repository is the Tideborne/Tide documentation site.
- The Fish Wiki is an integrated subsection at `/fish/`, not a separate site or application.
- Production hosting remains GitHub Pages at `https://redslovesgames.github.io/Tide-2-Addons/`.
- Fish Wiki production is `https://redslovesgames.github.io/Tide-2-Addons/fish/`.
- Vercel may be used only for temporary preview or QA. Never migrate production hosting away from GitHub Pages.

## Authority order

Use the narrowest authoritative source for the question being answered.

1. **Latest authoritative Tideborne JAR**
   - Mechanics, FishScore, Body Type, Condition, specimen systems, Satchel behavior, records, badges, commands, config, integrations, migrations, and current Tideborne assets.
2. **Tide / Tide Extra Compatibility FishData**
   - Species, rarity, size models, journal grouping, strength, speed, habitat, conditions, entity IDs, DisplayData, and compatibility fish entries.
3. **Current Fish Wiki working branch**
   - Current implementation, generated site assets, validation code, and development state.
4. **`main`**
   - Production source.
5. **Live GitHub Pages**
   - Deployed behavior and visual regression baseline.

If sources disagree, investigate and record the discrepancy. Do not silently choose the easiest source.

## Current development branch

Use `fish-wiki-production` unless `.agent/STATUS.md` explicitly records a later authoritative Fish Wiki branch. Do not develop directly on `main`.

Normal flow:

`main` -> `fish-wiki-production` -> bounded milestone -> validate -> commit -> update status -> next milestone -> full production gate -> merge to `main`

Do not create a new branch for every AI session.

## Critical render rules

- Never generate fake fish art.
- Never substitute an unrelated entity render.
- Never use an item texture as a fake entity preview.
- Use actual packaged models, textures, render information, DisplayData, and the Minecraft/Tide renderer where applicable.
- A representative packaged variant must be labeled representative.
- If an exact render cannot be established, show an explicit unavailable state instead of a wrong render.
- Programmatic atlas validation does not prove visual/model authenticity. Source comparison and in-game visual QA remain separate gates.

## Session start

Before editing:

1. Read this file.
2. Read `.agent/STATUS.md`.
3. Read `.agent/TODO.md`, `.agent/SOURCES.md`, and `.agent/VALIDATION.md` as needed.
4. Inspect the current branch and recent commits.
5. Continue the first unfinished applicable task.
6. Do not redo completed work unless validation shows it is wrong or an authoritative input changed.

## Development rules

- Reuse existing tooling before adding new tooling.
- Keep unrelated changes out.
- Prefer coherent milestone commits with scopes such as `fish-data:`, `renders:`, `atlas:`, `fish-ui:`, `search:`, `docs:`, `validation:`, or `workflow:`.
- Do not rewrite or squash unrelated history.
- Validate before committing.
- Do not claim work is complete unless the relevant validation passed.
- Do not merge to `main` unless the production validation gate in `.agent/VALIDATION.md` passes.

## Expensive-work cache rules

Do not rerun expensive work just because a new session started.

### FishData extraction

Rerun only when:
- the pinned Tide FishData input changes,
- Tide Extra Compatibility input changes,
- supported compatibility FishData sources change, or
- `scripts/build-fish-wiki.py` changes in a way that affects output.

### Tideborne mechanic audit

Rerun only when:
- the authoritative Tideborne JAR SHA-256 changes, or
- audit logic/scope changes.

If the current authoritative JAR SHA-256 matches the recorded audited SHA-256, reuse the cached audit.

### Fish renders

Rerun only when:
- model source changes,
- texture source changes,
- DisplayData changes,
- renderer transforms change,
- supported mod JARs change,
- Tideborne condition/body rendering changes, or
- the render pipeline changes.

### Atlas

Rerun only when:
- a constituent render changes,
- packing logic changes, or
- atlas metadata format changes.

### Search index

Rerun only when:
- fish metadata changes,
- indexed site pages change, or
- indexing logic changes.

Machine-readable source state is recorded in `.agent/source-state.json`.

## Generated versus hand-written files

See `.agent/README.md` for ownership. Do not manually edit generated FishData, generated search output, generated source inventory, or future generated atlas/audit outputs. Regenerate them with the documented command/workflow instead.

## Session completion rule

Before ending a development session:

1. Run relevant validation.
2. Commit coherent completed work when appropriate.
3. Push `fish-wiki-production` when permitted.
4. Update `.agent/STATUS.md`.
5. Update `.agent/TODO.md` when task states changed.
6. Record new known issues.
7. Record missing authoritative sources or blockers.
8. Identify the exact next actionable task.
9. Never mark something complete if it was not validated.
