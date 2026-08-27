# Tide Fish Runtime Exporter

This is the drop-in export mode of `TideFishRenderExporter` for Minecraft 1.21.1.

## What it does

The mod runs inside the real Fabric client and uses the running modpack as its source of truth.

1. It waits until a client world and player exist.
2. It discovers fish from `com.li64.tide.data.TideData.FISH`.
3. For each runtime fish it constructs the real fish `ItemStack`.
4. It applies supported Tideborne visual specimen components when Tideborne is loaded.
5. It inserts the stack into Tide's real `FishDisplayBlockEntity`.
6. It renders with Tide's real `FishDisplayRenderer` into a transparent 1024x1024 framebuffer.
7. It crops and pads the source-authentic render.
8. It records runtime provenance, failures, renderer classes, entity IDs, and PNG hashes.
9. It packages everything into one ZIP.

There is no AI art, item-sprite fallback, reconstructed model fallback, or raw entity-render fallback in this runtime bundle path. If Tide's Fish Display cannot render an entry, the exporter records a failure instead of inventing a replacement.

## Requirements

- Minecraft 1.21.1
- Java 21
- Fabric Loader 0.18.4 or newer compatible 0.18.x loader
- Fabric API 0.116.15+1.21.1 or newer compatible 1.21.1 build
- Tide 2.1.1
- the other fish/compatibility mods from the modpack
- Tideborne 1.3.57 or a compatible later build if Tideborne visual variants should be exported

## Build the mod

From `tools/fish-render-export/TideFishRenderExporter`:

```bash
gradle --no-daemon clean build
```

Use the normal remapped JAR from `build/libs/`, not the `-sources.jar`.

The GitHub Actions workflow `Build and smoke Tide Fish Render Exporter` also publishes the compiled JAR in its `tide-fish-render-exporter` artifact.

## Use it in a real modpack

1. Copy the built `tide-fish-render-exporter-*.jar` into the Fabric modpack's `mods/` folder.
2. Launch Minecraft normally with the complete modpack.
3. Enter any single-player world or connected world.
4. After the client has been ready for about 100 ticks, the exporter starts automatically.
5. Leave the world open while the export runs. Rendering a large modpack can temporarily pause the client because the renders are produced on the render thread.
6. When complete, Minecraft prints the output path in chat and in `latest.log`.

The ZIP is written under:

```text
.minecraft/tide-fish-exports/
```

with a name like:

```text
tide-fish-runtime-export-<cache-key>-<utc-time>.zip
```

Upload that ZIP directly when updating the Tideborne Fish Wiki.

## Manual export

While in a world:

```text
/fishexport
```

or:

```text
/fishexport bundle
```

starts another export.

To disable automatic first-world export, launch with:

```text
TIDE_FISH_RUNTIME_AUTO=false
```

The environment variable is mainly intended for development and automated launchers.

## ZIP layout

```text
manifest.json
environment.json
fish-catalog.json
render-report.json
failures.json
README.txt
renders/
  <namespace>__<fish>.png
  <namespace>__<fish>__albino.png
  <namespace>__<fish>__giant.png
  ...
```

`environment.json` contains the loaded mod IDs, versions, non-sensitive origin filenames, SHA-256 hashes for regular JAR origins, and a deterministic environment fingerprint.

`fish-catalog.json` is generated from the actual runtime `TideData.FISH` map rather than the Wiki's maintained registry.

`render-report.json` contains renderer provenance and one success/failure row per attempted fish/variant render.

`failures.json` preserves explicit failures so unsupported or broken fish are visible instead of silently replaced.

## Variants

Without Tideborne, the exporter renders only the runtime default Fish Display state.

When Tideborne is loaded, the current visual export set is:

- default
- iridescent
- scarred
- parasite_ridden
- albino
- giant
- dwarf

`perfect_specimen` is intentionally not exported as a visual variant because it is a specimen/score condition rather than a distinct visual mutation in the exporter contract.

## Cache

The exporter caches renders under:

```text
.minecraft/tide-fish-export-cache/<cache-key>/
```

The cache key includes the loaded mod environment fingerprint and runtime fish-catalog fingerprint. Re-running an unchanged modpack can therefore reuse existing PNGs.

Changing the installed mod JARs, mod versions, or runtime Tide fish catalog changes the cache key and produces a new render cache.

## CI-only controls

These are not normally needed by players:

- `TIDE_FISH_RUNTIME_FILTER=tide:tuna,othermod:fish` restricts runtime discovery after `TideData.FISH` enumeration and fails if a requested ID is missing.
- `TIDE_FISH_RUNTIME_EXIT_AFTER_EXPORT=true` requests a clean Minecraft client shutdown after the export attempt.

The exporter smoke workflow uses these to prove that the portable ZIP path can boot a real client, discover `tide:tuna` from Tide at runtime, render it through Tide's Fish Display, package it, and validate the PNG and provenance from inside the ZIP.
