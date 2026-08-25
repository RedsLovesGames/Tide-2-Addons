# Tideborne documentation

Static GitHub Pages documentation for **Tideborne 1.3.28** on Minecraft 1.21.1.

## Structure

- `index.html`: lightweight documentation shell
- `assets/content.js`: documentation, dependency data, and exact recipe data
- `assets/app.js`: hash routing, navigation, search, TOC, recipes, theme, and mobile behavior
- `assets/styles.css`: centralized deep-ocean design system and responsive layout
- `assets/items/`: Tideborne item textures extracted from the audited 1.3.28 JAR
- `assets/logo.svg`: retained existing site logo for this release

There is no framework and no build step. GitHub Pages can publish the repository root directly.

## Source of truth

The redesign was written against `Tideborne-1.3.28-top-fish-3d-preview.jar`. `fabric.mod.json`, packaged recipe JSONs, current resources, and compiled 1.3.28 behavior take precedence over older standalone Tide Traits, Tide Team Journal, Tide Multiplayer Extras, or Tidebound Compatibility documentation.
