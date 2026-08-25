# Tideborne documentation

Static GitHub Pages documentation for **Tideborne 1.3.28** on Minecraft 1.21.1.

## Structure

- `index.html`: lightweight documentation shell
- `assets/content.js`: documentation, dependency data, exact Tideborne recipe data, and structured equipment reference data
- `assets/app.js`: hash routing, navigation, search, TOC, graphical recipes, equipment tables, theme, and mobile behavior
- `assets/styles.css`: centralized deep-ocean design system and responsive layout
- `assets/items/`: Tideborne item textures extracted from the audited 1.3.28 JAR
- recipe ingredient textures are embedded in the renderer from verified upstream source assets
- `assets/logo.svg`: retained existing site logo for this release

There is no framework and no build step. GitHub Pages can publish the repository root directly.

## Source of truth

Tideborne behavior and recipes are documented against `Tideborne-1.3.28-top-fish-3d-preview.jar`. `fabric.mod.json`, packaged recipe JSONs, current resources, and compiled 1.3.28 behavior take precedence over older standalone Tide Traits, Tide Team Journal, Tide Multiplayer Extras, or Tidebound Compatibility documentation.

The Tide equipment reference and Tide-owned recipe ingredient art use Tide 2.1.1 source from `Lightning-64/Tide-2`. Myths-owned recipe ingredient art uses the public Myths of the Sea source repository. Vanilla recipe ingredient icons use extracted Minecraft 1.21.1 assets. Tideborne-owned outputs use the textures packaged in the audited Tideborne JAR.
