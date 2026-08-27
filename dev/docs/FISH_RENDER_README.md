# Tide dynamic render sources

The verified supported render set for the supplied mod sources contains **182 FishData entries**.

Start with `fish/render-data/registry/supported-fish-registry.json`, `fish/render-data/registry/mod-render-registry.json`, and `fish/render-data/registry/fish-source-file-index.json`.

The original staged archive containing the full raw `render_sources/` tree was truncated before that tree could be imported completely. The repository does not claim those raw model, texture, class, or geometry files are present.

For reproducible source inspection, use `tools/fish-render-source/source-manifest.json`, `download_sources.py`, and `extract_fish_render_sources.py`. The CI workflow downloads the owning mod sources, verifies pinned SHA-256 hashes where available, filters Tide Extra Compatibility FishData to the supplied owning mods, and packages the generated source inventory as a temporary artifact.

Java `.class` model geometry cannot execute in a webpage directly. Geo JSON can be normalized directly; Java ModelPart geometry must be reproduced faithfully from the real source renderer/model information. Preserve render layers, emissive textures, NBT variants, and Tide `display_data`.

The full Tide Extra Compatibility catalog contains entries for mods not present in this exact source set. Those entries are not considered supported render entries and must not receive fabricated previews.
