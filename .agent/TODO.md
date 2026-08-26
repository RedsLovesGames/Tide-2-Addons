# Tideborne Fish Wiki TODO

Statuses: **TODO**, **IN PROGRESS**, **BLOCKED**, **DONE**.

## Milestone A: Authoritative FishData and static wiki

- **DONE** Build FishData from pinned Tide 2.1.1 and Tide Extra Compatibility 2.2.0 inputs.
- **DONE** Produce 342 visible namespace-aware fish records and search index.
- **DONE** Integrate `/fish/` into the existing static GitHub Pages site.
- **DONE** Validate unique IDs, FishData ranges, search index consistency, and GitHub Pages-safe loading.
- **DONE** Browser QA for filters, autocomplete, deep links, responsive layouts, theme persistence, and site search.

## Milestone B: Provenance and authentic rendering

- **DONE** Establish no-fake-render policy and explicit unavailable states.
- **DONE** Create/validate the current source-backed Tuna condition manifest.
- **DONE** Build the Fabric `TideFishRenderExporter` scaffold around Tide's real Fish Display renderer.
- **BLOCKED** Record SHA-256 for the authoritative Tideborne 1.3.57 JAR. The JAR is not present.
- **BLOCKED** Regenerate the render registry against the complete external mod JAR set. Full mod set is not present.
- **IN PROGRESS** Execute authentic runtime render export in a graphical Fabric 1.21.1 client.
- **TODO** Visually validate representative output from every rendered source mod for side orientation, model, texture, transparency, glow/translucency, centering, clipping, and legitimate packaged variants.
- **TODO** Integrate validated renders into FishData preview provenance and atlas metadata.
- **TODO** Re-run deterministic atlas/provenance validation after integration.

## Milestone C: Tideborne audit cache

- **TODO** Audit the exact authoritative Tideborne 1.3.57 JAR once supplied.
- **TODO** Cache version, filename, SHA-256, audit date, FishScore, Body Type, Condition, size behavior, Satchel behavior, commands, meaningful config, integrations, migrations, and useful class/source paths under `docs/generated/audits/`.
- **TODO** Update `.agent/source-state.json` with the audited JAR hash.
- **TODO** Reconcile any remaining historical 1.3.28 base documentation with the cached 1.3.57 audit.

## Milestone D: Production validation and release

- **TODO** Run `npm run validate`.
- **TODO** Run browser QA with Playwright.
- **TODO** Complete manual/source authenticity review for all claimed exact/representative renders.
- **TODO** Verify existing wiki regression set.
- **TODO** Verify hosted GitHub Pages behavior after an approved merge.
- **BLOCKED** Merge `fish-wiki-production` to `main` until the complete production gate passes.
