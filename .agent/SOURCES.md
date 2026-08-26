# Tideborne Fish Wiki Sources

This file records what future sessions can trust without repeating discovery.

## AVAILABLE

### FishData authority

- **Tide 2.1.1**
  - Pinned source commit: `876b95f31328f4e698d5150f7d840ab033d1b06d`
  - Used by `.github/workflows/build-fish-wiki-data.yml`
  - Authoritative for Tide FishData in the current generated dataset.
- **Tide Extra Compatibility 2.2.0**
  - Modrinth version ID: `Uz6Vlhjs`
  - Used by `.github/workflows/build-fish-wiki-data.yml`
  - Authoritative for current compatibility FishData in the generated dataset.
- Generated FishData:
  - `assets/fish-wiki-data-0.json.gz`
  - `assets/fish-wiki-data-1.json.gz`
- Generated search index:
  - `assets/fish-search-index.json`
- Generated build report:
  - `scripts/fish-build-report.txt`
- Generated source inventory:
  - `scripts/fish-source-inventory.txt`
- Atlas metadata location:
  - embedded in the FishData `meta.atlas` block. There is no separate atlas metadata file in the current build.

### Fish/render provenance

- `assets/fish-render-manifest.json`
  - Current source-backed per-condition documentation manifest.
  - Contains a validated Tide Tuna subset only.
- `tools/TideFishRenderExporter/`
  - Fabric 1.21.1 authentic render exporter scaffold.
  - Uses Tide 2.1.1 Fish Display behavior at runtime rather than reimplementing fish geometry.
- `generated/FISH_RENDER_PIPELINE_STATUS.md`
  - Current runtime gate and exporter commands.

### Repository/deployment authority

- Working branch: `fish-wiki-production`
- Production source branch: `main`
- Production host: GitHub Pages
- Production root: `https://redslovesgames.github.io/Tide-2-Addons/`
- Fish Wiki: `https://redslovesgames.github.io/Tide-2-Addons/fish/`

### Tideborne version evidence currently in repository

- `assets/latest-1357.js` targets and tests Tideborne **1.3.57** behavior/documentation.
- `tools/TideFishRenderExporter/README.md` specifies Tideborne **1.3.57** for Tideborne render variants.
- The older root README text referenced 1.3.28 and should not be treated as a SHA-backed current JAR audit.

## MISSING

- The exact authoritative Tideborne 1.3.57 JAR file.
- Its SHA-256.
- A cached full Tideborne 1.3.57 mechanic audit tied to that SHA-256.
- The complete external compatibility mod JAR folder required to regenerate all authentic cross-mod renders.
- A graphical Minecraft render runtime in this repository environment.

## OPTIONAL

- Temporary Vercel preview for hosted QA only. It is not a production source and must not replace GitHub Pages.
- Additional external source repositories may be used only to verify models/textures when their version matches the installed compatibility JAR being rendered.

## OUTDATED / DO NOT TREAT AS CURRENT AUTHORITY

- Any Tideborne 1.3.28 mechanic statement that conflicts with `assets/latest-1357.js` or a future SHA-backed 1.3.57 JAR audit.
- Previous prompts or conversation summaries when repository evidence or authoritative source inputs disagree.
- Unvalidated fish images, malformed renders, item textures used as entity substitutes, or generated/fake fish art.

## Source update procedure

When an authoritative input changes:

1. Update `.agent/source-state.json`.
2. Mark affected cached/generated work stale in `STATUS.md` and `TODO.md`.
3. Rebuild only artifacts invalidated by that input.
4. Run the relevant validators.
5. Record the new source/version/hash and validation result before claiming the work current.
