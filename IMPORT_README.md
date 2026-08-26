# Tideborne Fish Wiki render-source import

This directory tree is designed to be extracted into the root of:

`RedsLovesGames/Tide-2-Addons`

It adds the raw, authoritative model/texture/variant/render data needed for the next
phase of the Fish Wiki renderer without replacing the existing Fish Wiki page.

## Important

At this stage, import the files and make them reachable from GitHub Pages, but do not
pretend the browser can directly execute Minecraft Java entity renderer `.class` files.

The next implementation phase will normalize the raw render sources into a browser
renderer. GeckoLib/JSON geometry can be consumed directly or converted. Java model
classes must be converted/reproduced faithfully from the retained model/render classes
and bytecode information.

Do not generate fake fish art and do not replace missing 3D geometry with item sprites.

## Intended public paths

- `/Tide-2-Addons/fish/render-data/manifest.json`
- `/Tide-2-Addons/fish/render-data/registry/supported-fish-registry.json`
- `/Tide-2-Addons/fish/render-data/registry/mod-render-registry.json`
- `/Tide-2-Addons/fish/render-data/registry/fish-source-file-index.json`
- `/Tide-2-Addons/fish/render-data/render_sources/...`

Development helpers live under:

- `/tools/fish-render-source/`

The existing `/fish/index.html` should remain the Fish Wiki entry point.
