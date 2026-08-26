# Tide dynamic render sources

Built from all supplied mod JARs plus the attached Tideborne JAR.

**Supported entries in this exact mod set: 182.**

Start with `registry/supported-fish-registry.json`, `registry/mod-render-registry.json`, and `registry/fish-source-file-index.json`.

`render_sources/<namespace>/` contains the actual rendering inputs: Java model/renderer/entity-variant class files plus textures, item/model metadata, geo JSON, animation JSON, and material maps. `javap/` contains readable bytecode dumps for core and fish-specific classes that finished before bundle creation.

The browser phase should normalize these inputs into a web model format. Java `.class` files cannot execute in a webpage directly. Geo JSON can be translated directly; Java ModelPart geometry must be ported from the included model classes. Keep render layers, emissive textures, NBT variants, and Tide `display_data`.

The full Tide Extra Compatibility catalog contains entries for mods you did not supply. Those are deliberately not counted as supported and are listed in `reports/unsupported-compat-fish.json`.
