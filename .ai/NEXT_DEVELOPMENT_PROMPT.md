# Tide-2-Addons next development execution prompt

Execute this prompt directly against `RedsLovesGames/Tide-2-Addons` on branch `dev`.

This is the next phase after the repository/workflow control-plane cleanup. Do not redo that cleanup unless current evidence shows it regressed.

## Starting state

At preparation time, `dev` head was `cde7a393162a3e851d8f7b42d5bfb9d987cb658b` and the fast validation workflow was green. Treat the current branch head and current Actions results as authoritative if they have advanced.

Before changing code, read:

1. `AGENTS.md`
2. `.ai/state.json`
3. `.ai/repo-map.json`
4. `.ai/generated-files.json`
5. `.ai/next-task.json`

Then inspect the latest `dev` head and recent Actions runs. Do not perform a broad repository re-audit.

## Mission

Finish the next architecture phase of the Tideborne Fish Wiki and renderer so the project has clear runtime ownership, less duplicated frontend logic, stronger renderer reporting, and better regression coverage without changing the intended public design or inventing any fish/render data.

The priority order is:

1. Consolidate Fish Wiki runtime ownership and eliminate patch-after-render behavior.
2. Strengthen browser QA so the consolidation is provably behavior-preserving.
3. Carefully consolidate frontend CSS layers where it can be proven safe.
4. Harden renderer failure/reporting/resource architecture without changing source-authentic rendering behavior.
5. Run the relevant fast, browser, exporter, and renderer checks and update `.ai/state.json` with evidence.

Do not merge to `main` in this task. Work on `dev` only.

# Phase A: Fish Wiki runtime ownership consolidation

## Current architecture problem

The current frontend works, but ownership is fragmented:

- `assets/fish-wiki.js` loads both compressed FishData shards and owns the base catalog/detail renderer.
- `assets/fish-catalog-redesign.js` loads the same FishData shards again plus `fish-render-manifest.json`, duplicates FishScore/size math, then uses a `MutationObserver` to replace card markup after the base catalog renders.
- `assets/fish-detail-nav.js` separately loads the search index, modpack scope, and render manifest, then hides out-of-scope records and replaces runtime renders after the base app has rendered.
- `assets/fish-specimen-lab-stable.js` independently loads FishData/render data again and contains another FishScore/size implementation.
- FishScore and size-envelope rules are therefore duplicated across multiple runtime owners and can drift.

Fix the underlying ownership model rather than adding another patch layer.

## Required target architecture

Create one canonical shared Fish Wiki runtime/data module. The exact filename is your choice, but prefer a stable canonical name such as `assets/fish-core.js` or `assets/fish-runtime.js`.

It must own or expose cached access to:

- both Fish Wiki gzip shards
- the combined FishData record collection
- `assets/fish-render-manifest.json`
- `fish/render-data/modpack-scope.json`
- a record map keyed by fish ID
- current allowed modpack IDs/namespaces
- canonical slug/unslug helpers
- canonical FishScore calculation
- canonical FishScore breakdown calculation
- canonical body/condition size envelopes and bounds
- runtime render variant resolution

All consumers on one page must share the same cached promises/data. Do not let several scripts independently fetch and decompress the same payloads.

### Canonical behavior rules

- Apply modpack scope before the first catalog render. Do not render all records and then hide disallowed cards afterward.
- Resolve source-authentic runtime render paths before card/detail markup is emitted. Do not replace preview markup afterward through a MutationObserver.
- Use one FishScore implementation everywhere. Catalog ranges, legacy detail content if retained, and Specimen Lab must call the same canonical functions.
- Use one size/body/condition implementation everywhere.
- Missing render data stays explicitly unavailable. Never substitute guessed geometry, item sprites, or fabricated images.
- Preserve GitHub Pages base-path compatibility under `/Tide-2-Addons/fish/`.

## Consolidate the catalog

Move the current production card design from `assets/fish-catalog-redesign.js` into the canonical catalog render path in `assets/fish-wiki.js`, or into a clean replacement module that becomes the canonical catalog owner.

After equivalent behavior is proven:

- remove `assets/fish-catalog-redesign.js`
- remove its script include from `fish/index.html`
- remove MutationObservers/listeners that exist only to modernize already-rendered cards

Do not visually redesign the cards. Preserve the current card information hierarchy, runtime fish image behavior, filters, grid/list behavior, search, sort, category navigation, active filter chips, mobile layout, and accessibility.

## Consolidate detail navigation and scope

Integrate the useful behavior currently owned by `assets/fish-detail-nav.js` into the canonical Fish Wiki app/runtime:

- modpack-only scope
- runtime render selection
- previous/next fish navigation
- deep-link scope rejection for unsupported fish
- catalog/search counts derived from the scoped collection

