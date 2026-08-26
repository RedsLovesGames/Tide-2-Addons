# Tideborne Fish Wiki Development Status

Last updated: 2026-08-26
Current branch: `fish-wiki-production`
Current commit: use `git rev-parse HEAD`; this status snapshot was prepared from branch head `e7f7654b1fa377bdd2403befc85bba3fe0409c6b`
Production main SHA: `610c5538be10c45822c0444faaa5697687e9d561`
Current Tideborne version: `1.3.57` is the active repository documentation/runtime target, but the authoritative JAR itself is not committed in this repository
Current authoritative JAR SHA-256: **unknown / not recorded**

## Current milestone

**Authentic cross-mod fish render runtime export and atlas integration.**

The static Fish Wiki, FishData payload, search/deep-link behavior, deterministic validation, browser QA, and renderer scaffold exist. The production blocker is authentic in-game rendering for the complete supported mod set, followed by atlas integration and visual/source validation.

## Completed

- Fish Wiki is integrated at `/fish/` in the same static GitHub Pages repository.
- Authoritative FishData generation exists in `scripts/build-fish-wiki.py`.
- Current generated FishData contains **342 visible fish across 37 namespaces**.
- FishData inputs are pinned to Tide 2 commit `876b95f31328f4e698d5150f7d840ab033d1b06d` and Tide Extra Compatibility 2.2.0 Modrinth version `Uz6Vlhjs`.
- Generated source inventory exists in `scripts/fish-source-inventory.txt`.
- Deterministic FishData, atlas-coordinate, image-decode, search-index, and source-backed render-manifest validation exists.
- Browser QA covers 342-fish loading, filters, search/autocomplete, deep links, GitHub Pages base paths, Tuna condition previews, site search, current 1.3.57 docs, recipes, item textures, 360/390/tablet responsive behavior, and theme persistence.
- At branch head `e7f7654b...`, both **Validate Fish Wiki** and **QA Fish Wiki Browser** GitHub Actions completed successfully.
- `tools/TideFishRenderExporter/` provides a Fabric 1.21.1 authentic-render exporter scaffold using Tide's actual Fish Display renderer.
- A small source-backed Tuna condition render manifest exists. Albino and Perfect Specimen remain explicitly unavailable rather than being represented by invalid substitutes.

## In progress

- Runtime execution of the authentic Fish Display exporter.
- Regeneration of the cross-mod render registry against the complete compatibility mod JAR set.
- Source-backed atlas creation/integration after successful runtime export.

## Known issues

- Root historical documentation was built around older 1.3.28 content and is updated at runtime by `assets/latest-1357.js`; future cleanup may consolidate this after an authoritative 1.3.57 JAR audit is cached.
- There is no current source-backed Fish Wiki atlas because current FishData preview statuses are `no_entity`, `source_missing`, `unreconstructed`, or `vanilla_model`.
- Programmatic validation cannot certify model authenticity or correct fish orientation. In-game/source visual QA is still required.

## Blocked / missing sources

- The authoritative Tideborne 1.3.57 JAR file is not present in the repository/current task inputs, so no SHA-256-backed Tideborne audit cache can be created yet.
- The complete external compatibility mod JAR set needed for authoritative cross-mod render export is not committed here.
- Authentic render export requires a graphical Fabric 1.21.1 client/render thread with Tide 2.1.1 and the target compatibility mods installed.

## Next tasks

1. Supply/locate the exact authoritative Tideborne 1.3.57 JAR, record SHA-256, and create the first cached JAR audit under `docs/generated/audits/`.
2. Run the render-source extractor against the complete supported mods folder and compare the resulting registry with the 342 FishData entries.
3. Build/run `TideFishRenderExporter` in Minecraft, export source-backed PNGs, visually verify orientation/model/texture/variants, then integrate atlas metadata.
4. Run the full production validation gate before considering a merge to `main`.

## Do not redo

Unless the tracked inputs changed or validation fails, do not repeat:

- Tide 2.1.1 + Tide Extra Compatibility 2.2.0 FishData extraction for the current 342-record dataset.
- FishData/source inventory counting and namespace/category/rarity summaries.
- Existing deterministic Fish Wiki payload validation.
- Existing browser QA coverage for the current static implementation.
- Reconstruction of the Fabric render-exporter scaffold itself. Continue from the runtime gate instead.

## Validation status

At pre-workflow branch head `e7f7654b1fa377bdd2403befc85bba3fe0409c6b`:

- Validate Fish Wiki: **PASS**
- QA Fish Wiki Browser: **PASS**
- Authentic cross-mod render visual/source gate: **NOT RUN / BLOCKED**
- Production merge gate: **NOT PASSED**

See `.agent/VALIDATION.md`.

## Last known preview / production state

- Development branch: `fish-wiki-production`, 17 commits ahead of `main` before this workflow optimization.
- Production source: `main` at `610c5538be10c45822c0444faaa5697687e9d561`.
- Production URL remains `https://redslovesgames.github.io/Tide-2-Addons/`.
- Fish Wiki production URL remains `https://redslovesgames.github.io/Tide-2-Addons/fish/`.
- Do not merge the development branch solely because deterministic CI passes. Authentic render runtime/source validation is still the blocking milestone.
