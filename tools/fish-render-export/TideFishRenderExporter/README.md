# TideFishRenderExporter

Fabric 1.21.1 client utility that exports transparent PNGs from Tide's actual Fish Display entity rendering path. It does not convert models, invent geometry, use screenshots as source art, or substitute item sprites for failed entity renders.

The exporter creates the real fish `ItemStack`, sets Tide's real `TideItemData.FISH_LENGTH`, passes the stack through `FishDisplayBlockEntity#setDisplayStack`, and invokes Tide's `FishDisplayRenderer`. Tide then creates the entity from `DisplayData`, applies compatibility variant logic such as Hybrid Aquatic when that mod is actually loaded, and delegates to Minecraft's registered `EntityRenderDispatcher`.

## Build

Requires Java 21 and Gradle 8.x:

```bash
gradle clean build
```

The build resolves exact Tide 2.1.1 for Minecraft 1.21.1 from Modrinth Maven. When built inside this repository it also bundles `fish/render-data/registry/supported-fish-registry.json` as the default 182-fish registry.

## Runtime

Put the built JAR in a Fabric 1.21.1 client with Tide 2.1.1, Fabric API, the relevant compatible owning mods, and optionally Tideborne 1.3.57+ for specimen variants. Open a world before running commands.

Commands:

```text
/fishrender verify
/fishrender export all
/fishrender export all all_variants
/fishrender export tide
/fishrender export tide:tuna
/fishrender export tide:tuna iridescent
/fishrender export tide:tuna scarred
/fishrender export tide:tuna parasite_ridden
/fishrender export tide:tuna albino
/fishrender export tide:tuna giant
/fishrender export tide:tuna dwarf
/fishrender export tide:tuna perfect_specimen
/fishrender export tide:tuna all_variants
/fishrender export namespace aquaculture
```

Outputs are written below `fishrender-output/` in the Minecraft run directory:

```text
fish/assets/renders/<namespace>__<fish>.png
generated/render-report.json
generated/missing-renders.json
```

The source framebuffer is 1024x1024 with transparent clear color. The exporter alpha-bounds the real silhouette, automatically adjusts framing to avoid clipping or microscopic fish, then crops with transparent padding. PNGs stay at native rendered pixels, so no smoothing resize step is introduced.

## Loader limitation

The source registry can inventory render provenance from Fabric and NeoForge/Forge archives, but this exporter is a Fabric client mod. A non-Fabric owning mod cannot be loaded into this runtime unless a legitimate Fabric build or a proven compatibility layer exists. Such fish must remain failed/unrendered rather than being approximated.
