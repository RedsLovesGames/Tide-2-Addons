# Tideborne Fish Wiki render-source metadata

The Fish Wiki now includes a verified render-source metadata layer for the exact supplied mod set without replacing the existing Fish Wiki page.

## Current public data

These files are safe to publish through GitHub Pages:

- `/Tide-2-Addons/fish/render-data/manifest.json`
- `/Tide-2-Addons/fish/render-data/registry/supported-fish-registry.json`
- `/Tide-2-Addons/fish/render-data/registry/mod-render-registry.json`
- `/Tide-2-Addons/fish/render-data/registry/fish-source-file-index.json`

The verified supported set contains 182 FishData entries whose owning render mods were supplied. Tide Extra Compatibility entries for absent owning mods are deliberately excluded from the supported render set.

## Raw source policy

The original staged archive containing the full raw `render_sources/` tree was truncated during transfer. The repository therefore does not claim those raw model and texture files are committed.

Instead, `tools/fish-render-source/` contains a reproducible downloader and extractor. The source manifest pins known source URLs and SHA-256 hashes where available. CI can fetch the third-party archives, verify them, inventory the real model, texture, geometry, animation, and renderer inputs, and package the results as a temporary workflow artifact without committing third-party JARs.

The conservative public per-fish source index intentionally leaves unrecovered candidate-path arrays empty rather than inventing paths.

## Render rule

Browsers cannot directly execute Minecraft Java entity renderer bytecode. Authentic PNG generation still requires either faithful normalization of the real source geometry/material/layer data or the in-game Minecraft render exporter. Do not generate fake fish art and do not replace missing 3D geometry with item sprites.

The existing `/fish/index.html` remains the Fish Wiki entry point.
