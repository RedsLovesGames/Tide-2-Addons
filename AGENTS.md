# Tide-2-Addons repository operating contract

Read this file before changing the repository. Then read `.ai/state.json`, `.ai/repo-map.json`, and `.ai/generated-files.json`.

## Branch policy

- `dev` is the integration and active development branch.
- `main` is production source and must not be mutated by a workflow triggered from `dev`.
- Development previews may be uploaded as workflow artifacts, but must not be copied into `main/dev/` or committed to `main`.
- New automation should target `dev` and pull requests into `main`. Do not reference historical branches unless they actually exist.

## Source-of-truth hierarchy

1. Packaged Tideborne behavior and resources for the documented release.
2. Pinned upstream source/archive metadata in `tools/fish-render-source/source-manifest.json`.
3. Tide 2 FishData and Tide Extra Compatibility FishData recovered from those pinned sources.
4. Generated registries and Fish Wiki payloads derived from those sources.
5. Published runtime renders only when backed by actual Minecraft/Tide entity rendering evidence.

Never invent fish, entity IDs, model geometry, textures, variants, provenance, or compatibility support. Missing information stays missing and should be reported explicitly.

## Generated-file rule

Check `.ai/generated-files.json` before editing large JSON, gzip, report, registry, or render files. If a file is generated, change its producer or canonical input and regenerate it rather than hand-editing the output, except for an emergency repair that is documented and immediately followed by producer alignment.

## Fish render contract

- Prefer Tide `FishDisplayRenderer` / `FishDisplayBlockEntity` when the FishData display path is valid.
- Use the real Minecraft `EntityRenderDispatcher` for direct source-authentic entity renders when required.
- Preserve actual source-mod renderer behavior, variants, transparency, emissive layers, NBT/components, and Tide `DisplayData` where applicable.
- Failed renders are failures. Never substitute item sprites, fabricated geometry, AI art, or guessed models.
- Renderer workflow configuration must be explicit. CI should not silently rewrite checked-in Java or Gradle source before compiling.

## Validation contract

Fast validation should work from the repository root:

```bash
python3 scripts/validate-fish-wiki.py
python3 scripts/validate-fish-render-manifest.py
node --check assets/app.js
node --check assets/fish-wiki.js
node --check assets/fish-detail-nav.js
node --check assets/fish-catalog-redesign.js
node --check assets/fish-specimen-lab-stable.js
```

Browser QA is implemented by `scripts/qa-fish-wiki.mjs`. Minecraft renderer validation lives under `tools/fish-render-export/TideFishRenderExporter/` and GitHub Actions.

## Change discipline

- Make the smallest coherent change that fixes the underlying contract.
- Keep authoritative input, generator, validator, runtime consumer, and docs aligned in the same change when their schema changes.
- Do not add another `-v2`, `-v3`, `-stable`, `-fix`, or patch-layer file when existing production behavior can be consolidated into its canonical owner.
- Do not claim a workflow, render, or build succeeded without current evidence.
- Prefer machine-readable JSON state and reports over large prose continuation prompts.

## AI continuation

A new AI session should normally need only:

> Read `AGENTS.md` and `.ai/state.json`, inspect the current `dev` head and failing checks, then continue the highest-priority unfinished task without re-auditing unrelated parts of the repository.

Update `.ai/state.json` when architecture, branch policy, upstream versions, render scope, or known blockers materially change.
