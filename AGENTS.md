# Tide-2-Addons repository operating contract

Read this file before changing the repository. Then read `.ai/state.json`, `.ai/repo-map.json`, and `.ai/generated-files.json`.

## Branch policy

- `dev` is the integration and active development branch.
- `main` is production source and must not be mutated by a workflow triggered from `dev`.
- Development previews may be uploaded as workflow artifacts, but must not be copied into `main/dev/` or committed to `main`.
- New automation should target `dev` and pull requests into `main`. Do not reference historical branches unless they actually exist.

## Source-of-truth hierarchy

1. Packaged Tideborne behavior/resources for the documented release.
2. Pinned upstream source/archive metadata in `tools/fish-render-source/source-manifest.json`.
3. Tide 2 / compatibility FishData recovered from those pinned sources for documentation and provenance.
4. A complete running-modpack runtime export from the Tide Fish Runtime Exporter for published fish renders.
5. Generated Fish Wiki registries, payloads, render manifest, and PNGs derived from those canonical inputs.

Never invent fish, entity IDs, model geometry, textures, variants, provenance, or compatibility support. Missing information stays missing and must be reported explicitly.

## Generated-file rule

Check `.ai/generated-files.json` before editing large JSON, gzip, report, registry, or render files. If a file is generated, change its producer or canonical input and regenerate it rather than hand-editing the output.

## Fish render contract

Published Fish Wiki images have one canonical path:

`running modpack -> TideData.FISH -> real ItemStack state -> FishDisplayBlockEntity -> FishDisplayRenderer -> runtime export ZIP -> scripts/import-fish-runtime-bundle.py -> site manifest/PNGs`

- The canonical bundle path is `fish/render-bundles/current-runtime-export.zip`.
- The importer must reject bundles that enable direct entity fallback or do not identify `com.li64.tide.client.FishDisplayRenderer` as the renderer.
- Direct `EntityRenderDispatcher` rendering is not a publication fallback. Runtime Fish Display failures remain unavailable until the canonical path is fixed.
- Never substitute item sprites, reconstructed geometry, AI art, guessed models, or stale renders for failures.
- Runtime provenance and failure reports live under `fish/render-data/runtime-bundle/` after import.
- The drop-in exporter discovers fish from the actual running `TideData.FISH`; it must not depend on the Wiki registry to decide what exists.

## Specimen scale contract

The Specimen Lab viewport is species-relative while preserving physical block scale:

- `maxSpecimenCm = envelope(record).giantHigh`
- `viewportBlocks = max(1, ceil(maxSpecimenCm / 100))`
- one Minecraft block is 100 cm
- current specimen width is calculated from its current length using that species viewport
- viewport block count never changes when percentile/body/condition controls change for the same species

This prevents tiny fish from becoming invisible while keeping giant species physically proportional inside their own whole-block viewport.

## Validation contract

Fast validation should work from the repository root:

```bash
python3 scripts/validate-fish-wiki.py
python3 scripts/validate-fish-render-manifest.py
node --check assets/app.js
node --check assets/fish-runtime.js
node --check assets/fish-wiki.js
node --check assets/fish-specimen-lab.js
node --check scripts/qa-fish-wiki.mjs
node --check scripts/qa-fish-runtime-architecture.mjs
```

Browser QA is implemented by `scripts/qa-fish-wiki.mjs` and `scripts/qa-fish-runtime-architecture.mjs`. Runtime exporter validation lives under `tools/fish-render-export/TideFishRenderExporter/` and GitHub Actions.

## Change discipline

- Make the smallest coherent change that fixes the underlying contract.
- Keep authoritative input, generator/importer, validator, runtime consumer, and docs aligned when their schema changes.
- Do not add another `-v2`, `-v3`, `-stable`, `-fix`, or patch-layer production file when an existing canonical owner can be changed.
- Do not claim a workflow, render, build, or import succeeded without current evidence.
- Prefer machine-readable JSON state and reports over large prose continuation prompts.
- Do not restore the removed legacy registry/direct-render publication engine or per-mod Hybrid Aquatic render workflows without current regression evidence that cannot be fixed in the canonical runtime Fish Display path.

## AI continuation

A new AI session should normally need only:

> Read `AGENTS.md` and `.ai/state.json`, inspect the current `dev` head and failing checks, then continue the highest-priority unfinished task without re-auditing unrelated parts of the repository.

Update `.ai/state.json` when architecture, branch policy, upstream versions, render scope, or known blockers materially change.