After equivalent behavior is proven, remove `assets/fish-detail-nav.js` and its script include.

Do not preserve a MutationObserver merely because the old file used one. Prefer explicit app lifecycle calls.

## Consolidate the Specimen Lab

`assets/fish-specimen-lab-stable.js` is currently the production modal owner. Convert it into a canonical non-versioned owner, preferably `assets/fish-specimen-lab.js`, rather than keeping `-stable` as a permanent architecture name.

The lab should consume the shared Fish Wiki runtime/data API instead of independently loading FishData/render manifests or maintaining its own FishScore math.

Preserve:

- source-authentic runtime render behavior
- fixed scale visualization
- Body Type controls
- Condition controls
- percentile and length synchronization
- Perfect Specimen percentile floor
- FishScore breakdown
- previous/next navigation
- related fish
- provenance
- keyboard close/focus behavior
- responsive layout
- reduced-motion support

After equivalence is proven, delete the old `fish-specimen-lab-stable.js` file and update `fish/index.html` to load the canonical file.

## Avoid a risky all-at-once module conversion

You may use ES modules if they simplify ownership, but do not convert the entire frontend just for style. A shared cached runtime exposed through an explicit module API or a carefully scoped `window.TideFishRuntime` singleton is acceptable if that results in fewer race conditions and less duplicated work.

The important requirement is one owner for data and rules, not a particular JavaScript module syntax.

# Phase B: browser QA and regression proof

Expand `scripts/qa-fish-wiki.mjs` before deleting the old patch layers so it covers the behavior being consolidated.

Add assertions for at least:

1. FishData shard requests are not duplicated by separate frontend owners.
2. `fish-render-manifest.json` is not repeatedly fetched by several feature scripts.
3. modpack scope is applied to the underlying rendered collection, not just hidden after render.
4. catalog runtime render image is present when a valid runtime render exists.
5. no out-of-scope card exists in the rendered catalog DOM after initial load.
6. grid and list views still work.
7. search, autocomplete, category, habitat, mod, rarity, stars, preview, and sort controls still work.
8. active filter chips and reset behavior still work.
9. `#tide__tuna` deep linking still works.
10. previous/next navigation stays inside the allowed modpack collection.
11. opening the Specimen Lab from a card works.
12. Body Type/Condition/percentile/length controls update the live FishScore and scale readout.
13. Perfect Specimen enforces the current percentile floor.
14. Escape and close controls restore the appropriate state/focus.
15. desktop, tablet, and mobile have no horizontal overflow.
16. light/dark theme persistence still works.
17. console errors, page errors, broken requests, and broken runtime images fail QA.

Keep screenshots as workflow artifacts for the major desktop/mobile states and an open Specimen Lab state.

If a visual change is not required for architecture, do not make it.

# Phase C: CSS ownership cleanup

Only after Phase A and browser QA are green, inspect the current Fish Wiki CSS loading order in `fish/index.html`:

- `fish-wiki.css`
- `fish-wiki-release.css`
- `fish-wiki-v2.css`
- `fish-catalog-redesign.css`
- `fish-readability.css`
- `fish-render-fit.css`
- `fish-specimen-lab.css`
- `fish-specimen-lab-stable.css`

Consolidate clearly superseded overrides into canonical owners where safe.

Preferred end state:

- `fish-wiki.css` owns catalog/page/detail styling.
- `fish-specimen-lab.css` owns the current Specimen Lab styling.
- version/fix/stable override files are removed only when browser QA and screenshots show equivalence.

Do not delete a CSS layer just to reduce file count if you cannot prove the result is equivalent. It is acceptable to leave a precisely documented CSS debt item for a later pass.

# Phase D: renderer hardening

Do this only after frontend/browser work is green.

The current `RenderService` is source-authentic and must stay that way. Do not change the validated Hybrid Aquatic side-profile orientation or replace the real Minecraft/Tide rendering paths.

Preserve:

- Tide `FishDisplayRenderer` / `FishDisplayBlockEntity` path for FishData display renders
- real `EntityRenderDispatcher` direct entity path where required
- direct entity matrix Y rotation `90.0f`
- direct dispatcher yaw `0.0f`
- actual renderer/model/texture behavior
- current baseline and late Hybrid Aquatic runtime profiles

## Improve failure typing

Replace message-substring based failure classification with explicit typed failure codes at the actual failure sites.

Create a small enum or equivalent stable type with categories such as:

- `MISSING_ITEM`
- `MISSING_FISHDATA`
- `MISSING_DISPLAY_DATA`
- `MISSING_ENTITY`
- `ENTITY_MISMATCH`
- `RENDERER_UNAVAILABLE`
- `EMPTY_FRAMEBUFFER`
- `VARIANT_UNSUPPORTED`
- `VARIANT_SETUP`
- `OUTPUT_IO`
- `UNEXPECTED_EXCEPTION`

