# Fish render export prototype

This directory defines the source-backed render-export path for the Fish Wiki. It deliberately does not reconstruct foreign fish models in JavaScript and never substitutes invented artwork.

## Why the exporter belongs inside a Minecraft client

Tideborne 1.3.57 already has the client rendering path needed to produce authoritative specimen visuals. Audit of the packaged 1.3.57 JAR confirms these hooks:

- `com.redslovesgames.tidetraits.entity.SpecimenEntity#tideTraits$setSpecimenTag`
- `com.redslovesgames.tidetraits.client.render.MutationRendering#textureFor`
- `MutationRendering#textureForForeignFish`
- `MutationRendering#applyLengthScale`
- `MutationTextureCache`, which generates Albino, Perfect Specimen, Iridescent, scar and parasite treatments from the real source texture

The specimen tag uses the current Tideborne keys including `TideTraits`, `Version`, `Mutation`, `BodyType`, `MutationSeed`, `SizePercentile`, `LengthCm`, `SourceStack`, and `DisplayPreview`. The current Condition values stored through the legacy `Mutation` key are `normal`, `scarred`, `parasite_ridden`, `albino`, `iridescent`, and `perfect_specimen`. Body Type is stored separately through `BodyType`.

## Export loop

A small client-only Fabric helper should run in the same 1.21.1 instance as Tide 2.1.1, Tideborne 1.3.57, Tide Extra Compatibility 2.2.0, and the source mods being rendered.

For each visible FishData record:

1. Resolve its real entity ID from FishData.
2. Verify the entity type is registered in the running client. If not, emit `source_mod_missing` and do not render a substitute.
3. Instantiate the real entity in a controlled client level or renderer test scene.
4. Attach a deterministic Tideborne specimen tag through `SpecimenEntity`.
5. Render through Minecraft's normal `EntityRenderDispatcher` with a fixed side-on camera, fixed light and no name tag or shadow.
6. Let Tideborne's normal renderer mixins call `MutationRendering` so the real model and real base texture receive the selected Condition treatment.
7. Render to an RGBA framebuffer with a transparent clear color.
8. Read the framebuffer, crop alpha bounds with consistent padding, and save PNG.
9. Repeat only the Condition variants requested by the manifest. Dwarf/Giant stay a separate Body Type axis and must not be faked by swapping textures.
10. Write provenance and failure status to `assets/fish-render-manifest.json`.

Recommended fixed orientation: entity yaw 90 degrees relative to the camera, pitch 0, with automatic distance fitted to the rendered bounding box. The validator must reject frames dominated by top/bottom views during manual QA.

## Output contract

```text
assets/fish-renders/<namespace>/<species>/normal.png
assets/fish-renders/<namespace>/<species>/scarred.png
assets/fish-renders/<namespace>/<species>/parasite_ridden.png
assets/fish-renders/<namespace>/<species>/albino.png
assets/fish-renders/<namespace>/<species>/iridescent.png
assets/fish-renders/<namespace>/<species>/perfect_specimen.png
```

Each manifest variant records:

- fish ID
- real entity ID
- source mod
- Condition
- PNG path or explicit failure reason
- renderer status
- provenance

## Current prototype state

The website now consumes `assets/fish-render-manifest.json`. Existing source-backed Tuna documentation renders are registered for Normal, Scarred, Parasite-Ridden, Albino and Iridescent. Perfect Specimen is deliberately unavailable because no validated source-backed PNG is packaged yet.

The full in-game batch exporter still requires a runnable Minecraft client helper project with the complete source-mod set. This repository is a static documentation site, so no fake web-side renderer is added here.

Run `python scripts/validate-fish-render-manifest.py` to validate every PNG currently claimed by the manifest.
