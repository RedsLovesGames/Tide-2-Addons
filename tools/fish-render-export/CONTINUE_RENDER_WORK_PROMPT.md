# Tide Fish Render Work: continuation prompt

Work directly on `RedsLovesGames/Tide-2-Addons`, branch `dev`.

Before changing anything, read:

1. `AGENTS.md`
2. `.ai/state.json`
3. `.ai/repo-map.json`
4. `.ai/generated-files.json`
5. the current failed/recent GitHub Actions runs for `dev`

Do not re-audit unrelated parts of the repository unless current evidence requires it.

## Goal

Maintain a deterministic pipeline that produces transparent PNG renders using the actual Minecraft entity renderer, actual entity models/textures, Tide 2.1.1 Fish Display behavior, Tide Extra Compatibility data, and explicit source-mod runtime profiles. Never invent fish, approximate geometry, substitute item sprites, or generate fake fish art.

## Branch and workflow contract

- `dev` is the integration branch. `main` is production.
- A `dev` workflow must never push preview snapshots to `main`.
- Active workflows must not reference deleted historical branches.
- CI must compile checked-in Java/Gradle source. Do not use `sed` or temporary source rewrites to change renderer code before compilation.
- Hybrid Aquatic runtime differences are selected through explicit Gradle properties/profile inputs.

## Rendering contract

- The authoritative supported registry remains the complete generated set, currently 182 IDs.
- The active render and Fish Wiki scope is `fish/render-data/modpack-scope.json`.
- Render default/normal appearances unless the task explicitly concerns validated Tideborne Condition variants.
- Set fish length through Tide's real `TideItemData.FISH_LENGTH` API.
- Feed the actual fish `ItemStack` to `FishDisplayBlockEntity#setDisplayStack` when using Tide Fish Display rendering.
- Preserve Tide `DisplayData` and source-mod renderer behavior.
- Direct entity rendering uses the committed side-profile contract in `RenderService`: matrix Y rotation 90 degrees and dispatcher yaw 0 degrees.
- Hybrid Aquatic 1.5.5 is the baseline renderer runtime. Later fish may use the explicit 1.6.9 Gradle profile plus the narrowly documented Argonaut-only dev-remap compatibility patch.
- Failed entity/model/texture renders must be recorded as failures. Never fall back to fabricated or approximate art.
- Keep source/archive hashes pinned where practical and keep registry ID contract validation in CI.

## Execution loop

Inspect the current Actions failure first, make the smallest source/configuration fix, and let the relevant workflow provide evidence. Keep `scripts/validate-fish-render-manifest.py`, the manifest producer, and the Fish Wiki consumer aligned whenever render status/path semantics change.

Do not claim a render or build succeeded unless the corresponding current CI/runtime evidence is green.