Use the smallest set that accurately models the real failures. Do not map unrelated failures into a convenient category.

Keep a human-readable error string in reports, but make `failure_code` stable and machine-readable.

## Improve report provenance

Add a report schema version and enough deterministic environment metadata to answer what produced a render report without reading workflow logs. Include what is actually available without fabrication, for example:

- Minecraft version
- exporter version or git/build identifier if available
- render mode/profile
- source/runtime profile
- namespace scope
- render orientation settings for direct entity mode
- source manifest or registry fingerprint when feasible

Do not invent version information that the runtime cannot prove.

## Improve resource lifecycle carefully

`RenderService.beginFrame()` currently creates a new `SimpleFramebuffer` on every fitting pass and `endFrame()` deletes it. Investigate whether a safely reusable framebuffer/context can be used across fitting passes/jobs on the render thread.

Only implement reuse if it preserves render correctness and Minecraft render-state restoration. Otherwise leave the current lifecycle and document why.

Ensure `NativeImage`, framebuffer, and render-state restoration are exception-safe. Prefer structured `try/finally` or `AutoCloseable` helpers where they improve guarantees.

## Reduce `RenderService` responsibility only where proven useful

If the class remains difficult to test/maintain, extract focused components such as:

- render report writer
- frame context/resource owner
- FishDisplay strategy
- direct entity strategy

Do not split code into tiny classes merely for aesthetics. Each extraction must remove a concrete responsibility from `RenderService` and preserve source-authentic behavior.

## Resumability

Investigate resumable rendering only if it can be provenance-safe. Never skip a render solely because a PNG filename exists.

A render may be reused only when its associated metadata proves it was produced by the same relevant source/profile/configuration. If that proof is not easy to establish in this phase, do not implement unsafe skip-existing behavior.

# Workflow verification

After code changes, verify the relevant checks against the current `dev` commit.

At minimum run or confirm current evidence for:

```bash
python3 scripts/validate-repo-structure.py
python3 scripts/validate-fish-wiki.py
python3 scripts/validate-fish-render-manifest.py
node --check assets/app.js
node --check assets/fish-wiki.js
node --check scripts/qa-fish-wiki.mjs
```

Also run/check:

- browser QA workflow
- Tide renderer build/smoke workflow
- Tide one-fish smoke export for `tide:tuna`
- Hybrid Aquatic baseline renderer smoke/evidence
- Hybrid Aquatic late-runtime smoke/evidence when the changed code affects direct entity rendering

Do not run a full expensive render matrix unnecessarily if only frontend files changed. If renderer code changes, use the smallest source-authentic smoke first, then broader validation.

# Acceptance criteria

The phase is complete when all of the following are true:

- one canonical runtime/data owner supplies FishData, render manifest, scope, and FishScore/size rules
- catalog does not depend on a post-render redesign MutationObserver
- modpack scope is applied before catalog rendering
- runtime image selection happens before markup is emitted
- FishScore/size math is not duplicated across catalog and Specimen Lab
- `fish-catalog-redesign.js` is removed after behavior is absorbed
- `fish-detail-nav.js` is removed after behavior is absorbed
- Specimen Lab uses a canonical non-versioned production file and shared runtime data
- browser QA covers the consolidated behaviors and is green
- no visual redesign was introduced unintentionally
- renderer reports use explicit stable failure codes if renderer hardening was performed
- source-authentic Tide and direct entity rendering remain unchanged in meaning
- fast validation is green on the final `dev` head
- relevant slower QA/smoke checks have current success evidence, or any external blocker is precisely recorded
- `.ai/state.json`, `.ai/repo-map.json`, and `.ai/next-task.json` are updated to reflect the resulting architecture

# Commit discipline

Use coherent commits. A good sequence is:

1. Add shared Fish Wiki runtime/data layer plus QA coverage.
2. Move catalog/scope/runtime-render ownership into the canonical app and remove obsolete JS patch files.
3. Migrate Specimen Lab to shared runtime and canonical filename.
4. Consolidate safe CSS layers with screenshot-backed QA.
5. Add typed renderer failures/provenance/resource hardening if frontend work is green.
6. Update AI state/maps after validation.

If the branch advances while working, refresh the current file SHA before updating it. Never overwrite newer unrelated work.

# Final response requirements

Report:

- final `dev` commit SHA
- files created/changed/deleted
- architecture ownership after the change
- exact validations/workflow runs that passed
- renderer smoke evidence if renderer code changed
- any work intentionally deferred and why
- any account-level GitHub setting still requiring manual action

Do not say something is fixed unless current code or CI evidence proves it.