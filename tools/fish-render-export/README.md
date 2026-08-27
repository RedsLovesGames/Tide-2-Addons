# Fish render exporter

This directory contains the source-backed Minecraft render path for the Fish Wiki. It deliberately does not reconstruct foreign fish models in JavaScript and never substitutes invented artwork.

The implementation lives in `TideFishRenderExporter/` as a client-only Fabric helper for Minecraft 1.21.1.

## Why rendering runs inside Minecraft

Authentic Fish Wiki previews can depend on real entity model classes, textures, render layers, GeckoLib state, Tide `FishData`, Tide `DisplayData`, ItemStack components, and source-mod renderer behavior. A browser cannot execute that Minecraft Java rendering stack faithfully.

The exporter therefore renders through one of two explicit source-authentic strategies:

1. **Tide Fish Display path**: construct the real fish `ItemStack`, apply Tide length/components, call `FishDisplayBlockEntity#setDisplayStack`, and render through `FishDisplayRenderer`.
2. **Direct entity path**: instantiate the registered entity in a live client world and render through Minecraft's `EntityRenderDispatcher` when a source-mod renderer requires that route.

Failures remain failures. No item-sprite, fake geometry, generated art, or guessed model fallback is permitted.

## Output

Runtime output is staged under the client run directory as:

```text
fishrender-output/
├── fish/assets/renders/<namespace>__<fish>.png
└── generated/
    ├── auto-export-status.json
    ├── render-report.json
    └── missing-renders.json
```

Validated published PNGs are committed under repository path `fish/assets/renders/`. Publication metadata is recorded in `assets/fish-render-manifest.json` using repository-relative paths.

## Orientation contract

The current validated direct-entity side profile is committed in `RenderService`:

- complete model/matrix Y rotation: 90 degrees
- `EntityRenderDispatcher` yaw: 0 degrees
- orthographic transparent framebuffer
- alpha-bound crop with safe transparent padding

Workflows must not rewrite Java source to change this orientation before compilation.

## Hybrid Aquatic runtime profiles

The Gradle build has explicit profile inputs:

- `hybridAquaticVersion`
- `hybridAquaticModrinthVersion`
- `hybridAquaticJar`
- `hybridAquaticNamespaceMode` (`hyphenated` or `canonical`)

The default profile is Hybrid Aquatic 1.5.5 using its Modrinth artifact and the `hybrid-aquatic` runtime entity namespace. Late species can be validated with the explicit 1.6.9 profile and the narrowly scoped Argonaut-only dev-remap compatibility patch. The patch must not modify fish classes, models, textures, renderers, or resources.

## Validation

From the repository root:

```bash
python3 scripts/validate-fish-render-manifest.py
```

For the exporter project:

```bash
cd tools/fish-render-export/TideFishRenderExporter
gradle --no-daemon check
```

GitHub Actions provide the authoritative runtime evidence for headless Minecraft rendering. See `.ai/repo-map.json` for the current workflow paths.
