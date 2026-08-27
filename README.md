# Tideborne documentation

Static GitHub Pages documentation for **Tideborne 1.3.57** on Minecraft 1.21.1, including the integrated Tideborne Fish Wiki.

The deployed website is static and does not require a runtime application server or frontend framework. Repository maintenance does include Python data generation/validation, Node browser QA, Java/Fabric renderer tooling, and GitHub Actions.

## Start here for development

Humans and AI agents should read these files before broad changes:

- `AGENTS.md`: permanent branch, authority, rendering, validation, and change rules
- `.ai/state.json`: current machine-readable project state
- `.ai/repo-map.json`: compact subsystem map
- `.ai/generated-files.json`: generated-file ownership and direct-edit policy
- `justfile`: common validation and maintenance commands

`dev` is the active integration branch. `main` is production source. Development workflows must not write preview snapshots into `main`.

## Site structure

- `index.html`: lightweight documentation shell
- `fish/index.html`: Fish Wiki entry point under the same GitHub Pages site
- `assets/content.js`: documentation, dependency data, recipes, and structured equipment reference data
- `assets/app.js`: hash routing, navigation, search, TOC, graphical recipes, equipment tables, theme, and mobile behavior
- `assets/styles.css`: shared deep-ocean design system and responsive layout
- `fish/assets/renders/`: validated source-backed Fish Wiki PNG renders
- `fish/render-data/`: public render scope, provenance, and generated registry data

## Data and renderer tooling

- `scripts/build-fish-wiki.py`: deterministic Fish Wiki payload generator
- `scripts/validate-fish-wiki.py`: committed FishData/site payload gate
- `scripts/validate-fish-render-manifest.py`: published render-manifest/PNG gate
- `scripts/validate-repo-structure.py`: branch/workflow/AI-maintenance architecture gate
- `tools/fish-render-source/`: pinned source downloader and FishData/render-source inventory pipeline
- `tools/fish-render-export/TideFishRenderExporter/`: client-only Fabric helper that renders through the real Tide/Minecraft entity rendering stack

Use `just validate` for the normal fast repository checks when `just` is available. The equivalent commands are documented in `AGENTS.md`.

## Source of truth

Tideborne behavior and recipes are documented against the packaged 1.3.57 release artifacts represented by the current site data. Packaged `fabric.mod.json`, recipe JSON, current resources, and compiled behavior take precedence over older standalone Tide Traits, Tide Team Journal, Tide Multiplayer Extras, or Tidebound Compatibility documentation.

FishData and render-source dependencies are pinned and verified through `tools/fish-render-source/source-manifest.json`. Tide equipment reference data is based on Tide 2.1.1. The Fish Wiki uses Tide Extra Compatibility 2.2.0 for compatibility FishData. Source-backed fish renders must come from actual source assets or the real Minecraft/Tide entity renderer. Missing render evidence stays unavailable rather than being replaced with invented artwork.
