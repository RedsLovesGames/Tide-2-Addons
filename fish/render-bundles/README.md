# Canonical Fish Runtime Bundle

The Fish Wiki render source of truth is one binary file:

`fish/render-bundles/current-runtime-export.zip`

Generate it with the drop-in Tide Fish Runtime Exporter in the real Minecraft 1.21.1 modpack, then replace that file on `dev`.

A push that changes the ZIP triggers `.github/workflows/import-fish-runtime-bundle.yml`, which validates the runtime renderer contract and generates:

- `assets/fish-render-manifest.json`
- `fish/assets/renders/*.png`
- `fish/render-data/runtime-bundle/*.json`

The importer accepts only runtime bundles whose render contract uses Tide's `FishDisplayRenderer` with direct entity fallback disabled. Failed Fish Display renders stay unavailable.

Do not manually copy individual PNGs out of a bundle. Replace the one canonical ZIP and let the importer own publication state.
