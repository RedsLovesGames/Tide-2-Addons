# TideFishRenderExporter

Fabric 1.21.1 client-side exporter that renders Fish Wiki PNGs through Tide's actual Fish Display renderer.

## What makes the renders authentic

The exporter does not implement fish geometry, texture selection, display transforms, or external-mod rendering. At runtime it reflectively loads Tide 2.1.1's real `FishDisplayBlockEntity` and `FishDisplayRenderer`, gives the display the real fish `ItemStack`, and invokes Tide's renderer into an offscreen framebuffer. Tide remains responsible for `DisplayData`, NBT, Hybrid Aquatic variant handling, length scaling, and delegation to Minecraft's registered entity renderer.

Reflection is used only to avoid bundling or redistributing Tide inside this project. Tide must still be installed at runtime.

## Build

Requires Java 21 and internet access for Fabric/Minecraft Gradle dependencies:

```bash
gradle build
```

The compiled mod is written to `build/libs/`.

## Runtime

Install in a Fabric 1.21.1 client with:

- Fabric API 0.116.15+1.21.1 or compatible
- Tide 2.1.1
- Tideborne 1.3.57 when Tideborne variants are wanted
- every external compatibility mod whose fish should be rendered

Copy the generated cross-mod registry to either:

- `fish_render_sources/registry/fish-render-registry.json`, or
- `config/tide-fish-render-exporter/fish-render-registry.json`

Open a world, then run:

```text
/fishrender verify
/fishrender export all
/fishrender export tide
/fishrender export tide:tuna
/fishrender export tide:tuna default
/fishrender export tide:tuna all_variants
/fishrender export all all_variants
```

Output is written below `fishrender-output/` in the Minecraft run directory.

## Registry generation

Run the toolkit extractor first against the complete mods folder:

```bash
python scripts/extract_fish_render_sources.py --mods ./mods --out ./fish_render_sources
```

Only JARs present in that scan can become authoritative cross-mod entries.
