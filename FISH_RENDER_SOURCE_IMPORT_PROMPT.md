# Task: import the Fish Wiki render-source bundle into the existing GitHub Pages site

Repository: `RedsLovesGames/Tide-2-Addons`

You are given `tide_fish_wiki_github_pages_source_bundle.zip`.

Execute the task. Do not just describe it.

1. Inspect the current repository before changing anything.
2. Extract the ZIP at the repository root so its repo-relative paths are preserved.
3. Keep the existing Fish Wiki at `fish/index.html`. Do not create a separate deployment.
4. Do not redesign the Fish Wiki yet. This task is only to import, organize, validate,
   and expose the authoritative render-source data needed by the next 3D-rendering phase.
5. Preserve all existing documentation and unrelated assets.
6. The imported public data should live under `fish/render-data/`.
7. Development/reverse-engineering helpers should live under `tools/fish-render-source/`.
8. Confirm these GitHub Pages URLs resolve after deployment:
   - `fish/render-data/manifest.json`
   - `fish/render-data/registry/supported-fish-registry.json`
   - `fish/render-data/registry/mod-render-registry.json`
   - `fish/render-data/registry/fish-source-file-index.json`
9. Add only the smallest safe integration needed to the current Fish Wiki so it can
   load `fish/render-data/manifest.json` and report the source bundle as available.
   Do not implement fake 3D rendering yet.
10. Do not use flat item sprites as substitutes for missing 3D renders.
11. Do not delete the current preview/render infrastructure unless it is clearly obsolete
    and you have verified nothing else depends on it.
12. Validate paths under the real GitHub Pages base:
    `https://redslovesgames.github.io/Tide-2-Addons/`
13. The site must continue to work both at the GitHub Pages project path and when served
    locally from the repository root. Avoid root-absolute `/fish/...` URLs when a relative
    URL is safer.
14. Inspect `IMPORT_README.md`, `docs/FISH_RENDER_README.md`,
    `docs/FISH_RENDER_WEB_RENDER_NEXT_PHASE.md`, and `fish/render-data/manifest.json`.
15. Commit the imported files and any minimal loader integration to the existing repository.

Important architectural rule:

The bundle contains raw authoritative Minecraft render sources. Some mods use JSON/GeckoLib
geometry, while others use Java `ModelPart`/renderer classes. Browsers cannot directly run
Minecraft Java renderer bytecode. Do not invent geometry to work around that. Keep all
raw sources intact so the next phase can faithfully normalize them into a browser renderer.

Before finishing, report:
- files/directories added
- number of supported fish in the registry
- whether all four public JSON URLs load
- whether the existing Fish Wiki still works
- any GitHub Pages path or size problems encountered
