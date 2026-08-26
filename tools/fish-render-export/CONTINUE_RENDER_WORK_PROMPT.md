# Tide Fish Render Work: continuation execution prompt

Work directly on `RedsLovesGames/Tide-2-Addons`, branch `fish-render-source-import`. Do not modify `main` until the render pipeline and visual QA are complete.

## Goal
Finish a deterministic pipeline that produces transparent PNG renders for every fish in `fish/render-data/registry/supported-fish-registry.json` using the actual Minecraft entity renderer, actual entity models/textures, Tide 2.1.1 Fish Display behavior, and Tide Extra Compatibility data. Never invent fish, approximate geometry, substitute item sprites, or generate fake fish art.

## Efficient tool order
1. Use the connected GitHub integration first for branch state, files, upstream Tide source, Actions runs/logs, commits, and artifacts.
2. Treat GitHub Actions as the compiler/test loop. Read the exact failure, make the smallest source/toolchain fix, commit to `fish-render-source-import`, then inspect the next run.
3. Inspect `Lightning-64/Tide-2` source at the version matching Tide 2.1.1 whenever a Tide API signature is uncertain. Prefer public Tide APIs over reflection.
4. Use web or Exa research only when the relevant API/dependency cannot be resolved from the checked-in code, compiler output, or upstream repositories.
5. Use browser/UI verification only after exported PNGs are integrated into the Fish Wiki.

## Rendering contract
- Registry scope must remain exactly the supported fish set generated from the supplied source mods, currently 182 IDs, unless source inputs intentionally change.
- Set fish length through Tide's real `TideItemData.FISH_LENGTH` API.
- Feed the actual fish `ItemStack` to `FishDisplayBlockEntity#setDisplayStack`.
- Use Tide's `DisplayData` and delegate to the registered Minecraft entity renderer through `FishDisplayRenderer` / `EntityRenderDispatcher`.
- Preserve compatibility variants that Tide applies, including Hybrid Aquatic behavior when that mod is installed.
- Render to transparent offscreen framebuffers at high resolution, crop from alpha bounds with padding, preserve pixel edges, and use deterministic filenames.
- Failed entity/model/texture renders must be recorded as failures. Never fall back to fabricated or approximate art.
- Keep source/archive hashes pinned where practical and keep registry ID contract validation in CI.

## Execution loop
Continue from the latest branch commit. Inspect the most recent `Build Tide Fish Render Exporter` workflow. Fix all configuration, dependency, mapping, and Java compile errors until the exporter JAR builds and uploads successfully. Then strengthen CI to validate the packaged registry and command classes. After compile success, prepare the runtime modpack/export procedure for all required source mods, run or validate the exporter as far as the available environment permits, and package the resulting exporter JAR/source/registry artifacts. When real PNGs exist, integrate them under the Fish Wiki asset path and QA framing, orientation, transparency, and missing-render reports before any merge to `main`.

Make progress without asking for confirmation on routine fixes. Do not claim a render or build succeeded unless the corresponding CI/runtime evidence is green.