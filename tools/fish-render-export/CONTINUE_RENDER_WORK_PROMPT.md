# Tide Fish Render Work: continuation execution prompt

Work directly on `RedsLovesGames/Tide-2-Addons`, branch `fish-render-source-import`. Do not modify `main` until the render pipeline and visual QA are complete.

## Goal
Finish a deterministic pipeline that produces transparent PNG renders using the actual Minecraft entity renderer, actual entity models/textures, Tide 2.1.1 Fish Display behavior, and Tide Extra Compatibility data. Never invent fish, approximate geometry, substitute item sprites, or generate fake fish art.

For the current phase, use `fish/render-data/modpack-scope.json` as the temporary active scope. Only spend render and Fish Wiki work on FishData whose fish namespace belongs to that uploaded modpack scope, plus vanilla Minecraft fish. Keep the full authoritative registry intact for later. Ignore Tideborne visual mutation/condition variants for now and render only the normal/default fish appearance.

## Efficient tool order
1. Use the connected GitHub integration first for branch state, files, upstream Tide source, Actions runs/logs, commits, and artifacts.
2. Treat GitHub Actions as the compiler/test loop. Read the exact failure, make the smallest source/toolchain fix, commit to `fish-render-source-import`, then inspect the next run.
3. Inspect `Lightning-64/Tide-2` source at the version matching Tide 2.1.1 whenever a Tide API signature is uncertain. Prefer public Tide APIs over reflection.
4. Use web or Exa research only when the relevant API/dependency cannot be resolved from the checked-in code, compiler output, or upstream repositories.
5. Use browser/UI verification after exported PNGs are integrated into the Fish Wiki or when validating the temporary modpack scope.

## Rendering contract
- The authoritative supported registry remains the complete generated set, currently 182 IDs. Do not delete out-of-scope entries merely because the temporary modpack filter hides them.
- The active render and Fish Wiki scope is `fish/render-data/modpack-scope.json`.
- Render only the default/normal appearance for now. Do not spend time exporting Albino, Iridescent, Scarred, Parasite-Ridden, Perfect Specimen, Dwarf, Giant, or other visual combinations in this phase.
- Set fish length through Tide's real `TideItemData.FISH_LENGTH` API.
- Feed the actual fish `ItemStack` to `FishDisplayBlockEntity#setDisplayStack`.
- Use Tide's `DisplayData` and delegate to the registered Minecraft entity renderer through `FishDisplayRenderer` / `EntityRenderDispatcher`.
- Preserve source-mod renderer behavior needed for the normal fish appearance, including Hybrid Aquatic's normal model/texture selection when that mod is installed.
- Render to transparent offscreen framebuffers at high resolution, crop from alpha bounds with padding, preserve pixel edges, and use deterministic filenames.
- Failed entity/model/texture renders must be recorded as failures. Never fall back to fabricated or approximate art.
- Keep source/archive hashes pinned where practical and keep registry ID contract validation in CI.

## Execution loop
Continue from the latest branch commit. Do not spend time on fish-source mods that are outside the temporary modpack scope. Prioritize installed FishData namespaces from the uploaded modlist, especially Tide and Hybrid Aquatic, plus any other installed supported fish namespaces discovered in the current catalog. Keep the exporter build green, run the default/base render path, collect real PNGs, and integrate those outputs under the Fish Wiki asset path. QA framing, orientation, transparency, scoped catalog visibility, search/navigation behavior, and missing-render reports before any merge to `main`.

Make progress without asking for confirmation on routine fixes. Do not claim a render or build succeeded unless the corresponding CI/runtime evidence is green.
