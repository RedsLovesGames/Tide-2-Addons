# Tide-2-Addons mega maintenance prompt

Use this prompt for a new ChatGPT/Codex session when broad repository maintenance is needed. Do not blindly redo completed work. Read `AGENTS.md` and `.ai/state.json` first, inspect the current `dev` head, and continue from evidence.

## Mission

Work directly on `RedsLovesGames/Tide-2-Addons` on branch `dev`. Improve the repository so both humans and AI can develop, validate, render, and maintain the Tideborne documentation and Fish Wiki without repeatedly re-auditing the whole project.

Preserve the public site behavior and visual design unless a code change is required to remove backend duplication or fix a verified bug. Do not redesign the Fish Wiki as part of maintenance-only work.

## Non-negotiable rules

1. `dev` is development/integration. `main` is production. A workflow triggered by `dev` must never commit or push a preview snapshot into `main`.
2. Do not reference deleted historical branches in active workflow triggers or push targets.
3. Do not fabricate fish, FishData, entity mappings, textures, geometry, renderer behavior, variants, or provenance.
4. Source-backed renders must come from the actual Minecraft/Tide rendering stack or verified source assets. Missing renders stay unavailable.
5. CI must build the checked-in source. Do not use `sed` or temporary source rewrites to silently create a different Java/Gradle program before compilation. Express runtime differences as explicit properties, profiles, or inputs.
6. Keep source inputs, generators, validators, manifests, runtime consumers, and documentation on the same schema contract.
7. Before editing large generated files, read `.ai/generated-files.json` and change the producer/canonical input instead whenever possible.
8. Prefer machine-readable state and evidence. Do not create another giant continuation prompt when `.ai/state.json` can carry the fact.
9. Do not claim success without current CI/runtime evidence.

## Required audit order

1. Inspect the current `dev` head and current branch list.
2. Inspect current workflow triggers and push targets. Remove stale branch references.
3. Inspect failed/recent Actions runs before changing renderer code.
4. Run or reason through fast Fish Wiki validation and render-manifest validation.
5. Check that `assets/fish-render-manifest.json` and `scripts/validate-fish-render-manifest.py` agree on path and status semantics.
6. Check renderer workflows for source mutation, duplicated setup, and hidden version changes.
7. Check upstream version declarations for duplication against `tools/fish-render-source/source-manifest.json`.
8. Check frontend script ownership only after backend/data contracts are stable.

## Desired repository properties

- A short `AGENTS.md` that explains branch policy, authority, generated files, validation, and the render contract.
- `.ai/state.json`, `.ai/repo-map.json`, and `.ai/generated-files.json` kept current.
- `.gitignore` covering build/run/cache/QA work directories without ignoring committed site outputs.
- One obvious command surface for common validation.
- Active workflows target `dev` and PRs to `main`.
- Development preview workflow uploads an artifact and never writes to `main`.
- Audit/schema reports are workflow artifacts rather than bot commits.
- Render manifest validator accepts only explicit current source-backed statuses and resolves repository-relative render paths correctly.
- Hybrid Aquatic baseline/late runtime selection is explicit through Gradle properties or profiles rather than workflow source rewriting.
- Renderer orientation used by CI is committed/configured, not patched with `sed`.
- Expensive render workflows keep source authenticity evidence and validate output before publishing.
- Large generated registries remain generated and documented as such.

## Safe execution strategy

Make coherent commits in roughly this order:

1. Repository operating contract and AI state.
2. Branch/workflow trigger cleanup and dev-preview isolation.
3. Validator/schema alignment.
4. Artifact-only audit/schema workflows.
5. Explicit renderer runtime configuration replacing CI source mutation.
6. Fast CI validation on `dev`.
7. Renderer/build smoke validation.
8. Carefully consolidate frontend patch layers only after the above is green.

If a broad refactor would risk breaking currently validated renders, leave a precise item in `.ai/state.json` and make the smaller architectural improvement that can be proven now.
