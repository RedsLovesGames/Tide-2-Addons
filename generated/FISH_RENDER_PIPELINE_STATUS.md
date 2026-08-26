# Fish Render Pipeline Status

Status: **runtime render pending**

The Fabric 1.21.1 exporter compiles successfully and is designed to call Tide 2.1.1's actual `FishDisplayBlockEntity` and `FishDisplayRenderer`. No generated or substitute fish art is accepted.

Current supplied toolkit registry: **102 Tide fish**.

The current supplied workspace does not contain the actual external compatibility mod JAR set needed to regenerate an authoritative cross-mod registry, and this environment cannot launch a graphical Minecraft client with the render thread. Therefore authentic PNG generation and in-game visual QA have not been executed here. Production `main` must remain unchanged until those runtime gates pass.

## Runtime commands

```text
/fishrender verify
/fishrender export all
/fishrender export all all_variants
```

Before the runtime export, regenerate the cross-mod registry against the complete mods folder:

```bash
python scripts/extract_fish_render_sources.py --mods ./mods --out ./fish_render_sources
```
