# Tideborne Fish Wiki Validation

## Primary command

```bash
npm run validate
```

This is the deterministic repository gate. It runs:

- JavaScript syntax checks for the static site scripts.
- `scripts/validate-static-site.mjs`
  - required static files,
  - local HTML `href`/`src` targets,
  - case-sensitive path mistakes,
  - unsafe root-relative asset paths,
  - hard-coded Fish Wiki hash IDs that do not exist.
- `scripts/validate-provenance.mjs`
  - FishData preview status policy,
  - explicit notes for unavailable/unreconstructed states,
  - required provenance for any future `exact`/`representative` claims,
  - render-manifest source/entity/reason rules,
  - render-manifest fish IDs against the FishData set.
- `scripts/validate-source-state.mjs`
  - source-state schema,
  - pinned Tide/Tide Extra identifiers against builder/inventory evidence,
  - tracked repository artifact Git blob hashes.
- `scripts/validate-fish-wiki.py`
  - FishData JSON/gzip decode,
  - unique namespace-aware IDs,
  - required fields,
  - numeric size sanity,
  - preview enums,
  - record/meta counts,
  - atlas shard existence/decode/dimensions/bounds,
  - duplicate atlas coordinates,
  - blank/opaque sprite checks,
  - search-index completeness and duplicates.
- `scripts/validate-fish-render-manifest.py`
  - claimed PNG existence/decode,
  - transparent padding,
  - source-backed file status,
  - unavailable-state handling,
  - manifest count consistency.

Pillow is required by the Python image validators.

## Focused commands

```bash
npm run validate:static
npm run validate:provenance
npm run validate:state
npm run validate:fish
npm run validate:renders
```

Browser QA:

```bash
npm run qa:browser
```

`qa:browser` requires Playwright/Chromium and a GitHub Pages-style local server. The GitHub Actions workflow `.github/workflows/qa-fish-wiki-browser.yml` installs and runs this automatically.

## Current known validation status

At development head `e7f7654b1fa377bdd2403befc85bba3fe0409c6b` before this workflow optimization:

- **Validate Fish Wiki:** PASS
- **QA Fish Wiki Browser:** PASS
- **Authentic cross-mod render source/visual review:** NOT RUN, blocked by runtime/mod inputs
- **Production merge gate:** NOT PASSED

Future sessions must update `STATUS.md` with new run results.

## Manual/source checks that automation cannot prove

For every claimed exact or representative fish render:

- correct entity/model,
- correct packaged texture,
- correct DisplayData/renderer behavior,
- correct side orientation,
- fins/tail/head visible,
- no stretching/clipping,
- glow/translucent layers correct,
- variant is legitimate and representative labels are honest.

Programmatic coordinate/image checks do not certify these points.

## Production validation gate

Do not merge `fish-wiki-production` to `main` unless all applicable items pass:

1. `npm run validate`.
2. Browser QA workflow passes.
3. FishData/source counts are current for the pinned authoritative inputs.
4. Every claimed exact/representative render passes manual source/model/texture/orientation review.
5. No fake/substitute render is present.
6. Existing wiki regression checks pass.
7. Mobile checks at 360px, 390px, tablet, and desktop pass.
8. GitHub Pages base-path behavior remains `/Tide-2-Addons/` safe.
9. Known blockers in `STATUS.md` are resolved or explicitly accepted as non-production-blocking.
10. After an approved merge, actual GitHub Pages production is checked, including `/`, `/fish/`, and a known direct fish hash such as `/fish/#tide__tuna`.

Passing deterministic CI alone is not sufficient while the authentic render runtime gate remains open.
