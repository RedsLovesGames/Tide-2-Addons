# Tideborne documentation

Static GitHub Pages documentation for Tideborne, with the active repository documentation/runtime overlay targeting **Tideborne 1.3.57** on Minecraft 1.21.1.

## Structure

- `index.html`: lightweight documentation shell
- `fish/index.html`: integrated Fish Wiki subsection
- `assets/content.js`: documentation, dependency data, recipe data, and structured equipment reference data
- `assets/latest-1357.js`: current 1.3.57 documentation/runtime corrections layered over older base content
- `assets/app.js`: hash routing, navigation, search, TOC, recipes, equipment tables, theme, and mobile behavior
- `assets/fish-wiki*.js/css`: Fish Wiki catalog, detail, search, and UI behavior
- `scripts/`: FishData generation, deterministic validation, and browser QA
- `.agent/`: persistent development status, source tracking, validation rules, and the short continuation prompt
- `tools/TideFishRenderExporter/`: Fabric 1.21.1 authentic fish-render exporter scaffold

The site remains framework-free and deploys from the repository root through GitHub Pages.

## Development

Future AI/Codex sessions should read `AGENTS.md` and `.agent/STATUS.md` before editing.

Primary deterministic validation:

```bash
npm run validate
```

The authoritative FishData build currently pins Tide 2.1.1 commit `876b95f31328f4e698d5150f7d840ab033d1b06d` and Tide Extra Compatibility 2.2.0 Modrinth version `Uz6Vlhjs`.

The repository targets Tideborne 1.3.57 behavior, but the exact authoritative Tideborne JAR and its SHA-256 are not stored in this repository. Until a SHA-backed audit is cached under `docs/generated/audits/`, do not treat older version text as stronger evidence than the supplied authoritative JAR.
